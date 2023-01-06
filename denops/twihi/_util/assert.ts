import { fs } from "../deps.ts";
import { assertEquals } from "../deps_test.ts";

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export const assertEqualJSONFile = async (
  actual: unknown,
  file: string,
): Promise<void> => {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    const contents = JSON.stringify(actual, null, 2);
    await fs.ensureFile(file);
    await Deno.writeFile(file, textEncoder.encode(contents));
    return;
  }

  const contents = await Deno.readFile(file);
  const expected = JSON.parse(textDecoder.decode(contents));
  assertEquals(actual, expected);
};

export const assertEqualTextFile = async (
  actual: string,
  file: string,
): Promise<void> => {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    await fs.ensureFile(file);
    await Deno.writeFile(file, textEncoder.encode(actual));
    return;
  }
  const expected = textDecoder.decode(await Deno.readFile(file));
  assertEquals(actual, expected);
};
