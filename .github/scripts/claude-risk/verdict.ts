// The verdict Claude returns, and the one shape that counts as an approval.

export type Verdict = { decision: "merge-approved" | "needs-human"; reason: string };

export const needsHuman = (reason: string): Verdict => ({ decision: "needs-human", reason });

/**
 * The verdict in `text`, if it is exactly `{ decision, reason }` with a known decision and a
 * string reason; anything else (not JSON, other keys, another case) is no verdict.
 */
export function parseVerdict(text: string | undefined): Verdict | undefined {
  if (!text) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "decision" || keys[1] !== "reason") return undefined;
  const { decision, reason } = value as Record<string, unknown>;
  if (decision !== "merge-approved" && decision !== "needs-human") return undefined;
  if (typeof reason !== "string") return undefined;
  return { decision, reason };
}
