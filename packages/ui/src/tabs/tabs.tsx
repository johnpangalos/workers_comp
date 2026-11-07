import type { ComponentProps, ElementType } from "react";
import { dataAttr, mergeProps, useFocusRing, useHover } from "@comp0/core";
import {
  Tab as Comp0Tab,
  type TabListProps as Comp0TabListProps,
  TabList as Comp0TabList,
  type TabPanelProps as Comp0TabPanelProps,
  TabPanel as Comp0TabPanel,
  type TabProps as Comp0TabProps,
  type TabsProps as Comp0TabsProps,
  Tabs as Comp0Tabs,
} from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "Tabs" component family (Workers Comp Design System, page "Tabs", node 18:23):
 * `Tabs` holds a `TabList` of `Tab`s and a `TabPanel` per tab. Each part wraps the comp0 part of
 * the same name and adds classes. Behaviour (roles, arrow keys, Home and End, the tab order) comes
 * from comp0. The Tab's hover and focus ring come from this package's hooks, which report
 * `data-hovered` and `data-focus-visible`. Every part appends `className` after its own classes.
 */

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/** The Tabs' scoped classes: a column of the list and its panel, hugging their content. */
export const tabsClassName = cx(`flex flex-col items-start gap-3`);

/** The TabList's scoped classes: the grey track the tabs sit in. */
export const tabListClassName = cx(`inline-flex gap-1 rounded-lg bg-gray-100 p-1`);

/**
 * The Tab's scoped classes. The reset classes are Button's, for the native button. A disabled tab
 * is gray-400 and never reports hover, even when selected.
 */
export const tabClassName = cx(`
  m-0 inline-flex appearance-none items-center justify-center rounded-md border-0 border-solid px-3 py-1.5
  font-sans text-sm font-medium text-gray-600 transition-colors outline-none
  data-disabled:pointer-events-none data-disabled:text-gray-400
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
  data-hovered:text-gray-900
  data-selected:bg-white data-selected:text-gray-900
  data-selected:data-disabled:text-gray-400
`);

/**
 * The TabPanel's scoped classes. The `hidden` attribute is `display: none`, but the `flex` class
 * beats it, so an unselected panel hides itself with `not-data-selected:hidden`.
 */
export const tabPanelClassName = cx(`
  flex flex-col items-start p-4 text-sm font-normal text-gray-700
  not-data-selected:hidden
`);

export type TabsProps<TElement extends ElementType = "div"> = Omit<
  ComponentProps<TElement>,
  "defaultValue" | "onChange"
> & {
  /** The element to render; a `div` by default. */
  as?: TElement;
  /** The selected tab's value. Controlled: give it with `onValueChange`, or the Tabs stays on it. */
  value?: string;
  /** The tab selected at first, for an uncontrolled Tabs. */
  defaultValue?: string;
  /** Called with the value of the tab the user selects. */
  onValueChange?: (value: string) => void;
};

export type TabListProps = Comp0TabListProps;
export type TabProps = Comp0TabProps;
export type TabPanelProps = Comp0TabPanelProps;

export function Tabs<TElement extends ElementType = "div">({
  as,
  className,
  onValueChange,
  ...props
}: TabsProps<TElement>) {
  return (
    <Comp0Tabs
      {...(props as Comp0TabsProps)}
      as={as ?? "div"}
      onChange={onValueChange}
      className={[tabsClassName, className].filter(Boolean).join(" ")}
    />
  );
}

export function TabList({ className, ...props }: TabListProps) {
  return <Comp0TabList {...props} className={[tabListClassName, className].filter(Boolean).join(" ")} />;
}

/** A consumer's `onClick` runs first; calling `preventDefault()` in it keeps the tab from being selected. */
export function Tab({ className, disabled, ...props }: TabProps) {
  const { focusProps, isFocusVisible } = useFocusRing({ disabled });
  const { hoverProps, isHovered } = useHover({ disabled });
  return (
    <Comp0Tab
      {...(mergeProps(props, focusProps, hoverProps) as TabProps)}
      disabled={disabled}
      data-hovered={dataAttr(isHovered && !disabled)}
      data-focus-visible={dataAttr(isFocusVisible)}
      className={[tabClassName, className].filter(Boolean).join(" ")}
    />
  );
}

export function TabPanel({ className, ...props }: TabPanelProps) {
  return <Comp0TabPanel {...props} className={[tabPanelClassName, className].filter(Boolean).join(" ")} />;
}
