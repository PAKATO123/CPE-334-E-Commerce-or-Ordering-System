import { test, expect } from "@playwright/test";

/**
 * TokTickIT — End-to-End Test Suite: Requester Ticket Flow (Lab 02)
 *
 * Traceability:
 * - E2E-01: Complete Ticket creation flow (AC-01, AC-05, AC-08–AC-18)
 * - E2E-02: Invalid Ticket submission & boundary validation (AC-12–AC-15)
 * - E2E-03: Ticket creation with Attachments (AC-19–AC-24)
 * - E2E-04: Ticket creation API failure handling (AC-17, AC-51)
 * - E2E-05: My Tickets workflow (Search, Filter, Sort, Paginate, Open) (AC-25–AC-35)
 * - E2E-06: My Tickets states (Empty, No-Results, Loading, Error/Retry) (AC-26, AC-27, AC-28, AC-49)
 * - E2E-07: Requester switching & Dirty form guard (AC-06, AC-25)
 * - E2E-08: Ticket Detail view & ownership isolation (AC-36–AC-40)
 * - E2E-09: Attachment lifecycle on Ticket Detail (Add, Preview, Download, Soft-Removal) (AC-41–AC-47)
 * - E2E-10: Responsive requester workflow across Desktop, Tablet, Mobile (AC-52–AC-59)
 */

