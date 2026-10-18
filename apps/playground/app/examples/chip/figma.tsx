import { Chip } from "@workers-comp/ui";

// The page the Figma comparison drives (tests/chip.figma.spec.ts): a plain chip and a muted one,
// on white with the Figma label, so each can be put in a Figma state and measured against
// figma/chip.json. Each chip sits in a block wrapper so it hugs its label, as in Figma.
export default function Figma() {
  return (
    <div className="flex w-fit flex-col items-start gap-6 bg-white p-8">
      <div>
        <Chip href="#chip">Mon</Chip>
      </div>
      <div>
        <Chip href="#chip" muted>
          Mon
        </Chip>
      </div>
    </div>
  );
}
