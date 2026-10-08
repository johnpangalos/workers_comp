import type { ComponentType } from "react";

/** A prop the playground can edit. Mirrors a Figma component property. */
export type Control =
  | { type: "select"; options: readonly string[]; default: string }
  | { type: "boolean"; default: boolean }
  | { type: "text"; default: string };

export type Props = Record<string, unknown>;

export interface PlaygroundEntry {
  /** Component name, as in Figma and in code. */
  name: string;
  description?: string;
  /** Link to the Figma component set. */
  figma?: string;
  component: ComponentType<any>; // any component; props come from `controls`
  /** Editable props. `children` with a text control becomes the label. */
  controls: Record<string, Control>;
  /**
   * The variant grid, like the Figma component set: one row per combination
   * of the listed select controls, one column per preset.
   */
  matrix?: {
    rows: string[];
    columns: { label: string; props: Props }[];
  };
}

export function definePlayground(entry: PlaygroundEntry) {
  return entry;
}

export function defaultProps(controls: Record<string, Control>): Props {
  return Object.fromEntries(Object.entries(controls).map(([key, c]) => [key, c.default]));
}

/** Every combination of the given select controls' options, in order. */
export function combinations(controls: Record<string, Control>, keys: string[]): Props[] {
  return keys.reduce<Props[]>(
    (acc, key) => {
      const control = controls[key];
      if (control?.type !== "select") return acc;
      return acc.flatMap((props) => control.options.map((value) => ({ ...props, [key]: value })));
    },
    [{}],
  );
}

/** JSX for the current props, leaving out anything still at its default. */
export function toJsx(entry: PlaygroundEntry, props: Props): string {
  const attrs = Object.entries(entry.controls)
    .filter(([key, control]) => key !== "children" && props[key] !== control.default)
    .map(([key]) => {
      const value = props[key];
      if (value === true) return ` ${key}`;
      if (value === false) return ` ${key}={false}`;
      return ` ${key}="${String(value)}"`;
    })
    .join("");
  const children = props.children;
  return children ? `<${entry.name}${attrs}>${String(children)}</${entry.name}>` : `<${entry.name}${attrs} />`;
}
