/** Joins class names, skipping falsy ones: cx(styles.button, isWide && "w-full", className). */
export function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
