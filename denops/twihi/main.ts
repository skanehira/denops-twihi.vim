import { autocmd, Denops, helper } from "./deps.ts";
import {
  actionAddMediaFromClipboard,
  actionLike,
  actionOpen,
  actionOpenMedia,
  actionOpenTimeline,
  actionReply,
  actionRetweet,
  actionRetweetWithComment,
  actionTweet,
  actionWatchingMention,
} from "./action.ts";
import { configFile } from "./config.ts";
import { loadConfig } from "./twihi.ts";
import { Timeline } from "./type.d.ts";

export async function main(denops: Denops): Promise<void> {
  await autocmd.group(denops, "twihi_buffer", (helper) => {
    helper.remove("*");

    helper.define(
      "BufReadCmd",
      "twihi://home",
      `call denops#notify("${denops.name}", "home", [])`,
    );

    helper.define(
      "BufReadCmd",
      "twihi://mentions",
      `call denops#notify("${denops.name}", "mentions", [])`,
    );

    helper.define(
      "BufReadCmd",
      "twihi://timeline/?*",
      `call denops#notify("${denops.name}", "timeline", [])`,
    );

    helper.define(
      "BufReadCmd",
      "twihi://timeline\?query=*",
      `call denops#notify("${denops.name}", "timeline", [])`,
    );

    helper.define(
      "BufReadCmd",
      "twihi://retweet",
      "setlocal ft=twihi-retweet buftype=acwrite",
    );

    helper.define(
      "BufReadCmd",
      "twihi://tweet",
      "setlocal ft=twihi-tweet buftype=acwrite",
    );

    helper.define(
      "BufReadCmd",
      "twihi://reply",
      "setlocal ft=twihi-reply buftype=acwrite",
    );
  });

  denops.dispatcher = {
    async home(): Promise<void> {
      await helper.echo(denops, "loading...");
      await actionOpenTimeline(denops, "home");
      await helper.echo(denops, "");
    },

    async mentions(): Promise<void> {
      await helper.echo(denops, "loading...");
      await actionOpenTimeline(denops, "mentions");
      await helper.echo(denops, "");
    },

    async timeline(): Promise<void> {
      await helper.echo(denops, "loading...");
      const bufname = (await denops.call("bufname")) as string;
      if (new URL(bufname).search) {
        const query = bufname.replace(String.raw`twihi://timeline?query=`, "");
        await actionOpenTimeline(denops, "search", { query });
      } else {
        const screenName = bufname.replace("twihi://timeline/", "");
        await actionOpenTimeline(denops, "user", { screenName });
      }
      await helper.echo(denops, "");
    },

    async open(arg: unknown): Promise<void> {
      await actionOpen(denops, arg as Timeline);
    },

    async openMedia(arg: unknown): Promise<void> {
      await actionOpenMedia(arg as string);
    },

    async tweet(arg: unknown): Promise<void> {
      try {
        const text = (arg as string[]).join("\n");
        await actionTweet(denops, text);
      } catch (e) {
        await helper.echoerr(denops, e.message);
      }
    },

    async editConfig(): Promise<void> {
      await denops.cmd(`new ${configFile}`);
      await autocmd.group(denops, "twihi_edit_config", (helper) => {
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

    async like(arg: unknown): Promise<void> {
      const timeline = arg as Timeline;
      await actionLike(denops, timeline.id_str);
    },

    async reply(tweet: unknown, text: unknown): Promise<void> {
      await actionReply(denops, tweet as Timeline, text as string);
    },

    async retweet(tweet: unknown): Promise<void> {
      await actionRetweet(denops, (tweet as Timeline).id_str);
    },

    async retweetWithComment(text: unknown): Promise<void> {
      await actionRetweetWithComment(denops, text as string);
    },

    async mediaAddFromClipboard(): Promise<string> {
      return await actionAddMediaFromClipboard();
    },
  };

  // watching mentions
  actionWatchingMention(denops);

  try {
    await loadConfig();
  } catch (_) {
    await helper.echo(denops, "please edit config using :TwitterEditConfig");
  }
}
