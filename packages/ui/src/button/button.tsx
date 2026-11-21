import type { ElementType } from "react";
import { bindClassNames } from "../class-names";
import styles from "../tailwind.module.css";
import { Button as Comp0Button, type ButtonProps as Comp0ButtonProps } from "@comp0/react";

/**
 * Mirrors the Figma "Button" component set (Workers Comp Design System, page "Button").
 * Prop names and values are the Figma property names and values, so
 * `variant=outlined, size=sm` in Figma is `<Button variant="outlined" size="sm">` here.
 *
 * Behaviour comes from comp0's headless Button. It reports Figma's `state` property as
 * presence attributes (`data-hovered`, `data-pressed`, `data-focus-visible`,
 * `data-disabled`), and `variant` / `size` render as `data-variant` / `data-size`.
 * The classes below select on those attributes. Each one is a scoped class in
 * tailwind.module.css, so the package ships plain CSS.
 */
export type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "accent";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

// Names in the module resolve to their scoped class.
const cx = bindClassNames(styles);

export type ButtonProps<TElement extends ElementType = "button"> = Comp0ButtonProps<TElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * `className` is appended as is. The Button's own styles sit in `@layer components`, so a
 * consumer's Tailwind utilities or plain CSS override them.
 */
export function Button<TElement extends ElementType = "button">({
  className,
  variant = "filled",
  size = "md",
  ...props
}: ButtonProps<TElement>) {
  return (
    <Comp0Button
      {...(props as Comp0ButtonProps<TElement>)}
      data-variant={variant}
      data-size={size}
      // Hover and press select on `not-data-disabled`, so a button that turns disabled (or
      // pending) while hovered or held never shows those states; hover also selects on
      // `not-data-pressed`, so no two colour rules match at once. Disabled colours are stacked
      // on the variant, which beats its plain colours on specificity.
      //
      // Motion, from Figma's prototype (figma/button-motion.json): default to hover is Smart
      // Animate over 150ms on Tailwind's ease-in-out; hover to pressed is a spring, the theme's
      // `ease-spring` over its 400ms, which springs the corners from the size's pill radius (half its height) to its pressed one.
      //
      // The outlined Button's 1px border is inside its box in Figma and not part of its layout,
      // so its padding is Figma's less the border (`py-2` is `py-1.75` + 1px): the label sits where
      // Figma's does, and the box is Figma's height.
      className={[
        cx(`
          preflight inline-flex items-center justify-center gap-2 font-sans transition-colors-radius
          duration-150 ease-in-out outline-none
          data-disabled:pointer-events-none
          data-focus-visible:outline-2 data-focus-visible:outline-offset-2
          data-focus-visible:outline-fuchsia-600 data-focus-visible:outline-solid
          not-data-disabled:data-pressed:duration-400 not-data-disabled:data-pressed:ease-spring
          data-variant:data-disabled:text-gray-400
          motion-reduce:transition-none
          data-[size=lg]:rounded-pill-lg data-[size=lg]:px-12 data-[size=lg]:py-8 data-[size=lg]:text-2xl
          data-[size=lg]:font-bold
          data-[size=lg]:not-data-disabled:data-pressed:rounded-3xl
          data-[size=md]:rounded-pill-md data-[size=md]:px-6 data-[size=md]:py-4 data-[size=md]:text-base
          data-[size=md]:font-semibold
          data-[size=md]:not-data-disabled:data-pressed:rounded-2xl
          data-[size=sm]:rounded-pill-sm data-[size=sm]:px-4 data-[size=sm]:py-2.5 data-[size=sm]:text-sm
          data-[size=sm]:font-semibold
          data-[size=sm]:not-data-disabled:data-pressed:rounded-xl
          data-[size=xl]:rounded-pill-xl data-[size=xl]:px-16 data-[size=xl]:py-12 data-[size=xl]:text-4xl
          data-[size=xl]:font-bold
          data-[size=xl]:not-data-disabled:data-pressed:rounded-4xl
          data-[size=xs]:rounded-pill-xs data-[size=xs]:px-3 data-[size=xs]:py-2 data-[size=xs]:text-xs
          data-[size=xs]:font-semibold
          data-[size=xs]:not-data-disabled:data-pressed:rounded-lg
          data-[variant=accent]:bg-orange-500 data-[variant=accent]:text-orange-950
          data-[variant=accent]:data-disabled:bg-gray-100
          data-[variant=accent]:not-data-disabled:not-data-pressed:data-hovered:bg-orange-400
          data-[variant=accent]:not-data-disabled:data-pressed:bg-orange-300
          data-[variant=filled]:bg-fuchsia-700 data-[variant=filled]:text-white
          data-[variant=filled]:data-disabled:bg-gray-100
          data-[variant=filled]:not-data-disabled:not-data-pressed:data-hovered:bg-fuchsia-800
          data-[variant=filled]:not-data-disabled:data-pressed:bg-fuchsia-900
          data-[variant=outlined]:border data-[variant=outlined]:border-fuchsia-700
          data-[variant=outlined]:text-fuchsia-700
          data-[variant=outlined]:data-disabled:border-gray-200
          data-[variant=outlined]:not-data-disabled:not-data-pressed:data-hovered:bg-fuchsia-50
          data-[variant=outlined]:not-data-disabled:data-pressed:bg-fuchsia-100
          data-[variant=outlined]:data-[size=lg]:px-11.75 data-[variant=outlined]:data-[size=lg]:py-7.75
          data-[variant=outlined]:data-[size=md]:px-5.75 data-[variant=outlined]:data-[size=md]:py-3.75
          data-[variant=outlined]:data-[size=sm]:px-3.75 data-[variant=outlined]:data-[size=sm]:py-2.25
          data-[variant=outlined]:data-[size=xl]:px-15.75 data-[variant=outlined]:data-[size=xl]:py-11.75
          data-[variant=outlined]:data-[size=xs]:px-2.75 data-[variant=outlined]:data-[size=xs]:py-1.75
          data-[variant=text]:text-fuchsia-700
          data-[variant=text]:not-data-disabled:not-data-pressed:data-hovered:bg-fuchsia-50
          data-[variant=text]:not-data-disabled:data-pressed:bg-fuchsia-100
          data-[variant=tonal]:bg-fuchsia-100 data-[variant=tonal]:text-fuchsia-950
          data-[variant=tonal]:data-disabled:bg-gray-100
          data-[variant=tonal]:not-data-disabled:not-data-pressed:data-hovered:bg-fuchsia-200
          data-[variant=tonal]:not-data-disabled:data-pressed:bg-fuchsia-300
        `),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
