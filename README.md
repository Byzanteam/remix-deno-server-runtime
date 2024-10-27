# Remix Server Runtime for Deno

This package implements the "Remix server runtime interface" that Remix runtime packages must conform to.

## Usage

Install the package:
```
deno install jsr:@fahchen/remix-deno-server-runtime
```

Build your Deno server:
```typescript
import { type ServerBuild } from "@remix-run/server-runtime";
import { createRequestHandlerWithStaticFiles } from "@fahchen/remix-deno-server-runtime";

const handleRequest = createRequestHandlerWithStaticFiles({
  build: (await import("./build/server/index.js")) as ServerBuild,
  mode: "production",
  staticFiles: {
    publicDir: "./build/client/",
    assetsPublicPath: "/assets/",
  },
});

export default {
  fetch: handleRequest,
} satisfies Deno.ServeDefaultExport;

// Or start the server with Deno.serve
// Deno.serve({ port: 3000 }, handleRequest);
```

Run the server:
```bash
deno serve -A server.ts
```
