import { Badge, type BadgeColor } from "@workers-comp/ui";

// A realistic use: recipe tags that jump to the ingredient they name, each in its own colour,
// and a dot-less tag for a note about the recipe.
const ingredients: [label: string, color: BadgeColor, id: string][] = [
  ["Roasted broccoli · ½", "green", "roasted-broccoli"],
  ["Green herb sauce", "teal", "green-herb-sauce"],
  ["Pickled onion", "pink", "pickled-onion"],
];

export default function RecipeTags() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 p-12">
      <article className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Charred broccoli bowl</h1>
        <ul className="mt-4 flex flex-wrap gap-2">
          {ingredients.map(([label, color, id]) => (
            <li key={id}>
              <Badge href={`#${id}`} color={color}>
                {label}
              </Badge>
            </li>
          ))}
          <li>
            <Badge color="violet" dot={false}>
              You&apos;re out · family only
            </Badge>
          </li>
        </ul>
        <ul className="mt-6 space-y-2 text-sm text-gray-700">
          {ingredients.map(([label, , id]) => (
            <li key={id} id={id}>
              {label}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
