import { homeTimeline, statusesUpdate, userTimeline } from "./twitter.ts";
import { autocmd, datetime, Denops, open, stringWidth, vars } from "./deps.ts";
import { map } from "./mapping.ts";
import { Timeline } from "./type.d.ts";

const icon = {
  white_heart: "\u2661",
  black_heart: "\u2665",
  comment: "\uf41f",
  retweet: "\u267A",
  retweeted: "\u267B",
};

export function tweets2lines(
  objs: Record<string, string>[],
): [number, string[]] {
  const rows = objs.map((obj) => {
    return Object.values(obj);
  });

  // rotate for get each col's length
  // https://qiita.com/kznrluk/items/790f1b154d1b6d4de398
  const len = rows[0].map((_, c) => rows.map((r) => r[c])).map(
    (cols) => {
      return Math.max(...cols.map((col) => stringWidth(col)));
    },
  );

  // padding each col
  const lines = rows.map((row) =>
    row.map((col, i) => {
      col += " ".repeat(len[i] - stringWidth(col));
      return col;
    }).join(" ")
  );
  return [Math.max(...len) * 2.7, lines];
}

export const getTimeline = async (
  screenName?: string,
): Promise<Timeline[]> => {
  let timelines: Timeline[];
  if (screenName) {
    timelines = await userTimeline({
      count: "30",
      screen_name: screenName,
    });
  } else {
    timelines = await homeTimeline({ count: "30" });
  }

  if (!timelines.length) {
    throw new Error("not found timeline");
  }
  return timelines;
};

export const actionOpenTimeline = async (
  denops: Denops,
  screenName?: string,
): Promise<void> => {
  await denops.cmd(
    "setlocal buftype=nofile nomodified modifiable ft=twitter-timeline nowrap",
  );
  const timelines = await getTimeline(screenName);
  await vars.b.set(denops, "twitter_timelines", timelines);

  const tweets = timelines.map((timeline) => {
    const name = timeline.user.name;
    return {
      name: `[${stringWidth(name) > 10 ? name.slice(0, 10) + "…" : name}]`,
      screen_name: `@${timeline.user.screen_name}`,
      created_at: datetime.format(
        new Date(timeline.created_at),
        "yyyy/MM/dd HH:mm:ss",
      ),
    };
  });

  const [winWidth, rows] = tweets2lines(tweets);
  await vars.b.set(denops, "twitter_preview_window_width", winWidth.toString());

  await denops.call("setline", 1, rows);
  await denops.cmd("setlocal nomodifiable");

  const num = await denops.call("line", ".") as number;
  const tweet = timelines[num - 1];
  await actionPreview(denops, tweet);

  const bufnr = await denops.call("bufnr");
  await autocmd.group(denops, `twitter_preview_${bufnr}`, (helper) => {
    helper.remove("*", "<buffer>");
    helper.define(
      "CursorMoved",
      "<buffer>",
      `call denops#request("twitter", "preview", [b:twitter_timelines[line(".")-1]])`,
    );
    helper.define(
      "CursorMoved",
      "<buffer>",
      `call execute("vertical resize ${winWidth}")`,
    );
  });

  const keyMaps = [
    {
      defaultKey: "<C-o>",
      lhs: "<Plug>(twitter:tweet:open)",
      rhs:
        `:<C-u>call denops#notify("twitter", "open", [b:twitter_timelines[line(".")-1]])<CR>`,
    },
    {
      defaultKey: "<C-n>",
      lhs: "<Plug>(twitter:tweet:new)",
      rhs: `:<C-u>new twitter://tweet<CR>`,
    },
  ];

  for (const m of keyMaps) {
    await map(
      denops,
      m.defaultKey,
      m.lhs,
      m.rhs,
      {
        buffer: true,
        silent: true,
        mode: "n",
        noremap: true,
      },
    );
  }
};

export async function actionPreview(
  denops: Denops,
  tweet: Timeline,
) {
  const bufname = "twitter://preview";
  const bufnr = await denops.call("bufadd", bufname);

  const rows = tweet.text.split("\n");
  const count = Math.max(...rows.map((row) => stringWidth(row)));
  const border = "─".repeat(count);

  const icons = [tweet.retweeted ? icon.retweeted : icon.retweet];
  icons.push(tweet.retweet_count ? tweet.retweet_count.toString() : " ");
  icons.push(tweet.favorited ? icon.black_heart : icon.white_heart);
  if (tweet.favorite_count) icons.push(tweet.favorite_count.toString());

  const tweetBody = [
    tweet.user.name,
    `@${tweet.user.screen_name}`,
    border,
    "",
    ...tweet.text.split("\n"),
    "",
    border,
    icons.join(" "),
  ];

  await denops.batch(
    ["bufload", bufnr],
    ["twitter#deletebufline", bufnr, 1, "$"],
    [
      "setbufline",
      bufnr,
      1,
      tweetBody,
    ],
  );

  if (await denops.call("bufwinid", bufnr) === -1) {
    const oldwin = await denops.call("win_getid");
    await denops.cmd(
      `botright vnew ${bufname} | setlocal buftype=nofile ft=twitter-preview | nnoremap <buffer> <silent> q :bw!<CR>`,
    );
    await denops.call("win_gotoid", oldwin);
    const winWidth = await vars.b.get(
      denops,
      "twitter_preview_window_width",
      "",
    );
    await denops.cmd(`vertical resize ${winWidth}`);
  }

  await denops.cmd("redraw!");
}

export async function actionOpen(tweet: Timeline) {
  const url =
    `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
  console.log("opening...", url);
  await open(url);
}

export const actionTweet = async (
  denops: Denops,
  line: string,
): Promise<void> => {
  const width = stringWidth(line);
  if (width > 280) {
    throw new Error("characters must be less than 280");
  }
  console.log("sending…");
  await statusesUpdate({
    status: line,
  });
  await denops.cmd("echo '' | bw!");
};
