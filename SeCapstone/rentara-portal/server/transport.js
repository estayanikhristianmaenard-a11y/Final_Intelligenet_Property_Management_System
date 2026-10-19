import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSecureContext } from "node:tls";

// Validate TLS before opening the database; a broken HTTPS setup must not fall
// back silently to unencrypted HTTP.
export function serverTransport(env, root) {
  const certFile = env.TLS_CERT_FILE?.trim();
  const keyFile = env.TLS_KEY_FILE?.trim();
  if (!certFile && !keyFile) return handler => http.createServer(handler);
  if (!certFile || !keyFile)
    throw new Error("HTTPS requires both TLS_CERT_FILE and TLS_KEY_FILE.");
  let options;
  try {
    options = {
      cert: readFileSync(resolve(root, certFile)),
      key: readFileSync(resolve(root, keyFile)),
      minVersion: "TLSv1.2",
    };
    createSecureContext(options);
  } catch {
    throw new Error("Cannot load HTTPS certificate/key. Check the local TLS setup.");
  }
  return handler => https.createServer(options, handler);
}
