import { assertEquals, Denops, helper, path, test } from "./deps.ts";
import { actionOpenTimeline } from "./action.ts";
import { mockServer } from "./mock/server.ts";
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

const host = "localhost";
const port = 12345;

test({
  mode: "all",
  name: "open home timeline",
  fn: async (denops: Denops) => {
    await load(denops, autoloadDir);

    let gotReq: Request;
    const server = mockServer(host, port, async (req: Request) => {
      gotReq = req;
      const respBody = await Deno.readTextFile(
        path.join("denops", "twitter", "testdata", "homeTimeline.json"),
      );
      return new Response(respBody, {
        headers: { "Content-Type": "application/json" },
      });
    });
    await actionOpenTimeline(denops, "home");
    server.close();

    assertEquals({ method: gotReq!.method, url: gotReq!.url }, {
      method: "GET",
      url: "http://localhost:12345/statuses/home_timeline.json?count=30",
    });

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
  },
});
