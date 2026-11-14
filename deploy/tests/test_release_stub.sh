#!/usr/bin/env bash
# Offline release/rollback checks: all cloud commands are fail-closed local stubs.
# Run from repo root: bash deploy/tests/test_release_stub.sh
# Synthetic A/B SHAs and digests below are fixtures, never actual deployment evidence.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TASK_TMP="$(mktemp -d)"
trap 'rm -rf "$TASK_TMP"' EXIT
export TASK_TMP PROJECT_ID=release-test REGION=asia-southeast1
export A_TAG=1111111111111111111111111111111111111111
export B_TAG=2222222222222222222222222222222222222222
export A_DIGEST=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export B_DIGEST=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
export IMAGE_TAG="$B_TAG"
export IMAGE_BASE="$REGION-docker.pkg.dev/$PROJECT_ID/techtent/techtent"
export CALL_LOG="$TASK_TMP/calls" GITHUB_ENV="$TASK_TMP/env"
export PATH="$TASK_TMP:$PATH"
cat > "$TASK_TMP/gcloud" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$CALL_LOG"
case "$*" in
  'artifacts docker images describe '*)
    [[ "${FAIL_AT:-}" != image ]] || exit 1
    case "${5:-}" in
      "$IMAGE_BASE:$A_TAG") echo "$IMAGE_BASE@sha256:$A_DIGEST" ;;
      "$IMAGE_BASE:$B_TAG") echo "$IMAGE_BASE@sha256:$B_DIGEST" ;;
      *) echo 'Unknown fixture image tag' >&2; exit 1 ;;
    esac ;;
  'run jobs update techtent-migrate '*) ;;
  'run jobs execute techtent-migrate '*) [[ "${FAIL_AT:-}" != migration ]] || exit 1 ;;
  'run services update techtent '*)
    printf '%s\n' "${5#--image=}" > "$TASK_TMP/latest-image" ;;
  'run services update-traffic techtent --to-latest '*)
    # Model --to-latest using the immediately preceding image update.
    test -s "$TASK_TMP/latest-image"
    cp "$TASK_TMP/latest-image" "$TASK_TMP/traffic-image" ;;
  'run services describe techtent '*) echo 'https://demo.example.test' ;;
  *) echo 'Unexpected cloud operation blocked by stub' >&2; exit 1 ;;
esac
STUB
cat > "$TASK_TMP/forbidden" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "${0##*/}" >> "$TASK_TMP/forbidden-calls"
echo 'Build, seed or provisioning tool blocked by offline test' >&2
exit 1
STUB
chmod +x "$TASK_TMP/gcloud" "$TASK_TMP/forbidden"
for tool in docker npm npx node tsx prisma psql openssl; do
  cp "$TASK_TMP/forbidden" "$TASK_TMP/$tool"
done

reset_fixture() {
  : > "$CALL_LOG"
  : > "$GITHUB_ENV"
  rm -f "$TASK_TMP/latest-image" "$TASK_TMP/traffic-image" "$TASK_TMP/forbidden-calls"
}
assert_image_and_traffic() {
  local digest="$1"
  grep -Fxq "DEPLOYED_IMAGE=$IMAGE_BASE@sha256:$digest" "$GITHUB_ENV"
  grep -Fxq 'SERVICE_URL=https://demo.example.test' "$GITHUB_ENV"
  grep -Fxq "$IMAGE_BASE@sha256:$digest" "$TASK_TMP/traffic-image"
  test ! -e "$TASK_TMP/forbidden-calls"
}

# Normal release B: resolve SHA, migrate, then update image and traffic in order.
reset_fixture
ROLLBACK=false bash "$ROOT/deploy/release.sh"
cat > "$TASK_TMP/expected" <<EOF
artifacts docker images describe $IMAGE_BASE:$B_TAG --project=$PROJECT_ID --format=value(image_summary.fully_qualified_digest)
run jobs update techtent-migrate --image=$IMAGE_BASE@sha256:$B_DIGEST --project=$PROJECT_ID --region=$REGION --quiet
run jobs execute techtent-migrate --wait --project=$PROJECT_ID --region=$REGION --quiet
run services update techtent --image=$IMAGE_BASE@sha256:$B_DIGEST --project=$PROJECT_ID --region=$REGION --quiet
run services update-traffic techtent --to-latest --project=$PROJECT_ID --region=$REGION --quiet
run services describe techtent --project=$PROJECT_ID --region=$REGION --format=value(status.url)
EOF
diff -u "$TASK_TMP/expected" "$CALL_LOG"
assert_image_and_traffic "$B_DIGEST"
echo 'PASS normal B release resolves requested SHA, waits for migration, then updates image and traffic'

# Both restore A and roll forward to B reuse existing images, without DB changes.
for target in A B; do
  reset_fixture
  if [[ "$target" == A ]]; then export IMAGE_TAG="$A_TAG"; digest="$A_DIGEST"
  else export IMAGE_TAG="$B_TAG"; digest="$B_DIGEST"; fi
  ROLLBACK=true bash "$ROOT/deploy/release.sh"
  cat > "$TASK_TMP/expected" <<EOF
artifacts docker images describe $IMAGE_BASE:$IMAGE_TAG --project=$PROJECT_ID --format=value(image_summary.fully_qualified_digest)
run services update techtent --image=$IMAGE_BASE@sha256:$digest --project=$PROJECT_ID --region=$REGION --quiet
run services update-traffic techtent --to-latest --project=$PROJECT_ID --region=$REGION --quiet
run services describe techtent --project=$PROJECT_ID --region=$REGION --format=value(status.url)
EOF
  # Exact call list excludes migration, seed jobs, builds, provisioning and named-revision routing.
  diff -u "$TASK_TMP/expected" "$CALL_LOG"
  assert_image_and_traffic "$digest"
  echo "PASS image restore $target uses exact requested SHA/digest and latest traffic; no migration, seed, build or provisioning"
done

for failure in image migration; do
  reset_fixture
  if ROLLBACK=false FAIL_AT="$failure" bash "$ROOT/deploy/release.sh"; then
    echo "Expected $failure failure" >&2; exit 1
  fi
  test ! -e "$TASK_TMP/latest-image"
  test ! -e "$TASK_TMP/traffic-image"
  echo "PASS $failure failure blocks service and traffic update"
done

reset_fixture
if IMAGE_TAG='invalid;tag' ROLLBACK=true bash "$ROOT/deploy/release.sh"; then exit 1; fi
test ! -s "$CALL_LOG"
echo 'PASS invalid tag rejected before cloud calls'

reset_fixture
if IMAGE_TAG=3333333333333333333333333333333333333333 ROLLBACK=true bash "$ROOT/deploy/release.sh"; then exit 1; fi
test ! -e "$TASK_TMP/latest-image"
test ! -e "$TASK_TMP/traffic-image"
echo 'PASS unavailable rollback image blocks service and traffic update'
