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

export const unescapeTweetBody = (text: string): string => {
  text = text.replaceAll(/&lt;/g, "<");
  text = text.replaceAll(/&gt;/g, ">");
  text = text.replaceAll(/&quot;/g, '"');
  text = text.replaceAll(/&#39;/g, "'");
  text = text.replaceAll(/&amp;/g, "&");
  return text;
};
