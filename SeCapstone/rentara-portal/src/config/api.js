// Serve through Node, or use Apache on port 80 with Node on 8080.
const local =
  typeof location !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(location.hostname);
export const apiConfig = {
  BASE_URL: local
    ? location.port && location.port !== "5500"
      ? location.origin + "/api/v1"
      : "http://" + location.hostname + ":8080/api/v1"
    : "/api/v1",
  TIMEOUT_MS: 12000,
};
