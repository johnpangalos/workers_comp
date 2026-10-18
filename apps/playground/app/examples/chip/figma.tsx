import { Chip } from "@workers-comp/ui";

// The page the Figma comparison drives (tests/chip.figma.spec.ts): the four states of the Chip on
// white with the Figma label, each in a block wrapper so it hugs its label, as in Figma. Each
// wrapper names its state in data-figma-chip, so the spec can pick the chip it measures.
export default function Figma() {
  return (
    <div className="flex w-fit flex-col items-start gap-6 bg-white p-8">
      <div data-figma-chip="plain">
        <Chip href="#chip">Mon</Chip>
      </div>
      <div data-figma-chip="current">
        <Chip href="#chip" current>
          Mon
        </Chip>
      </div>
      <div data-figma-chip="muted">
        <Chip href="#chip" muted>
          Mon
        </Chip>
      </div>
      <div data-figma-chip="muted-current">
        <Chip href="#chip" muted current>
          Mon
        </Chip>
      </div>
    </div>
  );
}
