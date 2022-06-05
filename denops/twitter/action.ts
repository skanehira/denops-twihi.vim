import {
  homeTimeline,
  likeTweet,
  mentionsTimeline,
  retweet,
  statusesUpdate,
  userTimeline,
} from "./twitter.ts";
import { datetime, Denops, open, stringWidth, vars } from "./deps.ts";
import { Timeline } from "./type.d.ts";

type TimelineType = "home" | "user" | "mentions";

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
  timelineType: TimelineType,
  screenName?: string,
): Promise<Timeline[]> => {
  let timelines: Timeline[];

  switch (timelineType) {
    case "user":
      timelines = await userTimeline({
        count: "30",
        screen_name: screenName,
      });
      break;
    case "home":
      timelines = await homeTimeline({ count: "30" });
      break;
    case "mentions":
      timelines = await mentionsTimeline({ count: "30" });
      break;
  }

  if (!timelines.length) {
    throw new Error("not found timeline");
  }
  return timelines;
};

export const actionOpenTimeline = async (
  denops: Denops,
  timelineType: TimelineType,
  screenName?: string,
): Promise<void> => {
  await vars.b.set(denops, "twitter_timeline_type", timelineType);

  await denops.cmd(
    "setlocal buftype=nofile nomodified modifiable ft=twitter-timeline nowrap",
  );

  const timelines = await getTimeline(timelineType, screenName);
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

  await denops.cmd("doautocmd User twitter_preview");
};

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

export const actionLike = async (denops: Denops, id: string): Promise<void> => {
  await likeTweet(id);
  const num = await denops.call("line", ".") as number;
  const timelines = await vars.b.get(
    denops,
    "twitter_timelines",
    [],
  ) as Timeline[];
  const timeline = timelines[num - 1];
  timeline.favorited = true;
  await vars.b.set(denops, "twitter_timelines", timelines);
  await vars.b.set(denops, "twitter_force_preview", true);
  await denops.cmd(`doautocmd User twitter_force_preview`);
};

export const actionReply = async (
  denops: Denops,
  tweet: Timeline,
  text: string,
): Promise<void> => {
  const width = stringWidth(text);
  if (width > 280) {
    throw new Error("characters must be less than 280");
  }
  console.log("sending…");
  await statusesUpdate({
    status: text,
    in_reply_to_status_id: tweet.id_str,
  });
  await denops.cmd("echo '' | bw!");
};

export const actionRetweet = async (
  denops: Denops,
  id: string,
): Promise<void> => {
  console.log("retweeting...");
  await retweet(id);
  const num = await denops.call("line", ".") as number;
  const timelines = await vars.b.get(
    denops,
    "twitter_timelines",
    [],
  ) as Timeline[];
  const timeline = timelines[num - 1];
  timeline.retweeted = true;
  await vars.b.set(denops, "twitter_timelines", timelines);
  await vars.b.set(denops, "twitter_force_preview", true);
  await denops.cmd("doautocmd User twitter_force_preview");
  await denops.cmd("echo ''");
};
