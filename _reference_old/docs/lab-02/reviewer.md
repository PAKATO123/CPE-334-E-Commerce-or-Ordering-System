# Lab 2 — Peer Review Record  (fill this in)

**Author:** Pattarapon Sribuathong — 67070503434 — GitHub: @PAKATO123
**Peer reviewer:** tammathorn kananurak - 67070503489 - GitHub: @Tammathorn

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
|    | feature/lab-02-specs | Approved |
|    | feature/lab02-01-schema-and-seed | Approved |
|    | feature/lab02-02-reference-data-apis | Approved |
|    | feature/lab02-03-ui-foundation | Approved |
|    | feature/lab02-04-requester-selector | Approved |
|    | feature/lab02-05-create-ticket-api | Approved |
|    | feature/lab02-06-my-tickets-api | Approved |
|    | feature/lab02-07-create-ticket-ui | Approved |
|    | feature/lab02-08-my-tickets-ui | Approved |
|    | feature/lab02-09-ticket-detail | Approved |
|    | feature/lab02-10-attachment-lifecycle | Approved |
|    | PostImplementationCleanup1 | Approved |
|    | PostImplementationCleanup2 | Approved |


**Branch 7 - feature/lab02-06-my-tickets-api**
https://github.com/PAKATO123/toktickit/pull/22
| Verdict | Approved* |
Reviewer comment I received: "Test teardown deletes all non-seed tickets/attachments, and tests run
against the same DATABASE_URL as dev — so npm run test wipes local
data." 
How I responded: "Will be addressed in next cleanup branch"


## Pull Requests I reviewed for my partner
My comment: "The doc is solid and have no contradiction. The only real technical red flag to address before writing code (if havent already, in that case clarify) is C-11: explain how ticketNumber gets generated if it depends on the autoincremented id (e.g. inside a database transaction, a Prisma transaction, or a DB sequence), especially since C-30 expects it to be indexed."
Partner's response: "Good catch. The id only exists after the insert, so it's a two-step inside
one $transaction — create the row, then update it with
TKT-${year}-${String(id).padStart(6,"0")}. Column stays unique, so the
index C-30 wants comes from that constraint. No sequence table, no
collision retry.

I'll write it into specification.md §7 and api-spec.md before Issue #13,
and add a decision row so C-11 isn't ambiguous anymore. Thanks."
