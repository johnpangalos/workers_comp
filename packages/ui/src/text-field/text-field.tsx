import type { ComponentProps, ReactNode } from "react";
import { Description, FieldError, Input, Label, TextField as Comp0TextField } from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "TextField" component set (Workers Comp Design System, page "TextField",
 * node 98:232): a label, the input, a description and, when invalid, an error message, in a column.
 * The Figma text properties are the props of the same name (`label`, `placeholder`, `value`,
 * `description`, `errorMessage`), and `invalid=true` is `invalid`.
 *
 * Behaviour comes from comp0's TextField and Input: the label is the input's, the description and
 * the error message describe it, and the error message is shown only while the field is invalid.
 * Figma's `state` property is reported on the input as `data-hovered`, `data-focus-visible` and
 * `data-disabled`, and `invalid` as `data-invalid`. The classes below select on them.
 * `data-focus-visible` follows the browser's `:focus-visible`: keyboard focus shows the ring, and
 * so does a click, because a text input matches `:focus-visible` however it is focused.
 */

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

/** The TextField's scoped classes: the column the label, input and messages sit in. */
export const textFieldClassName = cx(`flex w-80 flex-col gap-1.5 font-sans`);

/** The label's scoped classes. */
export const textFieldLabelClassName = cx(`text-sm font-medium text-gray-900`);

/**
 * The input's scoped classes. The reset classes are Button's, minus `border-0`: the border is
 * always on. While the placeholder shows, the input is drawn in the placeholder's colour, as in
 * Figma. Invalid beats hover, and disabled beats both.
 */
export const textFieldInputClassName = cx(`
  m-0 appearance-none rounded-md border border-solid border-gray-400 bg-white px-3 py-2 font-sans text-sm
  font-normal text-gray-900 transition-colors outline-none
  placeholder:text-gray-500
  not-data-disabled:placeholder-shown:text-gray-500
  not-data-disabled:data-invalid:border-red-600
  data-disabled:border-gray-200 data-disabled:bg-gray-100 data-disabled:text-gray-400
  data-disabled:placeholder:text-gray-400
  data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
  not-data-invalid:data-hovered:border-gray-500
`);

/** The description's scoped classes. */
export const textFieldDescriptionClassName = cx(`text-sm font-normal text-gray-600`);

/** The error message's scoped classes. */
export const textFieldErrorMessageClassName = cx(`text-sm font-normal text-red-600`);

export type TextFieldProps = Omit<
  ComponentProps<"input">,
  "children" | "className" | "defaultValue" | "disabled" | "id" | "onChange" | "required" | "value"
> & {
  /** The label, Figma's `label`. */
  label: ReactNode;
  /** Help shown under the input, Figma's `description`. */
  description?: ReactNode;
  /** Shown under the description while `invalid`, Figma's `errorMessage`. */
  errorMessage?: ReactNode;
  /** The value. Controlled: give it with `onChange`, or the field stays on it. */
  value?: string;
  /** The value at first, for an uncontrolled field. */
  defaultValue?: string;
  /** Called with the input's value each time the user changes it. */
  onChange?: (value: string) => void;
  disabled?: boolean;
  /** Draws the field as invalid and shows `errorMessage`; Figma's `invalid=true`. */
  invalid?: boolean;
  required?: boolean;
  /** The input's id; the label, description and error message ids are made from it. */
  id?: string;
  /** Appended to the TextField's own classes, on the outer column. */
  className?: string;
};

/**
 * The props not named above (`name`, `type`, `placeholder`, `autoComplete`, `ref`, event handlers)
 * go to the input. `className` is appended as is to the outer column, so a consumer's utilities or
 * plain CSS override its width.
 */
export function TextField({
  label,
  description,
  errorMessage,
  value,
  defaultValue,
  onChange,
  disabled,
  invalid,
  required,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
  let classes = textFieldClassName;
  if (className) classes = `${textFieldClassName} ${className}`;
  return (
    <Comp0TextField
      as="div"
      id={id}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      invalid={invalid}
      required={required}
      className={classes}
    >
      <Label className={textFieldLabelClassName}>{label}</Label>
      <Input {...inputProps} className={textFieldInputClassName} />
      {description && <Description className={textFieldDescriptionClassName}>{description}</Description>}
      {errorMessage && <FieldError className={textFieldErrorMessageClassName}>{errorMessage}</FieldError>}
    </Comp0TextField>
  );
}
