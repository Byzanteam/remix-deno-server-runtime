import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { generateKey } from "./crypto.ts";
import { createEncryptedCookie } from "./cookies.ts";

describe("createEncryptedCookie", () => {
  it("should crypto and parse object data", async () => {
    const key = await generateKey("1234567890123456");

    const cookie = createEncryptedCookie("name", key);

    const cookieString = await cookie.serialize({
      value: "1",
      data: 2,
    });

    assertStringIncludes(cookieString, "name=");

    const cookieValue = await cookie.parse(cookieString);

    assertEquals(cookieValue, { value: "1", data: 2 });
  });

  it("should crypto and parse other data", async () => {
    const key = await generateKey("1234567890123456");

    const cookie = createEncryptedCookie("name", key);

    const cookieString = await cookie.serialize("string");

    assertStringIncludes(cookieString, "name=");

    const cookieValue = await cookie.parse(cookieString);

    assertEquals(cookieValue, "string");
  });

  it("should return null while not have cookie", async () => {
    const key = await generateKey("1234567890123456");

    const cookie = createEncryptedCookie("name", key);

    const cookieValue = await cookie.parse("");

    assertEquals(cookieValue, null);
  });
});
