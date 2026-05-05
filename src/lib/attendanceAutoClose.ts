import prisma from "@/infrastructure/prisma/prisma";

export const AUTO_CHECKOUT_MINUTES = 180;

export function getAutoCheckoutTime(checkInTime: Date) {
  return new Date(checkInTime.getTime() + AUTO_CHECKOUT_MINUTES * 60 * 1000);
}

export async function autoCloseExpiredAttendances(now = new Date()) {
  const cutoff = new Date(now.getTime() - AUTO_CHECKOUT_MINUTES * 60 * 1000);
  const expired = await prisma.attendance.findMany({
    where: {
      checkOutTime: null,
      checkInTime: { lte: cutoff },
    },
    select: {
      id: true,
      checkInTime: true,
    },
  });

  let closed = 0;
  for (const record of expired) {
    const result = await prisma.attendance.updateMany({
      where: {
        id: record.id,
        checkOutTime: null,
      },
      data: {
        checkOutTime: getAutoCheckoutTime(record.checkInTime),
        durationMins: AUTO_CHECKOUT_MINUTES,
      },
    });
    closed += result.count;
  }

  return closed;
}
