import {
  assertEquals,
  assertNotEquals,
  clipboard,
  Denops,
  helper,
  path,
  test,
  vars,
} from "./deps.ts";
import {
  actionOpenTimeline,
  actionReply,
  actionRetweetWithComment,
  actionTweet,
} from "./action.ts";
import { assertEqualTextFile } from "./_util/assert.ts";
import { main } from "./main.ts";
import { Timeline } from "./type.d.ts";

const pluginRoot = path.dirname(
  path.dirname(path.dirname(path.fromFileUrl(import.meta.url))),
);

export const autoloadDir = path.join(
  pluginRoot,
  "autoload",
);

export const ftpluginDir = path.join(
  pluginRoot,
  "ftplugin",
);

export async function load(denops: Denops, dir: string) {
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile) {
      await helper.load(
        denops,
        path.toFileUrl(path.join(dir, entry.name)),
      );
    }
  }
}

const testdataDir = path.join(
  "denops",
  "twitter",
  "testdata",
);

test({
  mode: "all",
  name: "open home timeline",
  fn: async (denops: Denops) => {
    await load(denops, autoloadDir);

    await actionOpenTimeline(denops, "home");

    const actual = await denops.call("getline", 1, "$") as string[];
    const expectFile = path.join(
      testdataDir,
      "want_homeline_overview.text",
    );
    await assertEqualTextFile(actual.join("\n"), expectFile);

    const preview = await denops.call(
      "getbufline",
      "twitter://home/preview",
      1,
      "$",
    ) as string[];

    const expectPreview = path.join(
      testdataDir,
      "want_homeline_preview.text",
    );

    await assertEqualTextFile(preview.join("\n"), expectPreview);

    // NOTE: assert preview changing only in Neovim
    // because Vim's feedkeys doesn't working correctly trough denops
    if (denops.meta.host == "nvim") {
      await denops.call("feedkeys", "j");
      const newPreview = await denops.call(
        "getbufline",
        "twitter://home/preview",
        1,
        "$",
      ) as string[];

      const expectNewPreivew = path.join(
        testdataDir,
        "want_homeline_new_preivew.text",
      );
      await assertEqualTextFile(newPreview.join("\n"), expectNewPreivew);
    }
  },
});

test({
  mode: "all",
  name: "post tweet",
  fn: async (denops: Denops) => {
    await load(denops, autoloadDir);

    const want = "hello world";
    const resp = await actionTweet(denops, want);
    assertEquals(resp.text, want);
  },
});

test({
  mode: "all",
  name: "post tweet with media",
  fn: async (denops: Denops) => {
    await load(denops, autoloadDir);

    const want = {
      text: "tweet with media",
      media_id: "3a117ca7799fffa26f62d9a13a9144a1",
    };
    const mediaFile = path.join(testdataDir, "test.png");
    vars.b.set(denops, "twitter_media", mediaFile);
    const resp = await actionTweet(denops, want.text);
    const actual = {
      text: resp.text,
      media_id: resp.entities.media[0].id_str,
    };
    assertEquals(actual, want);
  },
});

test({
  mode: "all",
  ignore: Deno.env.get("TEST_LOCAL") !== "true",
  name: "post tweet with media from clipboard",
  fn: async (denops: Denops) => {
    await load(denops, autoloadDir);

    const want = {
      text: "tweet with media",
      media_id: "3a117ca7799fffa26f62d9a13a9144a1",
    };
    const mediaFile = path.join(testdataDir, "test.png");
    const file = await Deno.open(mediaFile);
    await clipboard.write(file);
    file.close();
    vars.b.set(denops, "twitter_media_clipboard", true);
    const resp = await actionTweet(denops, want.text);
    const actual = {
      text: resp.text,
      media_id: resp.entities.media[0].id_str,
    };
    assertEquals(actual, want);
  },
});

test({
  mode: "all",
  name: "yank url",
  fn: async (denops: Denops) => {
    await load(denops, autoloadDir);
    await actionOpenTimeline(denops, "home");
    await denops.call("twitter#do_action", "yank");
    const url = await denops.call("getreg", await denops.eval("v:register"));
    assertEquals(
      url,
      "https://twitter.com/track3jyo/status/1533592806630912000",
    );
  },
});

