import { Denops, isString } from "./deps.ts";

export async function main(denops: Denops): Promise<void> {
  await denops.cmd(
    `command! -nargs=1 Hello call denops#notify("${denops.name}", "hello", [<f-args>])`,
  );

  denops.dispatcher = {
    async hello(arg: unknown): Promise<void> {
      if (isString(arg)) {
        console.log("hello", arg);
      }
      await Promise.resolve();
    },
  };
}
