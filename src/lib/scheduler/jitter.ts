import { toZonedTime } from 'date-fns-tz';

export function calculateScheduledTime(
  sendTimeStart: string,
  sendTimeEnd: string,
  timezone: string = 'Europe/Madrid'
): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  const [startHour, startMin] = sendTimeStart.split(':').map(Number);
  const [endHour, endMin] = sendTimeEnd.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  const diffMinutes = Math.max(0, endTotalMinutes - startTotalMinutes);
  
  const randomJitterMinutes = Math.floor(Math.random() * (diffMinutes + 1));
  const finalMinutes = startTotalMinutes + randomJitterMinutes;

  const targetHour = Math.floor(finalMinutes / 60);
  const targetMin = finalMinutes % 60;

  const targetDate = new Date(zonedNow);
  targetDate.setHours(targetHour, targetMin, 0, 0);

  return targetDate;
}
