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
  clipboard,
  datetime,
  Denops,
  fs,
  helper,
  isNumber,
  Notification,
  notify,
  open,
  path,
  streams,
  stringWidth,
  vars,
  xdg,
} from "./deps.ts";
import { Media, Timeline, Update } from "./type.d.ts";
import { expandQuotedStatus } from "./_util/timeline.ts";

type TimelineType = "home" | "user" | "mentions" | "search";

const dateTimeFormat = "yyyy/MM/dd HH:mm:ss";

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
    t.created_at_str = datetime.format(new Date(t.created_at), dateTimeFormat);
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
  const timelines = await getTimeline(timelineType, opts);
  await vars.b.set(denops, "twihi_timelines", timelines);
  await denops.cmd(
    "setlocal buftype=nofile nonumber ft=twihi-timeline breakindent",
  );
  await denops.call("twihi#draw_timeline");
};

export async function actionOpen(denops: Denops, tweet: Timeline) {
  const url =
    `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
  await helper.echo(denops, `opening... ${url}`);
  await open(url);
}

export const actionOpenMedia = async (file: string): Promise<void> => {
  await open(file);
};

export const actionAddMediaFromClipboard = async (): Promise<string> => {
  const tmp = await Deno.makeTempFile({
    prefix: "twihi_",
    suffix: ".png",
  });
  const src = await clipboard.read();
  const dest = await Deno.open(tmp, {
    write: true,
  });
  try {
    await streams.copy(src, dest);
  } finally {
    dest.close();
  }
  return tmp;
};

export const actionUploadMedia = async (denops: Denops): Promise<Media[]> => {
  const medias = await vars.b.get(denops, "twihi_medias", []);
  if (!medias.length) {
    return [];
  }

  await helper.echo(denops, "media uploading...");
  const contents = await Promise.all(
    medias.map((fname) => {
      return Deno.readFile(fname);
    }),
  );

  const mediaIDs = await Promise.all(
    contents.map((data) => {
      return uploadMedia(data);
    }),
  );

  return mediaIDs;
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
  const medias = await actionUploadMedia(denops);
  if (medias.length) {
    opts.media_ids = medias.map((media) => media.media_id_string).join(",");
  }
  await helper.echo(denops, "tweeting...");
  const resp = await statusesUpdate(opts);
  await denops.cmd("echo '' | bw!");
  return resp;
};

export const actionLike = async (
  _denops: Denops,
  id: string,
): Promise<void> => {
  await likeTweet(id);
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
  const medias = await actionUploadMedia(denops);
  if (medias.length) {
    opts.media_ids = medias.map((media) => media.media_id_string).join(",");
  }
  await helper.echo(denops, "tweeting...");
  const resp = await statusesUpdate(opts);
  await denops.cmd("echo '' | bw!");
  return resp;
};

export const actionRetweet = async (
  denops: Denops,
  id: string,
): Promise<void> => {
  await helper.echo(denops, "retweeting...");
  await retweet(id);
  await denops.cmd("echo ''");
};

export const actionRetweetWithComment = async (
  denops: Denops,
  text: string,
): Promise<Update> => {
  return await actionTweet(denops, text);
};

const sinceMentionIDFile = path.join(
  xdg.config(),
  "denops_twihi",
  "sinceMentionID",
);

await fs.ensureFile(sinceMentionIDFile);

const getSinceMentionID = async (): Promise<string> => {
  return await Deno.readTextFile(sinceMentionIDFile);
};

const saveSinceMentionID = async (id: string): Promise<void> => {
  await Deno.writeTextFile(sinceMentionIDFile, id);
};

const actionNotifyMention = async (denops: Denops) => {
  const sinceID = await getSinceMentionID();
  if (!sinceID) {
    const timelines = await mentionsTimeline({ count: "1" });
    if (!timelines.length) return;
    await saveSinceMentionID(timelines[0].id_str);
  } else {
    const timelines = await mentionsTimeline({
      since_id: sinceID,
      count: "1",
    });
    if (!timelines.length) return;
    const tweet = timelines[0];
    await saveSinceMentionID(tweet.id_str);

    const ui = await vars.g.get<string>(denops, "twihi_notify_ui", "popup");
    if (ui === "popup") {
      const body = [
        `${tweet.user.name} | @${tweet.user.screen_name}`,
        "",
      ].concat(tweet.text.split("\n"));
      await denops.call("twihi#internal#notify#start", body, {
        time: 10000,
        ft: "twihi-timeline",
      });
    } else if (ui === "system") {
      const title = `${tweet.user.name} | @${tweet.user.screen_name}`;
      const opt: Notification = {
        title: title,
        message: tweet.text,
      };
      switch (Deno.build.os) {
        case "darwin":
          opt.sound = "Submarine";
          break;
        case "linux":
          opt.sound = "device-added";
          break;
      }
      await notify(opt);
    }
  }
};

export const actionWatchingMention = async (denops: Denops) => {
  const key = "twihi_mention_check_interval";
  const interval = await vars.g.get(denops, key, -1);
  if (!isNumber(interval)) {
    await helper.echoerr(denops, `value of ${key} is not number`);
    return;
  }
  if (interval > 0) {
    setInterval(async () => {
      try {
        await actionNotifyMention(denops);
      } catch (_) {
        // do nothing
      }
    }, interval);
  }
};
