import StatusesHomeTimeline from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesHomeTimelineTypes.d.ts";
import StatusesUpdate from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesUpdateTypes.d.ts";
import StatusesUserTimeline from "https://esm.sh/v78/twitter-api-client@1.5.2/dist/interfaces/types/StatusesUserTimelineTypes.d.ts";

export type Timeline = StatusesUserTimeline | StatusesHomeTimeline;
export type Update = StatusesUpdate;
