import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { createHash } from "https://deno.land/std@0.142.0/hash/mod.ts";
import { timeline } from "../testdata/timeline.ts";
import { timelines } from "../testdata/timelines.ts";
import { media } from "../testdata/media.ts";

const app = new Application();

const router = new Router();

router
  .post("/statuses/retweet/:id", (context) => {
    context.response.body = timeline;
  })
  .post("/favorites/create.json", (context) => {
    context.response.body = timeline;
  })
  .post("/media/upload.json", async (context) => {
    const form = await context.request.body({ type: "form" }).value;
    const hash = createHash("md5");
    hash.update(form.get("media_data")!);
    media.media_id_string = hash.toString();
    context.response.body = media;
  })
  .post("/statuses/update.json", (context) => {
    const params = context.request.url.searchParams;
    const status = params.get("status");
    if (status) {
      timeline.text = status!;
    }
    const media_ids = params.get("media_ids");
    if (media_ids) {
      timeline.entities.media[0].id_str = media_ids;
    }
    const replyID = params.get("in_reply_to_status_id");
    if (replyID) {
      timeline.in_reply_to_status_id_str = replyID;
    }
    context.response.body = timeline;
  })
  .get("/statuses/user_timeline.json", (context) => {
    context.response.body = timelines;
  })
  .get("/statuses/home_timeline.json", (context) => {
    context.response.body = timelines;
  })
  .get("/statuses/mentions_timeline.json", (context) => {
    context.response.body = timelines;
  });

app.use(router.routes());
await app.listen({ port: 8080 });
