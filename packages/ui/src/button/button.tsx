import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { match } from "../lib/match";

/**
 * Mirrors the Figma "Button" component set (Workers Comp Design System, page "Button").
 * Prop names and values are the Figma property names and values, so
 * `variant=outline, size=sm` in Figma is `<Button variant="outline" size="sm">` here.
 * Figma's `state` property has no prop: it is the hover:/active:/focus-visible:/disabled: modifiers.
 */
export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonSize = "default" | "sm";

const base =
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400";

export function buttonClasses({
  variant = "default",
  size = "default",
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return cn(
    base,
    match(variant, {
      default: "bg-fuchsia-700 text-white hover:bg-fuchsia-800 active:bg-fuchsia-900",
      outline: "border border-gray-400 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100",
      ghost: "text-fuchsia-700 hover:bg-fuchsia-50 active:bg-fuchsia-100",
    }),
    match(size, {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1 text-xs",
    }),
  );
}

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

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
      className={cn(buttonClasses({ variant, size }), className)}
      {...props}
    />
  );
}
