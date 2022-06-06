import { http } from "../deps.ts";

export const mockServer = (
  hostname: string,
  port: number,
  handler: http.Handler,
): http.Server => {
  const server = new http.Server({
    handler: handler,
    hostname: hostname,
    port: port,
  });
  server.listenAndServe();
  console.log(`server listening on http://${hostname}:${port}`);
  return server;
};
