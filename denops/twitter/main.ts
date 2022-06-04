import { autocmd, Denops, fs } from "./deps.ts";
import {
  actionOpen,
  actionOpenTimeline,
  actionPreview,
  actionTweet,
} from "./action.ts";
import StatusesHomeTimeline from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesHomeTimelineTypes.d.ts";
import { configFile } from "./config.ts";
import { loadConfig } from "./twitter.ts";

export async function main(denops: Denops): Promise<void> {
  const commands = [
    `command! -nargs=? TwitterTimeline call twitter#timeline(<f-args>)`,
    `command! TwitterTweet :new twitter://tweet`,
    `command! TwitterEditConfig call denops#notify("${denops.name}", "editConfig", [])`,
  ];

  for (const command of commands) {
    await denops.cmd(command);
  }

  await autocmd.group(denops, "twitter_buffer", (helper) => {
    helper.remove("*");

    helper.define(
      "BufReadCmd",
      "twitter://home",
      `call denops#notify("${denops.name}", "home", [])`,
    );

    helper.define(
      "BufReadCmd",
      "twitter://timeline/?*",
      `call denops#notify("${denops.name}", "timeline", [])`,
    );

    helper.define(
      "BufReadCmd",
      "twitter://tweet",
      "setlocal ft=twitter-tweet buftype=acwrite",
    );
  });

  denops.dispatcher = {
    async home(): Promise<void> {
      console.log("loading...");
      await actionOpenTimeline(denops);
      await denops.cmd("echo '' | redraw!");
    },

    async timeline(): Promise<void> {
      const bufname = await denops.call("bufname") as string;
      const screenName = bufname.replace("twitter://timeline/", "");
      console.log("loading...");
      await actionOpenTimeline(denops, screenName);
      await denops.cmd("echo '' | redraw!");
    },

    async preview(arg: unknown): Promise<void> {
      await actionPreview(denops, arg as StatusesHomeTimeline);
    },

    async open(arg: unknown): Promise<void> {
      await actionOpen(arg as StatusesHomeTimeline);
    },

    async tweet(arg: unknown): Promise<void> {
      try {
        const text = (arg as string[]).join("\n");
        await actionTweet(denops, text);
      } catch (e) {
        console.error(e.message);
      }
    },

    async editConfig(): Promise<void> {
      await fs.ensureFile(configFile);
      await denops.cmd(`new ${configFile}`);
      autocmd.group(denops, "twitter_edit_config", (helper) => {
        helper.remove("*", "<buffer>");
        helper.define(
          "BufWritePost",
          "<buffer>",
          `call denops#request("${denops.name}", "reloadConfig", [])`,
        );
      });
    },

    async reloadConfig(): Promise<void> {
      await loadConfig();
    },
  };
}
