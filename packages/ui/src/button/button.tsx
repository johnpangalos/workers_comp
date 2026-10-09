import type { ComponentProps } from "react";

/**
 * Mirrors the Figma "Button" component set (Workers Comp Design System, page "Button").
 * Prop names and values are the Figma property names and values, so
 * `variant=outline, size=sm` in Figma is `<Button variant="outline" size="sm">` here.
 *
 * The props become `data-variant` / `data-size` attributes, and the styles select on
 * them with Tailwind's `data-[…]:` variants. So the class list never changes, and
 * Figma's `state` property maps to the hover:/active:/focus-visible:/disabled: modifiers.
 */
export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonSize = "default" | "sm";

export const buttonClassName = [
  // base
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2",

  // variant=default
  "data-[variant=default]:bg-fuchsia-700 data-[variant=default]:text-white",
  "data-[variant=default]:hover:bg-fuchsia-800 data-[variant=default]:active:bg-fuchsia-900",

  // variant=outline
  "data-[variant=outline]:border data-[variant=outline]:border-gray-400",
  "data-[variant=outline]:bg-white data-[variant=outline]:text-gray-900",
  "data-[variant=outline]:hover:bg-gray-50 data-[variant=outline]:active:bg-gray-100",

  // variant=ghost
  "data-[variant=ghost]:text-fuchsia-700",
  "data-[variant=ghost]:hover:bg-fuchsia-50 data-[variant=ghost]:active:bg-fuchsia-100",

  // size
  "data-[size=default]:px-4 data-[size=default]:py-2 data-[size=default]:text-sm",
  "data-[size=sm]:px-3 data-[size=sm]:py-1 data-[size=sm]:text-xs",

  // state=disabled. `!` because `disabled:` and `data-[…]:` are equally specific and
  // Tailwind emits `disabled:` first, so without it the variant colour would win.
  "disabled:pointer-events-none disabled:bg-gray-100! disabled:text-gray-400!",
].join(" ");

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * `className` is appended, for layout (`w-full`, `mt-4`). It can't restyle the
 * variant: `data-[…]:` selectors are more specific than plain utilities, so a new
 * look means a new variant, in Figma first.
 */
export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant}
      data-size={size}
      className={className ? `${buttonClassName} ${className}` : buttonClassName}
      {...props}
    />
  );
}
