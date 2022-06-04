import { TwitterApi } from "https://raw.githubusercontent.com/stefanuros/deno_twitter_api/v1.2.1/mod.ts";
import StatusesHomeTimeline from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesHomeTimelineTypes.d.ts";
import StatusesUpdate from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesUpdateTypes.d.ts";
import StatusesUserTimeline from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesUserTimelineTypes.d.ts";
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
): Promise<StatusesHomeTimeline[]> => {
  const resp = await apiCall<StatusesHomeTimeline[]>(
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
): Promise<StatusesUpdate> => {
  const resp = await apiCall<StatusesUpdate>(
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
): Promise<StatusesUserTimeline[]> => {
  const resp = await apiCall<StatusesUserTimeline[]>(
    "GET",
    "statuses/user_timeline.json",
    opts,
  );
  return resp;
};
