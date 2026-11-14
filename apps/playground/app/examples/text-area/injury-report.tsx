import { useState } from "react";
import { Button, TextArea } from "@workers-comp/ui";

// A realistic use: the "what happened" step of a workers' comp claim. The description is required
// and must say enough to process the claim, so sending a short one marks the field invalid and
// explains why; the error clears as soon as the description is long enough. The employer's
// statement is filled in by the employer, so it's disabled here.
const minimum = 40;

export default function InjuryReport() {
  const [description, setDescription] = useState("");
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const tooShort = description.trim().length < minimum;

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <form
        noValidate
        className="flex w-full max-w-lg flex-col gap-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200"
        onSubmit={(event) => {
          event.preventDefault();
          setTried(true);
          setSent(!tooShort);
        }}
      >
        <div>
          <h1 className="text-base font-semibold text-gray-900">Report an injury</h1>
          <p className="mt-1 text-sm text-gray-600">Step 2 of 4: what happened</p>
        </div>
        <TextArea
          label="Injury description"
          name="description"
          required
          rows={6}
          placeholder="What happened, and how were you hurt?"
          description={`Say when, where and how it happened: at least ${minimum} characters.`}
          errorMessage={`Add a little more: ${description.trim().length} of ${minimum} characters so far.`}
          invalid={tried && tooShort}
          value={description}
          onChange={(event) => {
            setDescription(event.currentTarget.value);
            setSent(false);
          }}
        />
        <TextArea
          label="Employer's statement"
          name="employer-statement"
          placeholder="Your employer adds their statement after you send this."
          description="Filled in by your employer."
          disabled
        />
        {sent && <output className="text-sm text-gray-600">Saved. Next: medical treatment.</output>}
        <div className="flex justify-end">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </div>
  );
}
