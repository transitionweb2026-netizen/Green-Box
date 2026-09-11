type ClassValue = string | number | null | undefined | false;

/** Joins truthy class name fragments with a space. No dependency needed for this. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
