/**
 * Pick the value for `key` from a table that must list every possible key.
 * Adding a variant to the type without adding it here is a type error.
 *
 *   match(size, { default: "px-4 py-2 text-sm", sm: "px-3 py-1 text-xs" })
 */
export function match<K extends PropertyKey, V>(key: K, cases: Record<K, V>): V {
  return cases[key];
}
