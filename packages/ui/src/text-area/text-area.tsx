import type { ComponentProps, ReactNode } from "react";
import {
  Description as Comp0Description,
  FieldError as Comp0FieldError,
  Label as Comp0Label,
  TextArea as Comp0TextArea,
  TextField as Comp0TextField,
} from "@comp0/react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";

/**
 * Mirrors the Figma "TextArea" component set (Workers Comp Design System, page "TextArea", node
 * 98:133): a label, a textarea, a description and, when invalid, an error message, in a column.
 * Prop names are the Figma property names: the text properties `label`, `placeholder`,
 * `description` and `errorMessage`, and the variant `invalid`. Figma's `state` (hover, focus,
 * disabled) is not a prop: comp0's TextArea reports it as `data-hovered`, `data-focus-visible` and
 * `data-disabled`, and `invalid` as `data-invalid`, which the textarea's classes select on.
 *
 * Behaviour comes from comp0: its TextField wires the label to the textarea and the description and
 * error message to `aria-describedby`, and only mounts the error message while the field is invalid.
 */

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

export type TextAreaProps = Omit<ComponentProps<"textarea">, "className" | "children"> & {
  /** The label above the textarea; Figma's `label`. */
  label: ReactNode;
  /** Help under the textarea, read with it by screen readers; Figma's `description`. */
  description?: ReactNode;
  /** Shown under the description while `invalid`, and announced; Figma's `errorMessage`. */
  errorMessage?: ReactNode;
  /** Draws the field as invalid and sets `aria-invalid`; Figma's `invalid`. */
  invalid?: boolean;
  /** Appended to the field's classes (the column that holds the label and the textarea). */
  className?: string;
};

/**
 * Every other prop (`placeholder`, `name`, `rows`, `value`, `defaultValue`, `onChange`, `ref`, …)
 * goes to the native textarea. `className` is appended to the field's classes as is, so a consumer's
 * utilities override them.
 */
export function TextArea({
  label,
  description,
  errorMessage,
  invalid,
  disabled,
  required,
  id,
  className,
  ...props
}: TextAreaProps) {
  return (
    <Comp0TextField
      as="div"
      id={id}
      invalid={invalid}
      disabled={disabled}
      required={required}
      // The column, in the label's type. The description and error message set their own weight
      // and colour.
      className={[cx(`flex flex-col gap-1.5 font-sans text-sm font-medium text-gray-900`), className]
        .filter(Boolean)
        .join(" ")}
    >
      <Comp0Label>{label}</Comp0Label>
      {/*
        The reset classes are Button's, minus `border-0`: the border is always on. It is at least
        Figma's minimum height, `spacing/24` (`min-h-24`, 96px, just under four lines of text);
        `rows={4}` or more makes it taller. Figma draws no resize handle, so it has none
        (`resize-none`): longer text scrolls.

        Figma draws the placeholder as the control's text, so while the placeholder shows, the
        textarea's own colour is the placeholder's (`placeholder-shown`); typed text is gray-900.
        Invalid wins over hover, and disabled over both.
      */}
      <Comp0TextArea
        {...props}
        className={cx(`
          m-0 box-border block min-h-24 w-full resize-none appearance-none rounded-md border border-solid
          border-gray-400 bg-white px-3 py-2 font-sans text-sm font-normal text-gray-900 transition-colors
          outline-none
          placeholder:text-gray-500
          not-data-disabled:placeholder-shown:text-gray-500
          not-data-disabled:data-invalid:border-red-600
          data-disabled:pointer-events-none data-disabled:border-gray-200 data-disabled:bg-gray-100
          data-disabled:text-gray-400
          data-disabled:placeholder:text-gray-400
          data-focus-visible:ring-2 data-focus-visible:ring-fuchsia-600 data-focus-visible:ring-offset-2
          not-data-invalid:data-hovered:border-gray-500
        `)}
      />
      {description && (
        <Comp0Description className={cx(`font-normal text-gray-600`)}>{description}</Comp0Description>
      )}
      {errorMessage && (
        <Comp0FieldError className={cx(`font-normal text-red-600`)}>{errorMessage}</Comp0FieldError>
      )}
    </Comp0TextField>
  );
}
