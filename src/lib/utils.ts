import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  // Simple format, can be expanded if needed
  return phone;
}

export function formatDate(date: Date): string {
  return format(date, "d 'de' MMMM, yyyy", { locale: es });
}

export function formatTime(time: string): string {
  return time;
}

export function getAge(birthYear: number | null): number | null {
  if (!birthYear) return null;
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

export function getDaysUntilBirthday(birthDay: number, birthMonth: number): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
  
  if (today > nextBirthday) {
    nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
  }
  
  const diffTime = Math.abs(nextBirthday.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function generateInstanceName(userId: string): string {
  return `autobd_${userId.substring(0, 8)}`;
}
