import {
  assertEquals,
  assertNotEquals,
  clipboard,
  Denops,
  path,
  test,
  vars,
} from "./deps.ts";
import {
  actionAddMediaFromClipboard,
  actionOpenTimeline,
  actionReply,
  actionRetweetWithComment,
  actionTweet,
} from "./action.ts";
import { assertEqualTextFile } from "./_util/assert.ts";
import { main } from "./main.ts";
import { Timeline } from "./type.d.ts";
import { loadConfig } from "./twihi.ts";

const pluginRoot = path.dirname(
  path.dirname(path.dirname(path.fromFileUrl(import.meta.url))),
);

const testdataDir = path.join(
  "denops",
  "twihi",
  "testdata",
);

test({
  mode: "all",
  name: "open home timeline",
  fn: async (denops: Denops) => {
    await denops.cmd(`set rtp^=${pluginRoot}`);
    await loadConfig();

    await actionOpenTimeline(denops, "home");

    const actual = await denops.call("getline", 1, "$") as string[];
    const expectFile = path.join(
      testdataDir,
      "want_homeline.text",
    );
    await assertEqualTextFile(actual.join("\n"), expectFile);
  },
});

test({
  mode: "all",
  name: "post tweet",
  fn: async (denops: Denops) => {
    await denops.cmd(`set rtp^=${pluginRoot}`);
    await loadConfig();

    const want = "hello world";
    const resp = await actionTweet(denops, want);
    assertEquals(resp.text, want);
  },
});

test({
  mode: "all",
  name: "post tweet with media",
  fn: async (denops: Denops) => {
    await denops.cmd(`set rtp^=${pluginRoot}`);
    await loadConfig();

    const want = {
      text: "tweet with media",
      media_id: "3a117ca7799fffa26f62d9a13a9144a1",
    };
    const mediaFile = path.join(testdataDir, "test.png");
    vars.b.set(denops, "twihi_medias", [mediaFile]);
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
    await denops.cmd(`set rtp^=${pluginRoot}`);
    await loadConfig();

    const want = {
      text: "tweet with media",
      media_id: "3a117ca7799fffa26f62d9a13a9144a1",
    };
    const mediaFile = path.join(testdataDir, "test.png");
    const file = await Deno.open(mediaFile);
    await clipboard.write(file);
    file.close();
    vars.b.set(denops, "twihi_medias", [await actionAddMediaFromClipboard()]);
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
    await denops.cmd(`set rtp^=${pluginRoot}`);
    await loadConfig();

    await actionOpenTimeline(denops, "home");
    await denops.call("twihi#do_action", "yank");
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
    await denops.cmd(`set rtp^=${pluginRoot}`);
    await actionOpenTimeline(denops, "home");
    await denops.call("twihi#do_action", "like");
    await denops.call("twihi#do_action", "retweet");
    const tweet = await denops.call("twihi#get_tweet") as {
      position: { start: number; end: number };
    };
    const start = tweet.position.start as number;
    const end = tweet.position.end as number;
    const actual = await denops.call(
      "getline",
      start,
      end,
    ) as string[];
    const file = path.join(testdataDir, "want_like_and_retweet.text");
    await assertEqualTextFile(actual.join("\n"), file);
  },
});

const testReply = async (
  denops: Denops,
  hasMedia: boolean,
  expect: Record<string, string>,
): Promise<void> => {
  await main(denops);
  await denops.cmd(`set rtp^=${pluginRoot}`);
  await actionOpenTimeline(denops, "home");
  await denops.call("twihi#do_action", "reply");
  await denops.call("setline", 2, ["this is test"]);
  const tweet = await vars.b.get(
    denops,
    "twihi_reply_tweet",
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
  if (hasMedia) {
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
    await vars.b.set(denops, "twihi_medias", [
      await actionAddMediaFromClipboard(),
    ]);
    await testReply(denops, true, expect);
  },
});

const testRetweetComment = async (
  denops: Denops,
  hasMedia: boolean,
  expect: Record<string, string>,
): Promise<void> => {
  await main(denops);
  await denops.cmd(`set rtp^=${pluginRoot}`);
  await actionOpenTimeline(denops, "home");
  await denops.call("twihi#do_action", "retweet:comment");
  await denops.call("setline", 2, ["this is retweet test"]);
  const lines = await denops.call("getline", 1, "$") as string[];
  const text = lines.join("\n");
  expect.text = text;
  const resp = await actionRetweetWithComment(denops, text);
  const actual = {
    text: resp.text,
  } as Record<string, string>;
  if (hasMedia) {
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
    await vars.b.set(denops, "twihi_medias", [
      await actionAddMediaFromClipboard(),
    ]);
    await testRetweetComment(denops, true, expect);
  },
});

test({
  mode: "all",
  name: "test select next/prev tweet",
  fn: async (denops: Denops): Promise<void> => {
    await main(denops);
    await denops.cmd(`set rtp^=${pluginRoot}`);
    await actionOpenTimeline(denops, "home");
    await denops.call("twihi#tweet_next");
    let tweet = await denops.call("twihi#get_tweet") as Timeline;
    assertEquals(tweet.id_str, "1533592543426117632");
    await denops.call("twihi#tweet_prev");
    tweet = await denops.call("twihi#get_tweet") as Timeline;
    assertEquals(tweet.id_str, "1533592806630912000");
  },
});