test({
  mode: "all",
  name: "like and retweet the tweet",
  fn: async (denops: Denops) => {
    await main(denops);
    await load(denops, autoloadDir);
    await actionOpenTimeline(denops, "home");
    await denops.call("twitter#do_action", "like");
    await denops.call("twitter#do_action", "retweet");
    const actual = await denops.call(
      "getbufline",
      "twitter://home/preview",
      1,
      "$",
    ) as string[];
    const file = path.join(testdataDir, "want_like_and_retweet.text");
    await assertEqualTextFile(actual.join("\n"), file);
  },
});

const testReply = async (
  denops: Denops,
  useClipboard: boolean,
  expect: Record<string, string>,
): Promise<void> => {
  await main(denops);
  await load(denops, autoloadDir);
  await actionOpenTimeline(denops, "home");
  await denops.call(
    "twitter#do_action",
    useClipboard ? "reply:media:clipboard" : "reply",
  );
  await denops.call("setline", 2, ["this is test"]);
  const tweet = await vars.b.get(
    denops,
    "twitter_reply_tweet",
    {},
  ) as Timeline;
  assertNotEquals(Object.keys(tweet).length, 0);
  const lines = await denops.call("getline", 1, "$") as string[];
  const text = lines.join("\n");
  expect.text = text;
  const resp = await actionReply(denops, tweet, text);
  const actual = {
    text: resp.text,
    id: resp.in_reply_to_status_id_str,
  } as Record<string, string>;
  if (useClipboard) {
    actual["media_id"] = resp.entities.media[0].id_str;
  }
  assertEquals(actual, expect);
};

test({
  mode: "all",
  name: "test reply",
  fn: async (denops: Denops) => {
    const expect = {
      id: "1533592806630912000",
    };
    await testReply(denops, false, expect);
  },
});

test({
  ignore: Deno.env.get("TEST_LOCAL") !== "true",
  mode: "all",
  name: "test reply with media from clipboard",
  fn: async (denops: Denops) => {
    const expect = {
      id: "1533592806630912000",
      media_id: "3a117ca7799fffa26f62d9a13a9144a1",
    };

    const mediaFile = path.join(testdataDir, "test.png");
    const file = await Deno.open(mediaFile);
    await clipboard.write(file);
    file.close();

    await testReply(denops, true, expect);
  },
});

const testRetweetComment = async (
  denops: Denops,
  useClipboard: boolean,
  expect: Record<string, string>,
): Promise<void> => {
  await main(denops);
  await load(denops, autoloadDir);
  await actionOpenTimeline(denops, "home");
  await denops.call(
    "twitter#do_action",
    useClipboard ? "retweet:comment:media:clipboard" : "retweet:comment",
  );
  await denops.call("setline", 2, ["this is retweet test"]);
  const lines = await denops.call("getline", 1, "$") as string[];
  const text = lines.join("\n");
  expect.text = text;
  const resp = await actionRetweetWithComment(denops, text);
  const actual = {
    text: resp.text,
  } as Record<string, string>;
  if (useClipboard) {
    actual["media_id"] = resp.entities.media[0].id_str;
  }
  assertEquals(actual, expect);
};

test({
  mode: "all",
  name: "test retweet with comment",
  fn: async (denops: Denops): Promise<void> => {
    await testRetweetComment(denops, false, {});
  },
});

test({
  ignore: Deno.env.get("TEST_LOCAL") !== "true",
  mode: "all",
  name: "test retweet with comment and media",
  fn: async (denops: Denops): Promise<void> => {
    const expect = {
      media_id: "3a117ca7799fffa26f62d9a13a9144a1",
    };
    const mediaFile = path.join(testdataDir, "test.png");
    const file = await Deno.open(mediaFile);
    await clipboard.write(file);
    file.close();
    await testRetweetComment(denops, true, expect);
  },
});
