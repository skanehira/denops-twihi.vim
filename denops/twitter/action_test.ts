import {
  assertEquals,
  clipboard,
  Denops,
  helper,
  path,
  test,
  vars,
} from "./deps.ts";
import { actionOpenTimeline, actionTweet } from "./action.ts";
import { assertEqualTextFile } from "./_util/assert.ts";

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
