import { PrismaClient } from "@prisma/client";

/**
 * Generates official ticket numbers in format TICK-YYYY-NNNN (BR-01).
 * E.g., TICK-2026-0001
 */
export async function generateTicketNumber(prisma: PrismaClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TICK-${year}-`;

  const tickets = await prisma.ticket.findMany({
    select: {
      ticketNumber: true,
    },
  });

  let maxSeq = 0;
  const existingSet = new Set<string>();
  for (const t of tickets) {
    existingSet.add(t.ticketNumber);
    const parts = t.ticketNumber.split("-");
    const seq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  let nextSequence = maxSeq + 1;
  let candidate = `${prefix}${String(nextSequence).padStart(4, "0")}`;
  while (existingSet.has(candidate)) {
    nextSequence++;
    candidate = `${prefix}${String(nextSequence).padStart(4, "0")}`;
  }

  return candidate;
}
