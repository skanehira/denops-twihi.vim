import { fs, path, zod } from "./deps.ts";
import xdg from "https://deno.land/x/xdg@v9.4.0/src/mod.deno.ts";

export const configFile = path.join(
  xdg.config(),
  "denops_twitter",
  "config.json",
);

export const Config = zod.object({
  consumerAPIKey: zod.string(),
  consumerAPISecret: zod.string(),
  accessToken: zod.string(),
  accessTokenSecret: zod.string(),
});

export async function readConfig(): Promise<zod.infer<typeof Config>> {
  await fs.ensureFile(configFile);
  const body = await Deno.readTextFile(configFile);
  if (!body) {
    throw new Error(`${configFile} is empty`);
  }
  const config = Config.parse(JSON.parse(body));
  return config;
}
