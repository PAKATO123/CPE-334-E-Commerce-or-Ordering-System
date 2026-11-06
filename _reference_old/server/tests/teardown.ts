import { getPrisma } from "../src/prisma.js";

const SEED_TICKET_NUMBERS = Array.from({ length: 36 }, (_, i) => {
  const numStr = String(i + 1).padStart(4, "0");
  return `TICK-2026-${numStr}`;
});

export default async function teardown() {
  const prisma = getPrisma();
  try {
    await prisma.attachment.deleteMany({
      where: {
        ticket: {
          ticketNumber: {
            notIn: SEED_TICKET_NUMBERS,
          },
        },
      },
    });

    await prisma.ticket.deleteMany({
      where: {
        ticketNumber: {
          notIn: SEED_TICKET_NUMBERS,
        },
      },
    });
  } catch (error) {
    console.error("Error in test teardown cleanup:", error);
  }
}
