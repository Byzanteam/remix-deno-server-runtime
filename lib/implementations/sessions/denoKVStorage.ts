import type {
  FlashSessionData as RemixFlashSessionData,
  SessionData,
  SessionIdStorageStrategy,
  SessionStorage,
} from "@remix-run/server-runtime";

import { createSessionStorage } from "../sessions.ts";

interface DenoKVSessionStorageOptions<Data> {
  /**
   * The Cookie used to store the session id on the client, or options used
   * to automatically create one.
   */
  cookie?: SessionIdStorageStrategy["cookie"];

  /**
   * The path used by the database to persist the session data.
   * See more at {@linkcode Deno.openKv} documentation.
   */
  path?: string;

  /**
   * A function that generates a new session id.
   * By default, it uses `crypto.randomUUID()` to generate a v4 UUID.
   */
  idGenerator?: (data: Data) => string;
}

/**
 * Creates a SessionStorage that stores session data in the Deno KV Store.
 *
 * The advantage of using this instead of cookie session storage is that
 * files may contain much more data than cookies.
 */
function createDenoKVSessionStorage<
  Data = SessionData,
  FlashData = Data,
>({
  cookie,
  path,
  idGenerator,
}: DenoKVSessionStorageOptions<
  RemixFlashSessionData<Data, FlashData>
>): SessionStorage<Data, FlashData> {
  type FlashSessionData = RemixFlashSessionData<Data, FlashData>;

  async function getDb(): Promise<Deno.Kv> {
    if (path) {
      return await Deno.openKv(path);
    } else {
      return await Deno.openKv();
    }
  }

  function generateId(data: FlashSessionData): string {
    return idGenerator ? idGenerator(data) : crypto.randomUUID();
  }

  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      const db = await getDb();

      while (true) {
        const id = generateId(data);

        const result = await db.get<FlashSessionData>([id]);

        if (result.versionstamp) {
          continue;
        }

        await db.set([id], data, {
          expireIn: expires ? expires.getTime() - Date.now() : undefined,
        });

        return id;
      }
    },
    async readData(id) {
      const db = await getDb();

      const session = await db.get<FlashSessionData>([id]);

      if (session.versionstamp) {
        return session.value;
      }

      return null;
    },
    async updateData(id, data, expires) {
      const db = await getDb();

      await db.set([id], data, {
        expireIn: expires ? expires.getTime() - Date.now() : undefined,
      });
    },
    async deleteData(id) {
      const db = await getDb();

      await db.delete([id]);
    },
  });
}

export { createDenoKVSessionStorage as unstable_createDenoKVSessionStorage };
