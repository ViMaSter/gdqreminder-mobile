import { test, expect } from "@playwright/experimental-ct-vue";
import Base16 from "./base16";

test("encoding a string should yield the same string when decoding", async () => {
  const originalString = "Hello, World!";
  const encodedString = Base16.encode(originalString);

  console.log("Encoded String:", encodedString);

  const decodedString = Base16.decode(encodedString);
  expect(decodedString).toBe(originalString);
});

test("encoding empty string returns empty string", async () => {
  const originalString = "";
  const encodedString = Base16.encode(originalString);
  console.log("Encoded String:", encodedString);
  const decodedString = Base16.decode(encodedString);
  console.log("Decoded String:", decodedString);
  expect(decodedString).toBe(originalString);
});

test("encoding a string twice requires decoding twice", async () => {
  const originalString = "Hello, World!";
  const encodedString1 = Base16.encode(originalString);
  const encodedString2 = Base16.encode(encodedString1);

  console.log("Encoded String 1:", encodedString1);
  console.log("Encoded String 2:", encodedString2);

  const decodedString2 = Base16.decode(encodedString2);
  console.log("Decoded String 2:", decodedString2);
  const decodedString1 = Base16.decode(decodedString2);
  console.log("Decoded String 1:", decodedString1);

  expect(decodedString1).toBe(originalString);
  expect(decodedString2).not.toBe(originalString);
});

[
    "3668356c75727a43-56465641-77554a67-41443574-34303670-67637131",
    "12345678-1234567",
    "12345678-123456789",
    "12345678-1234567g",
    "12345678-1234567-",
    "12345678-1234567-12345678",
    "12345678-1234567-12345678g",
    "1234g678"
].forEach((input) => {
    test("decoding invalid input fails: "+input, async () => {
        expect(() => Base16.decode(input)).toThrowError();
    });
});