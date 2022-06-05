import { TwitterApi } from "https://raw.githubusercontent.com/stefanuros/deno_twitter_api/v1.2.1/mod.ts";
import { Timeline, Update } from "./type.d.ts";
//import { TwitterClient } from "https://esm.sh/twitter-api-client@1.5.2";
import { readConfig } from "./config.ts";

export let twitterAPI: TwitterApi;

export const loadConfig = async (): Promise<void> => {
  const config = await readConfig();
  twitterAPI = new TwitterApi({
    consumerApiKey: config.consumerAPIKey,
    consumerApiSecret: config.consumerAPISecret,
    accessToken: config.accessToken,
    accessTokenSecret: config.accessTokenSecret,
  });
};

try {
  await loadConfig();
} catch (_) {
  console.log("please edit config using :TwitterEditConfig");
}

const apiCall = async <T>(
  method: "GET" | "POST",
  endpoint: string,
  opts: Record<string, string>,
): Promise<T> => {
  const resp = method === "POST"
    ? await twitterAPI.post(endpoint, opts)
    : await twitterAPI.get(endpoint, opts);
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
    "statuses/home_timeline.json",
    opts,
  );
  return resp;
};

export type StatusesUpdateOptions = {
  status?: string;
  in_reply_to_status_id?: string;
};

export const statusesUpdate = async (
  opts: StatusesUpdateOptions,
): Promise<Update> => {
  const resp = await apiCall<Update>(
    "POST",
    "statuses/update.json",
    opts,
  );
  return resp;
};

export type UserTimelineOptions = {
  user_id?: string;
  screen_name?: string;
  count?: string;
};

export const userTimeline = async (
  opts: UserTimelineOptions,
): Promise<Timeline[]> => {
  const resp = await apiCall<Timeline[]>(
    "GET",
    "statuses/user_timeline.json",
    opts,
  );
  return resp;
};
