import {
  homeTimeline,
  likeTweet,
  mentionsTimeline,
  retweet,
  searchTweets,
  statusesUpdate,
  StatusesUpdateOptions,
  uploadMedia,
  userTimeline,
} from "./twihi.ts";
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
import { Media, Timeline, Update } from "./type.d.ts";
import { expandQuotedStatus } from "./_util/timeline.ts";

type TimelineType = "home" | "user" | "mentions" | "search";

const dateTimeFormat = "yyyy/MM/dd HH:mm:ss";

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
  return [Math.max(...lines.map((line) => stringWidth(line))), lines];
}

export type GetTimelineOpts = {
  screenName?: string;
  query?: string;
};

export const getTimeline = async (
  timelineType: TimelineType,
  opts?: GetTimelineOpts,
): Promise<Timeline[]> => {
  let timelines: Timeline[];

  switch (timelineType) {
    case "user":
      timelines = await userTimeline({
        count: "100",
        screen_name: opts!.screenName,
      });
      break;
    case "home":
      timelines = await homeTimeline({ count: "100" });
      break;
    case "mentions":
      timelines = await mentionsTimeline({ count: "100" });
      break;
    case "search":
      {
        const { statuses } = await searchTweets(opts!.query!);
        timelines = statuses;
      }
      break;
  }

  if (!timelines.length) {
    throw new Error("not found timeline");
  }

  // if tweet has quoted_status, then make flat array
  const expandedTimelines = expandQuotedStatus(timelines);

  for (const t of expandedTimelines) {
    t.created_at_str = datetime.format(
      new Date(t.created_at),
      dateTimeFormat,
    );
    if (t.retweeted_status) {
      t.retweeted_status.created_at_str = datetime.format(
        new Date(t.created_at),
        dateTimeFormat,
      );
    }
  }

  return expandedTimelines;
};

export const actionOpenTimeline = async (
  denops: Denops,
  timelineType: TimelineType,
  opts?: GetTimelineOpts,
): Promise<void> => {
  await vars.b.set(denops, "twihi_timeline_type", timelineType);

  await denops.cmd(
    "setlocal buftype=nofile nomodified modifiable nonumber ft=twihi-timeline nowrap",
  );

  const timelines = await getTimeline(timelineType, opts);
  await vars.b.set(denops, "twihi_timelines", timelines);

  const tweets = timelines.map((timeline, i, timelines) => {
    const isQuoted = (i > 0) &&
      timelines[i - 1].quoted_status_id_str === timeline.id_str;
    const name = [...timeline.user.name];
    const nameText = `[${
      name.length > 10 ? name.slice(0, 8).join("") + "…" : name.join("")
    }]`;
    return {
      name: isQuoted ? " └ " + nameText : nameText,
      screen_name: `@${timeline.user.screen_name}`,
      created_at_str: timeline.created_at_str,
    };
  });

  const [winWidth, rows] = tweets2lines(tweets);
  await vars.b.set(denops, "twihi_preview_window_width", winWidth.toString());
  await vars.b.set(denops, "twihi_cursor", { line: -1 });
  await vars.t.set(
    denops,
    "twihi_preview_bufname",
    `twihi://${timelineType}/preview`,
  );

  await denops.batch(
    [
      "twihi#internal#helper#_silent_call",
      "deletebufline",
      await denops.call("bufnr"),
      1,
      "$",
    ],
    ["setline", 1, rows],
  );
  await denops.cmd("setlocal nomodifiable");
  await denops.call("twihi#preview", true);

  await autocmd.group(denops, `twihi_timeline_${timelineType}`, (helper) => {
    helper.remove("*");
    helper.define("CursorMoved", "<buffer>", "call twihi#preview(v:false)");
    helper.define("BufDelete", "<buffer>", "call twihi#close_preview()");
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

  const file = await vars.b.get(denops, "twihi_media", "");
  if (file) {
    data = await Deno.readFile(file);
  } else if (await vars.b.get(denops, "twihi_media_clipboard")) {
    data = await streams.readAll(await clipboard.read());
  } else {
    // do nothing
    return;
  }

  console.log("media uploading...");
  const media = await uploadMedia(data);
  return media;
};

export const actionTweet = async (
  denops: Denops,
  text: string,
): Promise<Update> => {
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
  const resp = await statusesUpdate(opts);
  await denops.cmd("echo '' | bw!");
  return resp;
};

export const actionLike = async (denops: Denops, id: string): Promise<void> => {
  await likeTweet(id);
  const num = await denops.call("line", ".") as number;
  const timelines = await vars.b.get(
    denops,
    "twihi_timelines",
    [],
  ) as Timeline[];
  const timeline = timelines[num - 1];
  if (timeline.retweeted_status) {
    timeline.retweeted_status.favorited = true;
  } else {
    timeline.favorited = true;
  }
  await vars.b.set(denops, "twihi_timelines", timelines);
  await denops.call("twihi#preview", true);
};

export const actionReply = async (
  denops: Denops,
  tweet: Timeline,
  text: string,
): Promise<Update> => {
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
  const resp = await statusesUpdate(opts);
  await denops.cmd("echo '' | bw!");
  return resp;
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
    "twihi_timelines",
    [],
  ) as Timeline[];
  const timeline = timelines[num - 1];
  if (timeline.retweeted_status) {
    timeline.retweeted_status.retweeted = true;
  } else {
    timeline.retweeted = true;
  }
  await vars.b.set(denops, "twihi_timelines", timelines);
  await denops.call("twihi#preview", true);
  await denops.cmd("echo ''");
};

export const actionRetweetWithComment = async (
  denops: Denops,
  text: string,
): Promise<Update> => {
  return await actionTweet(denops, text);
};
