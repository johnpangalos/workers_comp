import { TextField } from "@workers-comp/ui";

const states = ["default", "hover", "focus", "disabled"] as const;

// The page the Figma comparison drives (tests/text-field.figma.spec.ts): a TextField per variant of
// the Figma component set, on white with the Figma text, each in a wrapper the spec can find
// ("hover-true" is state=hover, invalid=true). The spec puts each one in its state the way a person
// would: hovering, tabbing to it. The invalid ones hold a value, as in Figma; the others show the
// placeholder.
export default function Figma() {
  return (
    <div className="grid w-fit grid-cols-2 gap-12 bg-white p-8">
      {(["false", "true"] as const).flatMap((invalid) =>
        states.map((state) => {
          let value: string | undefined;
          if (invalid === "true") value = "jane.doe@";
          return (
            <div key={`${state}-${invalid}`} data-figma-field={`${state}-${invalid}`}>
              <TextField
                label="Email"
                name={`email-${state}-${invalid}`}
                type="email"
                placeholder="you@example.com"
                defaultValue={value}
                description="We'll send updates about your claim here."
                errorMessage="Enter a valid email address."
                invalid={invalid === "true"}
                disabled={state === "disabled"}
              />
            </div>
          );
        }),
      )}
    </div>
  );
}
