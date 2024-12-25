# Remix Server Runtime for Deno

[![JSR](https://jsr.io/badges/@byzanteam/remix-deno-server-runtime)](https://jsr.io/@byzanteam/remix-deno-server-runtime)

This package implements the "Remix server runtime interface" that Remix runtime
packages must conform to.

> The most of the code is taken from the official package
> [@remix-run/deno](https://github.com/remix-run/remix/tree/main/packages/remix-deno),
> and I do not take credit for the original code.

## Usage

Install the package:

```
deno install jsr:@byzanteam/remix-deno-server-runtime
```

Build your Deno server:

```typescript
import { type ServerBuild } from "@remix-run/server-runtime";
import { createRequestHandlerWithStaticFiles } from "@byzanteam/remix-deno-server-runtime";

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
