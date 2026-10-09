/**
 * Marks Tailwind classes to compile into a CSS module at build time:
 *
 *   const styles = tw({ button: "inline-flex rounded-md bg-fuchsia-700 ..." });
 *   styles.button; // → a scoped class such as "wc-button-YrVJX"
 *
 * The build (build/tailwind-modules.ts) replaces the call with the generated module, so
 * this body only runs where that plugin isn't installed; there it hands back the classes
 * as they are, which a Tailwind app can still style.
 */
export function tw<const T extends Record<string, string>>(classes: T): { readonly [K in keyof T]: string } {
  return classes;
}
