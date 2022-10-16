import { path } from "../deps.ts";
export async function ensureFile(filePath: string) {
  try {
    const stat = await Deno.lstat(filePath);
    if (stat.isDirectory) {
      throw new Error(
        `Ensure path exists, expected 'file', got 'dir'`,
      );
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      await ensureDir(path.dirname(filePath));
      await Deno.writeFile(filePath, new Uint8Array());
      return;
    }

    throw err;
  }
}

async function ensureDir(dir: string) {
  try {
    const fileInfo = await Deno.lstat(dir);
    if (fileInfo.isFile) {
      throw new Error(
        `Ensure path exists, expected 'dir', got 'file'`,
      );
    }

    if (fileInfo.isSymlink && !isDir(dir)) {
      throw new Error(`${dir} is not directory`);
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      await Deno.mkdir(dir, { recursive: true });
      return;
    }
    throw err;
  }
}

async function isDir(dir: string): Promise<boolean> {
  for await (const _ of Deno.readDir(dir)) {
    return true;
  }
  return false;
}
