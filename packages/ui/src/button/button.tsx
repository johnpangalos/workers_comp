import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Mirrors the Figma "Button" component set (Workers Comp Design System, page "Button").
 * Prop names and values are the Figma property names and values, so
 * `variant=outline, size=sm` in Figma is `<Button variant="outline" size="sm">` here.
 * Figma's `state` property has no prop: it is the hover:/active:/focus-visible:/disabled: modifiers.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400",
  {
    variants: {
      variant: {
        default: "bg-fuchsia-700 text-white hover:bg-fuchsia-800 active:bg-fuchsia-900",
        outline:
          "border border-gray-400 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100",
        ghost: "text-fuchsia-700 hover:bg-fuchsia-50 active:bg-fuchsia-100",
      },
      size: {
        default: "px-4 py-2 text-sm",
        sm: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
