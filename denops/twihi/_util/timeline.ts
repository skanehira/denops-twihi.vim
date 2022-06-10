import { Timeline } from "../type.d.ts";

export const expandQuotedStatus = (
  timelines: Timeline[],
): Timeline[] => {
  const newTimelines: Timeline[] = [];
  for (const t of timelines) {
    newTimelines.push(t);
    if (t.quoted_status) {
      newTimelines.push(t.quoted_status as Timeline);
    }
  }
  return newTimelines;
};
