import {
  type Cookie,
  type CookieOptions,
  type CookieParseOptions,
  type CookieSerializeOptions,
  createCookieFactory,
  type CreateCookieFunction,
  type SignFunction,
  type UnsignFunction,
} from "@remix-run/server-runtime";
import { decryptData, encryptData } from "./crypto.ts";

const encoder = new TextEncoder();

const sign: SignFunction = async (value, secret) => {
  const data = encoder.encode(value);
  const key = await createKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(
    /=+$/,
    "",
  );

  return value + "." + hash;
};

const unsign: UnsignFunction = async (cookie, secret) => {
  const value = cookie.slice(0, cookie.lastIndexOf("."));
  const hash = cookie.slice(cookie.lastIndexOf(".") + 1);

  const data = encoder.encode(value);
  const key = await createKey(secret, ["verify"]);
  const signature = byteStringToUint8Array(atob(hash));
  const valid = await crypto.subtle.verify("HMAC", key, signature, data);

  return valid ? value : false;
};

async function createKey(
  secret: string,
  usages: CryptoKey["usages"],
): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );

  return key;
}

function byteStringToUint8Array(byteString: string): Uint8Array {
  const array = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }

  return array;
}

export const createCookie: CreateCookieFunction = createCookieFactory({
  sign,
  unsign,
});

/**
 * 创建一个内容被加密的 cookie
 * @example
 * const key = await generateKey(pwd)
 * const encryptedCookie = createEncryptedCookie("my-cookie-name", key)
 * const headers = new Headers({
 *   "Set-Cookie": await cookie.serialize(value)
 * })
 */
export function createEncryptedCookie(
  name: string,
  key: CryptoKey,
  options?: CookieOptions,
): Cookie {
  const cookie = createCookie(name, options);

  return {
    ...cookie,
    serialize: async (value: unknown, options?: CookieSerializeOptions) => {
      return await cookie.serialize(
        await encryptData(JSON.stringify(value), key),
        options,
      );
    },
    parse: async (value: string, options?: CookieParseOptions) => {
      const parseResult = await cookie.parse(value, options);

      if (!parseResult) return parseResult;

      const decryptedData = await decryptData(
        parseResult.result,
        key,
        parseResult.iv,
      );

      try {
        return JSON.parse(decryptedData);
      } catch {
        return decryptedData;
      }
    },
  };
}

export { isCookie } from "@remix-run/server-runtime";
