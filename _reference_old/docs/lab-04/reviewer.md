# Lab 4 — Peer Review Record

**Author:** Pattarapon Sribuathong — 67070503434 — GitHub: @PAKATO123
**Peer reviewer:** Tammathorn Kananurak — 67070503489 — GitHub: @Tammathorn

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| #63 | feature/lab04-00-foundations | Approved |
| #64 | feature/lab04-01-actions-taken | Approved |
| #65 | feature/lab04-02-role-dashboards | Approved |
| #70 | feature/lab04-e2e-and-hardening | Approved |

**Branch 0 - feature/lab04-00-foundations**
https://github.com/PAKATO123/toktickit/pull/63
| Verdict | Approved |
Reviewer comment I received: Docs and test stubs match the handout structure. approve

How I responded: -

**Branch 1 - feature/lab04-01-actions-taken**
https://github.com/PAKATO123/toktickit/pull/64
| Verdict | Approved |
Reviewer comment I received: Approved with follow-up required. Before merging to main, please:

Commit the Prisma migration for ActionTaken (npx prisma migrate dev --name add_actions_taken_lab04).
Add stale-update detection (409) for PUT /actions-taken/:actionId and status updates, with an API test.
These can land in a follow-up commit on this stack (#65/#70) since the PRs are stacked.

How I responded: Understood, i will follow up in Clean up branch along with other fixes

**Branch 2 - feature/lab04-02-role-dashboards**
https://github.com/PAKATO123/toktickit/pull/65
| Verdict | Approved |
Reviewer comment I received: Request changes — 1 major bug:

"Followed up" is derived from !followUpRequired && followUpNote, and the note is still sent when the checkbox is unchecked (ActionsTakenSection.tsx ~L175). The server also keeps the old note on PUT.

Repro: Edit a Follow-Up Required action → uncheck → Save → it shows "Followed up" without the confirmation modal.

Fix: add isFollowedUp Boolean @default(false) (as spec §7.1 / BR-05 describe), set it only on "Mark done", and render the badge from it.

How I responded: Fix now have been published alongside other fixes in newest branch

**Branch 3 - feature/lab04-e2e-and-hardening**
https://github.com/PAKATO123/toktickit/pull/70
| Verdict | Approved |
Reviewer comment I received: Request changes — 1 major issue:

E2E tests can pass without testing anything. 11 assertions in e2e/lab-04 are wrapped in if (await x.isVisible().catch(() => false)), so they are silently skipped when the element is missing. Also, ticket-resolution.spec.ts:69 uses locator('text=A, text=B'), which Playwright reads as one literal string, so it fails whenever that block runs. Use await expect(x).toBeVisible() and getByText(/Pending Verification|Requester consider/).

Note: seed now sets mustChangePassword=false for every user (since #64), so no seeded account demonstrates the Lab 3 first-login password change. Please keep at least one user with true for regression evidence.

How I responded: Understood, i will fix all of it.

## Pull Requests I reviewed for my partner

https://github.com/Tammathorn/toktickit/pull/74
**My comment:**
There is potentially an Idempotency Key Cross-Ticket Collision.
In `POST /api/tickets/:id/actions`, the replay lookup does not assert that the found action matches the ticket specified in the path:

```typescript
const original = await prisma.actionTaken.findUnique({
  where: { createdById_clientRequestId: { createdById: me.id, clientRequestId: body.clientRequestId } },
  select: { ticketId: true },
});
if (original) {
  await respondWithTicket(res, original.ticketId, 200);
  return;
}
```
If a client maliciously reuses a clientRequestId across two different tickets (e.g., submitting request A to `/api/tickets/1/actions` and later reusing the same UUID against `/api/tickets/2/actions`), the server returns 200 OK with the DTO for Ticket 1 unless this is already addressed somewhere else.

**Partner's response:**
Fixed: a key reused on another Ticket now returns 409 IDEMPOTENCY_KEY_REUSED (C-199), with no write and nothing about the other Ticket in the response. Tests API-125 to API-128 (red first, then green), fix 0e21ac8. Also applied to Public Comments and Internal Notes (API-129 to API-132, fix 21e5e0c on the ticket-workflow branch); the fix is merged up the stack and pushed to every branch.

https://github.com/Tammathorn/toktickit/pull/81
**My comment:**
You are literally missing my reflection part in ai-use.md.

And reviewer.md needs updating and fixing (on last part), don't forget to write down every review I gave!

**Partner's response:**
reviewer.md now records every review (6ae86f6); the reflection is in the submitted PDF report per my decision, and ai-use.md points to it (47c42b5).
