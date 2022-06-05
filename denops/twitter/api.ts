import * as oauth from "https://raw.githubusercontent.com/snsinfu/deno-oauth-1.0a/main/extra/mod.ts";

export type TwitterAPI = {
  client: oauth.Api;
  // access token and secret
  token: {
    key: string;
    secret: string;
  };
};

export const newTwitterAPI = (
  prefix: string,
  consumer: {
    key: string;
    secret: string;
  },
  token: {
    key: string;
    secret: string;
  },
): TwitterAPI => {
  const client = new oauth.Api({
    prefix: prefix,
    consumer: { key: consumer.key, secret: consumer.secret },
    signature: oauth.HMAC_SHA1,
  });

  const api: TwitterAPI = {
    client: client,
    token: token,
  };
  return api;
};
