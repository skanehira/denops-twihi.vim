import { assertEquals, fs } from "../deps.ts";

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export async function assertEqualJSONFile(
  actual: unknown,
  file: string,
): Promise<void> {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    const contents = JSON.stringify(actual, null, 2);
    await fs.ensureFile(file);
    await Deno.writeFile(file, textEncoder.encode(contents));
    return;
  }

  const contents = await Deno.readFile(file);
  const expected = JSON.parse(textDecoder.decode(contents));
  assertEquals(actual, expected);
}

export async function assertEqualTextFile(
  actual: string,
  file: string,
) {
  if (Deno.env.get("UPDATE_GOLDEN")) {
    await fs.ensureFile(file);
    await Deno.writeFile(file, textEncoder.encode(actual));
    return;
  }
  const expected = textDecoder.decode(await Deno.readFile(file));
  assertEquals(actual, expected);
}
