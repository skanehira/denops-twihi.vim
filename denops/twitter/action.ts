import {
  homeTimeline,
  likeTweet,
  mentionsTimeline,
  retweet,
  statusesUpdate,
  StatusesUpdateOptions,
  uploadMedia,
  userTimeline,
} from "./twitter.ts";
import {
  autocmd,
  clipboard,
  datetime,
  Denops,
  open,
  streams,
  stringWidth,
  vars,
} from "./deps.ts";
import { Media, Timeline } from "./type.d.ts";

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
  await vars.b.set(denops, "twitter_cursor", { line: -1 });
  await vars.t.set(
    denops,
    "twitter_preview_bufname",
    `twitter://${timelineType}/preview`,
  );

  await denops.call("setline", 1, rows);
  await denops.cmd("setlocal nomodifiable");
  await denops.call("twitter#preview", true);

  autocmd.group(denops, `twitter_timeline_${timelineType}`, (helper) => {
    helper.remove("*");
    helper.define("CursorMoved", "<buffer>", "call twitter#preview(v:false)");
    helper.define("BufDelete", "<buffer>", "call twitter#close_preview()");
  });
};

export async function actionOpen(tweet: Timeline) {
  const url =
    `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
  console.log("opening...", url);
  await open(url);
}

export const actionUploadMedia = async (
  denops: Denops,
): Promise<Media | undefined> => {
  let data: Uint8Array;

  const file = await vars.b.get(denops, "twitter_media", "");
  if (file) {
    data = await Deno.readFile(file);
  } else if (await vars.b.get(denops, "twitter_media_clipboard")) {
    data = await streams.readAll(await clipboard.read());
  } else {
    // do nothing
    return;
  }

  console.log("uploading...");
  const media = await uploadMedia(data);
  return media;
};

export const actionTweet = async (
  denops: Denops,
  text: string,
): Promise<void> => {
  const width = stringWidth(text);
  if (width > 280) {
    throw new Error("characters must be less than 280");
  }
  const opts: StatusesUpdateOptions = {
    status: text,
  };
  const media = await actionUploadMedia(denops);
  if (media) {
    opts.media_ids = media.media_id_string;
  }
  console.log("tweeting...");
  await statusesUpdate(opts);
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
  await denops.call("twitter#preview", true);
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
  const opts: StatusesUpdateOptions = {
    status: text,
    in_reply_to_status_id: tweet.id_str,
  };
  const media = await actionUploadMedia(denops);
  if (media) {
    opts.media_ids = media.media_id_string;
  }
  console.log("tweeting...");
  await statusesUpdate(opts);
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
  await denops.call("twitter#preview", true);
  await denops.cmd("echo ''");
};

export const actionRetweetWithComment = async (
  denops: Denops,
  tweet: Timeline,
  text: string,
): Promise<void> => {
  const url =
    `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
  text = text + "\n" + url;
  await actionTweet(denops, text);
};
