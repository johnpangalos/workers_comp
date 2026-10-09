import { Button } from "@workers-comp/ui";
import { Link } from "react-router";

// `as` renders the button as a router link: same styles and states, but it
// navigates, opens in a new tab with ⌘-click, and shows its URL on hover.
export default function AsLink() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <div className="flex w-full max-w-md items-center justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <p className="text-sm text-gray-700">You have 3 unread messages.</p>
        <div className="flex gap-2">
          <Button as={Link} to="/" variant="ghost" size="sm">
            Back
          </Button>
          <Button as={Link} to="/button/variants" size="sm">
            View all
          </Button>
        </div>
      </div>
    </div>
  );
}
