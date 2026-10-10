import { Button } from "@workers-comp/ui";

const variants = ["default", "outline", "ghost"] as const;
const sizes = ["default", "sm"] as const;

// The page the pixel test drives (tests/button.figma.spec.ts): one enabled and one disabled
// Button per variant and size, on white with the Figma label, so each can be put in a Figma
// state and compared with the export in figma/button.png.
export default function Figma() {
  return (
    <div className="grid w-fit grid-cols-2 gap-8 bg-white p-8">
      {variants.flatMap((variant) =>
        sizes.flatMap((size) => [
          <div key={`${variant}-${size}`}>
            <Button variant={variant} size={size}>
              Button
            </Button>
          </div>,
          <div key={`${variant}-${size}-disabled`}>
            <Button variant={variant} size={size} disabled>
              Button
            </Button>
          </div>,
        ]),
      )}
    </div>
  );
}
