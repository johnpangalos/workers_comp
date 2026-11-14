import { useState, type FormEvent } from "react";
import { Button, TextField } from "@workers-comp/ui";

type Errors = { name?: string | undefined; email?: string | undefined; phone?: string | undefined };

// A realistic use: the contact step of a workers' comp claim. The fields are controlled, checked when
// the form is sent, and each one that fails shows its error until it is changed. The claim number is
// assigned by the insurer, so it is shown but disabled.
export default function ClaimContact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter the injured employee's name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Enter a valid email address.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a phone number with its area code.";
    setErrors(next);
    setSent(Object.keys(next).length === 0);
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <form
        noValidate
        onSubmit={submit}
        className="flex w-full max-w-md flex-col gap-5 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200"
      >
        <div>
          <h1 className="text-base font-semibold text-gray-900">Who should we contact about this claim?</h1>
          <p className="mt-1 text-sm text-gray-500">Step 2 of 4: contact details</p>
        </div>
        <TextField
          label="Claim number"
          name="claim"
          defaultValue="WC-2026-004817"
          disabled
          className="w-full"
        />
        <TextField
          label="Employee name"
          name="name"
          autoComplete="name"
          placeholder="Jordan Lee"
          required
          value={name}
          onChange={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          invalid={Boolean(errors.name)}
          errorMessage={errors.name}
          className="w-full"
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          description="We'll send updates about your claim here."
          invalid={Boolean(errors.email)}
          errorMessage={errors.email}
          className="w-full"
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="(555) 010-4477"
          required
          value={phone}
          onChange={(value) => {
            setPhone(value);
            setErrors((current) => ({ ...current, phone: undefined }));
          }}
          description="An adjuster may call within two business days."
          invalid={Boolean(errors.phone)}
          errorMessage={errors.phone}
          className="w-full"
        />
        {sent && <p className="text-sm text-gray-600">Saved. Next: details of the injury.</p>}
        <div className="flex justify-end">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </div>
  );
}