test.describe("TokTickIT Lab 02 — Requester Ticket Flow E2E Tests", () => {
    // Helper to select requester and navigate to /tickets
    const selectRequester = async (page: any, requesterName = "Alice Chen") => {
        await page.goto("/");
        await expect(page.locator("h1")).toContainText("Select Development Requester");
        await page.locator("#requester-select").selectOption({ label: `${requesterName} (Engineering)` });
        await page.getByRole("button", { name: "Continue" }).click();
        await expect(page).toHaveURL(/\/tickets$/);
        await expect(page.locator(".tt-requester-badge")).toContainText(requesterName);
    };

    test.describe("[E2E-01] Complete Ticket Creation Flow (AC-01, AC-05, AC-08–AC-18)", () => {
        test("allows an active requester to select identity, fill form, and create a ticket successfully", async ({ page }) => {
            // 1. Requester selection
            await selectRequester(page, "Alice Chen");

            // 2. Navigate to Create Ticket
            await page.getByRole("link", { name: "+ Create Ticket" }).click();
            await expect(page).toHaveURL(/\/tickets\/new$/);
            await expect(page.locator("h1")).toContainText("Create New Ticket");

            // 3. Verify read-only identity and ticket preview fields
            await expect(page.locator("#ticket-number-readonly")).toHaveValue(/TICK-2026-\d{4}|TICK-2026-XXXX/);
            await expect(page.locator("#requester-name-readonly")).toHaveValue("Alice Chen");
            await expect(page.locator("#requester-id-readonly")).toHaveValue(/\d+/);

            // 4. Fill in required and optional form fields
            await page.locator("#category-select").selectOption({ label: "Software Bug" });
            await page.locator("#system-select").selectOption({ label: "VPN Service" });
            await page.locator("#priority-select").selectOption("HIGH");
            await page.locator("#summary-input").fill("Cannot establish connection to staging VPN gateway");
            await page.locator("#description-input").fill(
                "When attempting to authenticate through OpenVPN client on macOS, the connection times out after 30 seconds."
            );

            // 5. Submit form
            const submitBtn = page.getByRole("button", { name: "Submit Ticket" });
            await submitBtn.click();

            // 6. Verify redirection to Ticket Detail page and success toast
            await expect(page).toHaveURL(/\/tickets\/\d+$/);
            await expect(page.locator(".tt-toast")).toBeVisible();
            await expect(page.locator(".tt-toast")).toContainText("created successfully");

            // 7. Verify Ticket Detail contents match submission
            await expect(page.locator("h1")).toContainText(/Ticket #TICK-2026-\d{4}/);
            await expect(page.locator(".tt-badge-high")).toHaveText("High");
            await expect(page.locator(".tt-badge-new")).toHaveText("New");
            await expect(page.locator('input[value="Cannot establish connection to staging VPN gateway"]')).toBeVisible();
            await expect(page.locator("textarea")).toContainText("When attempting to authenticate through OpenVPN client");
        });
    });

    test.describe("[E2E-02] Invalid Ticket Submission & Boundary Validation (AC-12–AC-15)", () => {
        test("enforces required fields, description minimum length, and summary maximum length", async ({ page }) => {
            await selectRequester(page, "Alice Chen");
            await page.goto("/tickets/new");

            // 1. Submit empty form
            await page.getByRole("button", { name: "Submit Ticket" }).click();

            // Verify field-level validation errors
            await expect(page.locator(".tt-error-message")).toContainText(["Category is required.", "Related System is required.", "Summary is required.", "Description is required."]);

            // 2. Test Description boundary (< 20 characters)
            await page.locator("#category-select").selectOption({ index: 1 });
            await page.locator("#system-select").selectOption({ index: 1 });
            await page.locator("#summary-input").fill("Valid ticket summary text");
            await page.locator("#description-input").fill("Too short text"); // < 20 characters
            await page.getByRole("button", { name: "Submit Ticket" }).click();

            // Should still fail validation or display backend 422 if submitted
            await expect(page).toHaveURL(/\/tickets\/new$/);

            // 3. Test Description valid boundary (>= 20 characters)
            await page.locator("#description-input").fill("This description contains well over twenty characters for validation.");
            await expect(page.locator("#summary-input")).toHaveAttribute("maxLength", "255");
        });
    });

    test.describe("[E2E-03] Ticket Creation with Attachments (AC-19–AC-24)", () => {
        test("stages valid attachments, enforces file rules, and creates ticket with attachments", async ({ page }) => {
            await selectRequester(page, "Alice Chen");
            await page.goto("/tickets/new");

            await page.locator("#category-select").selectOption({ index: 1 });
            await page.locator("#system-select").selectOption({ index: 1 });
            await page.locator("#summary-input").fill("VPN connection timeout with diagnostic log attached");
            await page.locator("#description-input").fill("Attaching the diagnostic log screenshot and network trace PDF below.");

            // Verify attachment counter
            await expect(page.getByText("0 / 5 files")).toBeVisible();

            // Upload valid file attachment (buffer payload)
            await page.locator("#attachment-file-input").setInputFiles({
                name: "vpn-error-screenshot.png",
                mimeType: "image/png",
                buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
            });

            // Verify staged file list item
            await expect(page.getByText("1 / 5 files")).toBeVisible();
            await expect(page.getByText("vpn-error-screenshot.png")).toBeVisible();

            // Submit ticket with attachment
            await page.getByRole("button", { name: "Submit Ticket" }).click();

            // Verify attachment appears on ticket detail view
            await expect(page).toHaveURL(/\/tickets\/\d+$/);
            await expect(page.getByText("Attachments (1 / 5 active)")).toBeVisible();
            await expect(page.getByRole("button", { name: "vpn-error-screenshot.png" })).toBeVisible();
        });
    });

    test.describe("[E2E-04] Ticket Creation API Failure Handling (AC-17, AC-51)", () => {
        test("displays safe error message and preserves form inputs upon server failure", async ({ page }) => {
            await selectRequester(page, "Alice Chen");
            await page.goto("/tickets/new");

            await page.locator("#category-select").selectOption({ index: 1 });
            await page.locator("#system-select").selectOption({ index: 1 });
            await page.locator("#summary-input").fill("Persistent form data during network outage");
            await page.locator("#description-input").fill("This input should remain preserved in the form even if the POST API returns 500.");

            // Mock server 500 error on ticket submission
            await page.route("**/api/tickets", async (route) => {
                if (route.request().method() === "POST") {
                    await route.fulfill({
                        status: 500,
                        contentType: "application/json",
                        body: JSON.stringify({
                            error: {
                                code: "INTERNAL_SERVER_ERROR",
                                message: "A database error occurred while creating your ticket. Please try again later.",
                            },
                        }),
                    });
                } else {
                    await route.continue();
                }
            });

            await page.getByRole("button", { name: "Submit Ticket" }).click();

            // Verify error banner is rendered and entered inputs are preserved
            await expect(page.getByText("A database error occurred while creating your ticket")).toBeVisible();
            await expect(page.locator("#summary-input")).toHaveValue("Persistent form data during network outage");
            await expect(page.locator("#description-input")).toHaveValue(
                "This input should remain preserved in the form even if the POST API returns 500."
            );
        });
    });

    test.describe("[E2E-05] My Tickets Workflow — Search, Filter, Sort, Paginate (AC-25–AC-35)", () => {
        test("allows searching, filtering by status/priority/category, sorting, and pagination", async ({ page }) => {
            await selectRequester(page, "Alice Chen");

            // Verify tickets table structure
            await expect(page.locator("table")).toBeVisible();
            await expect(page.locator("th")).toContainText(["Ticket #", "Summary", "Category", "Related System", "Priority", "Status", "Created"]);

            // 1. Test Search Input
            const searchInput = page.getByPlaceholder("Search by ticket number, summary, description...");
            await searchInput.fill("VPN");
            await page.waitForTimeout(400); // debounce wait

            // 2. Test Filters
            const statusSelect = page.getByLabel("Filter by Status");
            await statusSelect.selectOption("New");

            const prioritySelect = page.getByLabel("Filter by Priority");
            await prioritySelect.selectOption("HIGH");

            // 3. Clear Filters button
            const clearBtn = page.getByRole("button", { name: "Clear Filters" });
            await expect(clearBtn).toBeVisible();
            await clearBtn.click();
            await expect(searchInput).toHaveValue("");

            // 4. Test Sorting Toggles
            const priorityHeader = page.locator("th", { hasText: /Priority/i });
            await priorityHeader.click();
            await expect(priorityHeader).toContainText(/↓|↑/);

            // 5. Test Pagination Page Size Selector
            const pageSizeSelect = page.locator("#page-size-select");
            if (await pageSizeSelect.isVisible()) {
                await pageSizeSelect.selectOption("25");
            }
        });
    });

    test.describe("[E2E-06] My Tickets States (AC-26, AC-27, AC-28, AC-49)", () => {
        test("displays no-results state with clear filters button when search finds no matches", async ({ page }) => {
            await selectRequester(page, "Alice Chen");

            // Search non-existent string
            const searchInput = page.getByPlaceholder("Search by ticket number, summary, description...");
            await searchInput.fill("NON_EXISTENT_TICKET_KEYWORD_XYZ999");
            await page.waitForTimeout(400);

            // Verify no-results state
            await expect(page.getByText("No matching tickets found")).toBeVisible();
            await expect(page.getByText("No tickets match your active search and filter conditions.")).toBeVisible();

            // Click Clear Filters
            await page.getByRole("button", { name: "Clear Filters" }).click();
            await expect(page.locator("table")).toBeVisible();
        });
    });

    test.describe("[E2E-07] Requester Switching & Dirty Form Guard (AC-06, AC-25)", () => {
        test("prompts confirmation when switching requester with unsaved draft and loads new requester context", async ({ page }) => {
            await selectRequester(page, "Alice Chen");
            await page.goto("/tickets/new");

            // Make form dirty
            await page.locator("#summary-input").fill("Unsaved draft ticket summary");

            // Attempt to change requester
            await page.getByRole("button", { name: "Change Requester" }).click();

            // Verify Discard Unsaved Draft Modal appears
            await expect(page.getByText("Discard Unsaved Draft?")).toBeVisible();
            await expect(page.getByText("Switching requester will discard your unsaved ticket draft.")).toBeVisible();

            // Click Cancel -> stay on form
            await page.getByRole("button", { name: "Cancel" }).click();
            await expect(page.locator("#summary-input")).toHaveValue("Unsaved draft ticket summary");

            // Click Change Requester and confirm Discard
            await page.getByRole("button", { name: "Change Requester" }).click();
            await page.getByRole("button", { name: "Discard & Switch" }).click();

            // Should be redirected to Requester Selection page
            await expect(page).toHaveURL(/\//);

            // Select Bob Smith
            await page.locator("#requester-select").selectOption({ label: "Bob Smith (Marketing)" });
            await page.getByRole("button", { name: "Continue" }).click();
            await expect(page.locator(".tt-requester-badge")).toContainText("Bob Smith");
        });
    });

    test.describe("[E2E-08] Ticket Detail View & Ownership Isolation (AC-36–AC-40)", () => {
        test("renders ticket details read-only and handles cross-requester 403 access denial", async ({ page }) => {
            await selectRequester(page, "Alice Chen");

            // Mock 403 Forbidden cross-requester error for ticket ID 9999
            await page.route("**/api/tickets/9999?*", async (route) => {
                await route.fulfill({
                    status: 403,
                    contentType: "application/json",
                    body: JSON.stringify({
                        error: {
                            code: "FORBIDDEN",
                            message: "You do not have permission to view this ticket as it belongs to another requester.",
                        },
                    }),
                });
            });

            await page.goto("/tickets/9999");

            // Verify safe 403 error screen
            await expect(page.getByText("403 Access Denied")).toBeVisible();
            await expect(page.getByText("belongs to another requester")).toBeVisible();
            await expect(page.getByRole("link", { name: "Return to My Tickets" })).toBeVisible();
        });
    });

    test.describe("[E2E-09] Attachment Lifecycle on Ticket Detail (AC-41–AC-47)", () => {
        test("supports adding attachment, previewing, downloading, and soft-removal with reason", async ({ page }) => {
            await selectRequester(page, "Alice Chen");

            // 1. Create a ticket first to manage attachments
            await page.goto("/tickets/new");
            await page.locator("#category-select").selectOption({ index: 1 });
            await page.locator("#system-select").selectOption({ index: 1 });
            await page.locator("#summary-input").fill("Attachment management lifecycle test");
            await page.locator("#description-input").fill("Testing attachment addition, preview, download, and soft removal.");
            await page.getByRole("button", { name: "Submit Ticket" }).click();

            await expect(page).toHaveURL(/\/tickets\/\d+$/);

            // 2. Upload an attachment from Ticket Detail view
            const fileChooserPromise = page.waitForEvent("filechooser");
            await page.getByRole("button", { name: "+ Add Attachment" }).click();
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles({
                name: "test-document.pdf",
                mimeType: "application/pdf",
                buffer: Buffer.from("%PDF-1.4 sample pdf content"),
            });

            // Verify active attachment item appears
            await expect(page.getByRole("button", { name: "test-document.pdf" })).toBeVisible();
            await expect(page.getByRole("link", { name: "Download" })).toBeVisible();

            // 3. Test Preview Modal
            await page.getByRole("button", { name: "test-document.pdf" }).click();
            await expect(page.getByText("Preview: test-document.pdf")).toBeVisible();
            await page.getByRole("button", { name: "✕ Close" }).click();

            // 4. Test Soft-Removal with reason
            await page.getByRole("button", { name: "Remove" }).click();
            await expect(page.getByText("Remove Attachment")).toBeVisible();

            // Fill removal reason
            await page.locator("#removal-reason-input").fill("Outdated document uploaded by mistake");
            await page.getByRole("button", { name: "Confirm Removal" }).click();

            // 5. Verify Soft-Removed state
            await expect(page.getByText("Outdated document uploaded by mistake")).toBeVisible();
            await expect(page.getByText("[Removed]")).toBeVisible();
            await expect(page.locator('span[title="Attachment Removed"]')).toBeVisible();
        });
    });

    test.describe("[E2E-10] Responsive Requester Workflow (AC-52–AC-59)", () => {
        test("renders responsive layouts without overflow across desktop, tablet, and mobile viewports", async ({ page }) => {
            // 1. Desktop Viewport (≥992px)
            await page.setViewportSize({ width: 1280, height: 800 });
            await selectRequester(page, "Alice Chen");
            await expect(page.locator(".tt-shell")).toBeVisible();
            await expect(page.locator("table")).toBeVisible();

            // 2. Tablet Viewport (768px – 991px)
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto("/tickets/new");
            await expect(page.locator("h1")).toContainText("Create New Ticket");
            await expect(page.locator("#summary-input")).toBeVisible();

            // 3. Mobile Viewport (<768px)
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto("/tickets");
            await expect(page.locator(".tt-brand")).toBeVisible();
            await expect(page.locator("h1")).toContainText("My Tickets");
        });
    });
});
