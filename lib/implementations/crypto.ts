import { crypto } from "@std/crypto";

/**
 * 通过秘钥将内容加密
 * @param data 要加密的数据
 * @param key 加密使用的秘钥
 * @returns result 加密后的数据
 * @returns iv 每次加密时随机生成的初始化向量，和加密内容一起保存
 */
export async function encryptData(
  data: string,
  key: CryptoKey,
): Promise<{ iv: string; result: string }> {
  const encodedData = new TextEncoder().encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 生成随机初始化向量

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encodedData,
  );

  return {
    result: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * 将被加密的数据解密
 * @param encryptedData 要解密的数据
 * @param key 加密时使用的秘钥
 * @param iv 随机生成的初始化向量，在加密时随加密后数据一起提供
 * @returns 解密后的数据
 */
export async function decryptData(
  encryptedData: string,
  key: CryptoKey,
  iv: string,
): Promise<string> {
  // 使用Base64解码加密后的数据
  const dataBinaryString = atob(encryptedData);
  const ivBinaryString = atob(iv);

  const encryptedArray = new Uint8Array(dataBinaryString.length);
  for (let i = 0; i < dataBinaryString.length; i++) {
    encryptedArray[i] = dataBinaryString.charCodeAt(i);
  }

  const ivArray = new Uint8Array(ivBinaryString.length);
  for (let i = 0; i < ivBinaryString.length; i++) {
    ivArray[i] = ivBinaryString.charCodeAt(i);
  }

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivArray,
    },
    key,
    encryptedArray,
  );

  return new TextDecoder().decode(decryptedData);
}

/**
 * 根据传入的密码生成一个加密用秘钥
 * @param pwd 长度为 16 的字符串
 */
export async function generateKey(pwd: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = encoder.encode(pwd);

  return await crypto.subtle.importKey(
    "raw",
    passwordKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"], // 密钥用途
  );
}
