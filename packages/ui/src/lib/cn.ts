import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Join class names and let later Tailwind utilities win over earlier ones,
 * so `<Button className="px-8" />` replaces the size's `px-4` instead of
 * fighting it in the cascade.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
