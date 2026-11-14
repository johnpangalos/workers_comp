import type { ComponentProps, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { dataAttr, mergeProps, useFocusRing } from "@comp0/core";
import {
  Description,
  FieldError,
  Label,
  Select as Comp0Select,
  SelectOption as Comp0SelectOption,
  type SelectOptionProps as Comp0SelectOptionProps,
  SelectPopover,
  type SelectProps as Comp0SelectProps,
  SelectTrigger,
  SelectValue,
} from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "Select" components (Workers Comp Design System, page "Select"): the field
 * `Select` (node 100:79) is a label, a `SelectTrigger` (100:43) and a description, or an error
 * message when `invalid`; the trigger opens a `Listbox` (100:53) of `SelectOption`s (100:52).
 * Prop names are the Figma property names: `label`, `description`, `errorMessage` and `invalid` on
 * the field, the trigger's `value` text is the selected option's label (or `placeholder`), and an
 * option's `Label` is its children.
 *
 * Behaviour comes from comp0's headless Select: the trigger is a button that opens the listbox on
 * click, Enter, Space or the arrow keys, types ahead while closed, and is labelled by the label and
 * described by the description or error message; in the listbox the arrow keys, Home and End move
 * between options, Enter or Space picks one and Escape closes it. A hidden native `<select>` takes
 * part in forms (`name`, `required`). Figma's trigger `state` is comp0's data attributes:
 * `data-hovered`, `data-focus-visible`, `data-disabled` and `data-open`. An option's
 * `state=highlighted` is the option that has focus: the arrow keys move focus, and so does the
 * pointer, so one option is highlighted at a time.
 */

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/**
 * The Select's scoped classes: a column of the label, the trigger and the description or error
 * message, 320px wide (`spacing/80`) like the Figma field. The label's type is set here: the label
 * inherits it, and the description and error message set their own.
 */
export const selectClassName = cx(
  `flex w-80 flex-col items-stretch gap-1.5 font-sans text-sm font-medium text-gray-900`,
);

/**
 * The trigger's scoped classes. The reset classes are Button's, keeping the border, which is always
 * on. Figma draws the chevron outside the auto layout, right-aligned, with `spacing/9` of right
 * padding to keep the value clear of it; so does this. The border colour rules never match at the
 * same time: disabled wins over invalid, invalid over open, open over hover, so no rule depends on
 * the order of the stylesheet. The placeholder is gray-500, from the Select's `data-placeholder`.
 */
export const selectTriggerClassName = cx(`
  relative m-0 flex w-full appearance-none items-center rounded-md border border-solid border-gray-400
  bg-white py-2 pr-9 pl-3 font-sans text-sm font-normal text-gray-900 transition-colors outline-none
  in-data-placeholder:text-gray-500
  data-disabled:pointer-events-none data-disabled:border-gray-200 data-disabled:bg-gray-100
  data-disabled:text-gray-400
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
  not-data-invalid:not-data-open:data-hovered:border-gray-500
  not-data-invalid:data-open:border-fuchsia-600
  data-invalid:not-data-disabled:border-red-600
`);

/** The value or placeholder in the trigger: it fills the trigger and truncates, as in Figma. */
const selectValueClassName = cx(`min-w-0 flex-1 truncate text-left`);

/** The chevron: a 16px frame (`spacing/4`) right-aligned in the trigger, gray-500, gray-400 disabled. */
const selectChevronClassName = cx(`
  absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-500
  in-data-disabled:text-gray-400
`);

/**
 * The listbox's scoped classes, Figma's "Listbox": white, a gray-200 border, `radius/md` and
 * `shadow-md`, as wide as the Select. The UA popover styles (padding, border, colours) are reset.
 */
export const selectPopoverClassName = cx(`
  m-0 w-80 rounded-md border border-solid border-gray-200 bg-white p-0 font-sans
  text-gray-900 shadow-md
`);

/** The description, gray-600, and the error message, red-600: both text-sm/normal. */
const selectDescriptionClassName = cx(`text-sm font-normal text-gray-600`);
const selectErrorClassName = cx(`text-sm font-normal text-red-600`);

/** The column the options sit in, Figma's "Options": `spacing/1` of padding. */
const selectOptionsClassName = cx(`flex flex-col p-1`);

/**
 * An option's scoped classes. Highlighted is the option with focus; selected is fuchsia-700 and
 * disabled gray-400, which never match together (a disabled option shows as disabled).
 */
export const selectOptionClassName = cx(`
  flex cursor-default items-center rounded-sm px-2 py-1.5 font-sans text-sm font-normal text-gray-900
  outline-none
  data-disabled:text-gray-400
  data-highlighted:bg-gray-100
  not-data-disabled:data-selected:text-fuchsia-700
`);

/** One option of `items`: its value, the label shown for it, and whether it can be chosen. */
export type SelectItem = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> & {
  /** The selected option's value. Controlled: give it with `onValueChange`. */
  value?: string;
  /** The option selected at first, for an uncontrolled Select. None by default: the placeholder shows. */
  defaultValue?: string;
  /** Whether the listbox is open. Controlled: give it with `onOpenChange`. */
  open?: boolean;
  /** Whether the listbox is open at first. */
  defaultOpen?: boolean;
  /** Called with the listbox's next open state. */
  onOpenChange?: (open: boolean) => void;
  /** Figma's `state=disabled`: the trigger can't be focused or opened. */
  disabled?: boolean;
  /** Figma's `invalid=true`: a red border, and `errorMessage` in place of `description`. */
  invalid?: boolean;
  /** Required in a form: the hidden native select is `required`. */
  required?: boolean;
  /** The form field's name: the selected value is submitted under it. */
  name?: string;
  /** The id of the form the hidden native select belongs to, when it isn't inside it. */
  form?: string;
  /** The field's label, Figma's `label`. Give it, or an `aria-label`, so the Select has a name. */
  label?: ReactNode;
  /** Help under the trigger, Figma's `description`. Hidden while `invalid` shows `errorMessage`. */
  description?: ReactNode;
  /** Shown under the trigger, in red, while `invalid` (Figma's `invalid=true`). */
  errorMessage?: ReactNode;
  /** Shown in the trigger, in gray-500, while nothing is selected. */
  placeholder?: ReactNode;
  /** The options, as data. Or give `SelectOption`s as children. */
  items?: Iterable<SelectItem>;
  /** `SelectOption`s, used when `items` isn't given. */
  children?: ReactNode;
  /** Called with the value of the option the user picks. */
  onValueChange?: (value: string) => void;
};

/**
 * `className` is appended to the Select's classes as is, so a consumer's utilities (a width, say)
 * override them. The listbox opens below the trigger, `spacing/1` (4px) away.
 */
export function Select({
  label,
  description,
  errorMessage,
  placeholder,
  items,
  children,
  onValueChange,
  invalid,
  disabled,
  className,
  ...props
}: SelectProps) {
  // A disabled trigger can't take focus, but a key event sent to it still reached comp0's
  // ArrowDown-opens and type-ahead handling; marking it handled keeps a disabled Select shut.
  const preventWhenDisabled = (event: KeyboardEvent) => {
    if (disabled) event.preventDefault();
  };
  let options = children;
  if (items) {
    options = Array.from(items, (item) => (
      <SelectOption key={item.value} value={item.value} disabled={item.disabled}>
        {item.label}
      </SelectOption>
    ));
  }
  return (
    <Comp0Select
      {...(props as Comp0SelectProps)}
      as="div"
      disabled={disabled}
      invalid={invalid}
      onChange={onValueChange}
      className={[selectClassName, className].filter(Boolean).join(" ")}
    >
      {label !== undefined && <Label>{label}</Label>}
      <SelectTrigger
        data-invalid={dataAttr(Boolean(invalid))}
        onKeyDown={preventWhenDisabled}
        className={selectTriggerClassName}
      >
        <SelectValue placeholder={placeholder} className={selectValueClassName} />
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={selectChevronClassName}>
          <path d="M3 6.06 4.06 5 8 8.94 11.94 5 13 6.06 8 11Z" />
        </svg>
      </SelectTrigger>
      {description !== undefined && !invalid && (
        <Description className={selectDescriptionClassName}>{description}</Description>
      )}
      {errorMessage !== undefined && <FieldError className={selectErrorClassName}>{errorMessage}</FieldError>}
      <SelectPopover placement="bottom start" offset={4} className={selectPopoverClassName}>
        <div className={selectOptionsClassName}>{options}</div>
      </SelectPopover>
    </Comp0Select>
  );
}

export type SelectOptionProps = Comp0SelectOptionProps;

/**
 * One option: `value` is what the Select reports, children are its label. Pointing at an option
 * focuses it, as the arrow keys do, so the highlighted option is always the focused one. A disabled
 * option can't be focused or picked. A consumer's handlers run after the focus and pointer ones.
 */
export function SelectOption({ className, disabled, ...props }: SelectOptionProps) {
  const { focusProps, isFocused } = useFocusRing({ disabled });
  const pointerProps = {
    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (disabled || event.pointerType === "touch") return;
      if (event.currentTarget !== event.currentTarget.ownerDocument.activeElement)
        event.currentTarget.focus();
    },
  };
  return (
    <Comp0SelectOption
      {...(mergeProps(focusProps, pointerProps, props) as SelectOptionProps)}
      disabled={disabled}
      data-highlighted={dataAttr(isFocused && !disabled)}
      className={[selectOptionClassName, className].filter(Boolean).join(" ")}
    />
  );
}
