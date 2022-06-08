// deno-lint-ignore-file
import StatusesHomeTimeline from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesHomeTimelineTypes.d.ts";
import StatusesUpdate from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesUpdateTypes.d.ts";
import {
  Entities as TimelineEntities,
} from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesUpdateTypes.d.ts";
import StatusesUserTimeline from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesUserTimelineTypes.d.ts";
import MediaUpload from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/MediaUploadTypes.d.ts";

export type Timeline = StatusesUserTimeline | StatusesHomeTimeline;

export type Size = {
  w: number;
  h: number;
  resize: string;
};

export type MediaTypes = {
  id: number;
  url: string;
  media_url_https: string;
  id_str: string;
  media_url: string;
  indices: number[];
  display_url: string;
  type: string;
  expanded_url: string;
  sizes: {
    medium: Size;
    large: Size;
    thumb: Size;
    small: Size;
  };
};

export interface Entities extends TimelineEntities {
  media: MediaTypes[];
}
export interface Update extends Omit<StatusesUpdate, "entities"> {
  entities: Entities;
}
export type Media = MediaUpload;

export type SearchResult = { statuses: Timeline[] };
