import { Button } from "@workers-comp/ui";
import { Form, useNavigation } from "react-router";
import type { Route } from "./+types/form";

// Pretend to send the invite, slowly enough to see the pending state.
export async function clientAction({ request }: Route.ClientActionArgs) {
  const email = String((await request.formData()).get("email"));
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { sent: email };
}

export default function InviteForm({ actionData: result }: Route.ComponentProps) {
  const navigation = useNavigation();
  const sending = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <Form method="post" className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-base font-semibold">Invite a teammate</h1>
        <label htmlFor="email" className="mt-4 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="sam@example.com"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-600 focus:outline-none"
        />
        {result && <p className="mt-3 text-sm text-gray-500">Invite sent to {result.sent}.</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="reset" variant="ghost">
            Clear
          </Button>
          <Button type="submit" pending={sending}>
            {sending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
