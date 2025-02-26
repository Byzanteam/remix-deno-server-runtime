import { extname as getExtname, join as joinPath } from "@std/path";
import { contentType as getContentType } from "@std/media-types";

import {
  type AppLoadContext,
  createRequestHandler as createRemixRequestHandler,
  type CreateRequestHandlerFunction,
} from "@remix-run/server-runtime";

type RequestHandler = (request: Request) => Promise<Response>;

type GetLoadContextFunction = (
  request: Request,
) => Promise<AppLoadContext> | AppLoadContext;

type HandlerArguments = {
  build: Parameters<CreateRequestHandlerFunction>[0];
  mode?: Parameters<CreateRequestHandlerFunction>[1];
};

type ServeStaticFilesOptions = {
  cacheControl?: string | ((url: URL) => string);
  publicDir?: string;
  assetsPublicPath?: string;
};

export function createRequestHandler({
  build,
  mode,
  getLoadContext,
}: HandlerArguments & {
  getLoadContext?: GetLoadContextFunction;
}): RequestHandler {
  const handleRequest = createRemixRequestHandler(build, mode);

  return async (request: Request) => {
    try {
      const loadContext = await getLoadContext?.(request);

      return handleRequest(request, loadContext);
    } catch (error: unknown) {
      console.error(error);

      return new Response("Internal Error", { status: 500 });
    }
  };
}

class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`No such file or directory: ${filePath}`);
  }
}

function defaultCacheControl(url: URL, assetsPublicPath: string): string {
  if (url.pathname.startsWith(assetsPublicPath)) {
    return "public, max-age=31536000, immutable";
  } else {
    return "public, max-age=600";
  }
}

function getContentTypeOfURL(url: URL): string | undefined {
  const path = url.pathname;
  const extname = getExtname(path);

  return getContentType(extname);
}

export async function serveStaticFiles(
  request: Request,
  options: ServeStaticFilesOptions = {},
  basename?: string,
): Promise<Response> {
  const {
    cacheControl,
    publicDir = "./build/client/",
    assetsPublicPath = "/assets/",
  } = options;

  const url = new URL(request.url);

  const headers = new Headers();

  const contentType = getContentTypeOfURL(url);
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (typeof cacheControl === "function") {
    headers.set("Cache-Control", cacheControl(url));
  } else if (cacheControl) {
    headers.set("Cache-Control", cacheControl);
  } else if (assetsPublicPath) {
    headers.set("Cache-Control", defaultCacheControl(url, assetsPublicPath));
  }

  if (basename && !url.pathname.startsWith(basename)) {
    throw new FileNotFoundError("not assets request");
  }

  const filePath = joinPath(
    publicDir,
    basename
      ? url.pathname.replace(new RegExp(`^${basename}`), "")
      : url.pathname,
  );

  try {
    const file = await Deno.open(filePath, { read: true });
    const fileInfo = await file.stat();

    if (fileInfo.isFile) {
      return new Response(file.readable, { headers });
    }

    throw new FileNotFoundError(filePath);
  } catch (error) {
    if (
      ["EISDIR", "ENOENT"].includes(
        (error as { code?: string }).code as string,
      ) ||
      error instanceof Deno.errors.IsADirectory ||
      error instanceof Deno.errors.NotFound
    ) {
      throw new FileNotFoundError(filePath);
    }

    throw error;
  }
}

export async function createRequestHandlerWithStaticFiles({
  build,
  mode,
  getLoadContext,
  staticFiles,
}: HandlerArguments & {
  getLoadContext?: GetLoadContextFunction;
  staticFiles?: ServeStaticFilesOptions;
}): Promise<RequestHandler> {
  const serverBuild = typeof build === "function" ? await build() : build;
  const remixHandler = createRequestHandler({
    build: serverBuild,
    mode,
    getLoadContext,
  });

  return async (request: Request) => {
    try {
      return await serveStaticFiles(request, staticFiles, serverBuild.basename);
    } catch (error: unknown) {
      if (!(error instanceof FileNotFoundError)) {
        throw error;
      }
    }

    return remixHandler(request);
  };
}
