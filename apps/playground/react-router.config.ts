import type { Config } from "@react-router/dev/config";

// A static single-page app: Cloudflare serves build/client as assets, no server code.
export default {
  ssr: false,
} satisfies Config;
