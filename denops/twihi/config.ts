import { path, xdg, zod } from "./deps.ts";
import { ensureFile } from "./_util/ensure.ts";

export const configFile = path.join(
  xdg.config(),
  "denops_twihi",
  "config.json",
);

await ensureFile(configFile);

export const Config = zod.object({
  consumerAPIKey: zod.string(),
  consumerAPISecret: zod.string(),
  accessToken: zod.string(),
  accessTokenSecret: zod.string(),
});

export const readConfig = async (): Promise<zod.infer<typeof Config>> => {
  const body = await Deno.readTextFile(configFile);
  if (!body) {
    throw new Error(`${configFile} is empty`);
  }
  const config = Config.parse(JSON.parse(body));
  return config;
};
