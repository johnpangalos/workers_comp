import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { KeyDisplay } from "./key-display";
import "./styles.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Workers Comp playground</title>
        <link rel="icon" href="data:," />
        <Meta />
        <Links />
      </head>
      <body className="font-sans text-gray-900 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Outlet />
      <KeyDisplay />
    </>
  );
}
