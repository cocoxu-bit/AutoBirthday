import { toZonedTime } from 'date-fns-tz';

export function calculateScheduledTime(
  sendTimeStart: string = '09:30',
  sendTimeEnd: string = '11:45',
  timezone: string = 'Europe/Madrid',
  contactIndex: number = 0
): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  const [startHour, startMin] = (sendTimeStart || '09:30').split(':').map(Number);
  const [endHour, endMin] = (sendTimeEnd || '11:45').split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = Math.max(startTotalMinutes + 15, endHour * 60 + endMin);

  const diffMinutes = Math.max(0, endTotalMinutes - startTotalMinutes);
  
  // Stagger contacts with 15-45 mins jitter to prevent simultaneous bursts
  const baseOffset = (contactIndex * 20) % Math.max(1, diffMinutes);
  const randomJitter = Math.floor(Math.random() * 15);
  const finalMinutes = startTotalMinutes + Math.min(diffMinutes, baseOffset + randomJitter);

  const targetHour = Math.floor(finalMinutes / 60);
  const targetMin = finalMinutes % 60;

  const targetDate = new Date(zonedNow);
  targetDate.setHours(targetHour, targetMin, 0, 0);

  return targetDate;
}
