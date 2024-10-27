import {
  createCookieSessionStorageFactory,
  createMemorySessionStorageFactory,
  createSessionStorageFactory,
} from "@remix-run/server-runtime";

import { createCookie } from "./cookies.ts";

export { isSession } from "@remix-run/server-runtime";

export const createSessionStorage = createSessionStorageFactory(createCookie);

export const createCookieSessionStorage = createCookieSessionStorageFactory(
  createCookie,
);
export const createMemorySessionStorage = createMemorySessionStorageFactory(
  createSessionStorage,
);
