export type ClassValue = string | false | null | undefined | Record<string, unknown> | ClassValue[];

/**
 * Returns a class-name joiner bound to a CSS module, in the spirit of `classnames/bind`:
 *
 *   const cx = bindClassNames(styles);
 *   cx("button", { active: isActive }, className);
 *
 * A name the module defines becomes its scoped class; any other name (a consumer's
 * Tailwind utilities or own classes) is kept as is. Objects add the keys whose values
 * are truthy, arrays are flattened, and falsy values are skipped.
 */
export function bindClassNames(styles: Readonly<Record<string, string>>) {
  const resolve = (name: string) => (Object.hasOwn(styles, name) ? styles[name]! : name);

  const collect = (value: ClassValue, out: string[]): void => {
    if (!value) return;
    if (typeof value === "string") {
      for (const name of value.split(/\s+/)) if (name) out.push(resolve(name));
    } else if (Array.isArray(value)) {
      for (const item of value) collect(item, out);
    } else {
      for (const [name, on] of Object.entries(value)) if (on) out.push(resolve(name));
    }
  };

  return (...values: ClassValue[]): string => {
    const out: string[] = [];
    collect(values, out);
    return out.join(" ");
  };
}
