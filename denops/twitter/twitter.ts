import { newTwitterAPI, TwitterAPI } from "./api.ts";
import { Media, Timeline, Update } from "./type.d.ts";
import { readConfig } from "./config.ts";
import { RequestOptions } from "https://raw.githubusercontent.com/snsinfu/deno-oauth-1.0a/main/extra/mod.ts";
import { base64 } from "./deps.ts";

export let twitterAPI: TwitterAPI;
export let uploadAPI: TwitterAPI;

export const loadConfig = async (): Promise<void> => {
  const config = await readConfig();
  const prefix = Deno.env.get("TEST_ENDPOINT") ?? "https://api.twitter.com/1.1";
  const consumer = {
    key: config.consumerAPIKey,
    secret: config.consumerAPISecret,
  };
  const token = { key: config.accessToken, secret: config.accessTokenSecret };
  twitterAPI = newTwitterAPI(
    prefix,
    consumer,
    token,
  );
  uploadAPI = newTwitterAPI(
    "https://upload.twitter.com/1.1",
    consumer,
    token,
  );
};

try {
  await loadConfig();
} catch (_) {
  console.log("please edit config using :TwitterEditConfig");
}

const apiCall = async <T>(
  method: "GET" | "POST",
  url: string,
  opts: RequestOptions,
): Promise<T> => {
  opts.token = twitterAPI.token;
  const resp = await twitterAPI.client.request(method, url, opts);
  if (!resp.ok) {
    throw new Error(`status: ${resp.statusText}, body: ${await resp.text()}`);
  }
  return await resp.json() as T;
};

export type HomeTimelineOptions = {
  count?: string;
};

export const homeTimeline = async (
  opts: HomeTimelineOptions,
): Promise<Timeline[]> => {
  const resp = await apiCall<Timeline[]>(
    "GET",
    "/statuses/home_timeline.json",
    { query: opts },
  );
  return resp;
};

export type StatusesUpdateOptions = {
  status: string;
  in_reply_to_status_id?: string;
  media_ids?: string;
};

export const statusesUpdate = async (
  opts: StatusesUpdateOptions,
): Promise<Update> => {
  const resp = await apiCall<Update>(
    "POST",
    "/statuses/update.json",
    {
      query: opts,
    },
  );
  return resp;
};

export type UserTimelineOptions = {
  screen_name?: string;
  count?: string;
};

export const userTimeline = async (
  opts: UserTimelineOptions,
): Promise<Timeline[]> => {
  const resp = await apiCall<Timeline[]>(
    "GET",
    "/statuses/user_timeline.json",
    {
      query: opts,
    },
  );
  return resp;
};

export const likeTweet = async (id: string): Promise<void> => {
  await apiCall("POST", "/favorites/create.json", {
    query: {
      id: id,
    },
  });
};

export const retweet = async (id: string): Promise<void> => {
  await apiCall("POST", `/statuses/retweet/${id}.json`, {});
};

export type MentionsOptions = {
  count?: string;
};

export const mentionsTimeline = async (
  opts: MentionsOptions,
): Promise<Timeline[]> => {
  const resp = await apiCall<Timeline[]>(
    "GET",
    "/statuses/mentions_timeline.json",
    {
      query: opts,
    },
  );
  return resp;
};

export const uploadMedia = async (
  data: Uint8Array,
): Promise<Media> => {
  const b64 = base64.encode(data);
  const resp = await uploadAPI.client.request("POST", "/media/upload.json", {
    token: uploadAPI.token,
    form: {
      "media_data": b64,
    },
  });

  if (!resp.ok) {
    throw new Error(`status: ${resp.statusText}, body: ${await resp.text()}`);
  }
  const media = await resp.json();
  return media;
};
