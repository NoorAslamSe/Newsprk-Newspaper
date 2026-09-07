import mongoose from "mongoose";
import dns from "node:dns";
import { getEnv } from "@/lib/env";

// This machine's default DNS resolver refuses MongoDB Atlas SRV lookups
// (querySrv ECONNREFUSED). Public resolvers resolve them fine, so pin them.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

type DnsOverHttpsResponse = {
  Answer?: Array<{ type: number; data: string; name?: string }>;
  Status?: number;
};

/**
 * DNS-over-HTTPS lookup against a public resolver. The MongoDB driver fails
 * SRV/other lookups in this environment even with `dns.setServers` set (the
 * bundled `dns` module refuses the query), so we resolve over HTTPS instead.
 */
async function dnsQuery(type: string, name: string): Promise<string[]> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(
    name
  )}&type=${type}`;
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  const json = (await res.json()) as DnsOverHttpsResponse;
  if (json.Status !== 0 && json.Status !== 3) {
    throw new Error(`DNS ${type} lookup failed for ${name} (status ${json.Status})`);
  }
  const answers = (json.Answer ?? [])
    .filter((a) => (type === "SRV" ? a.type === 33 : a.type === 16))
    .map((a) => a.data);
  if (answers.length === 0) throw new Error(`No ${type} records for ${name}`);
  return answers;
}

/**
 * Convert a `mongodb+srv://` URI into a direct `mongodb://` URI by resolving
 * the SRV/TXT records ourselves. The bundled MongoDB driver fails SRV lookups
 * in this environment, so we resolve the cluster addresses manually and hand
 * the driver plain host:port addresses.
 */
async function toDirectUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) return uri;

  const match = uri.match(/^mongodb\+srv:\/\/([^@]+)@([^?]+)/);
  if (!match) return uri;
  const creds = match[1];
  const srvHost = match[2].replace(/\/.*$/, "").replace(/\/+$/, "");

  const srvName = `_mongodb._tcp.${srvHost}`;
  const [srvAnswers, txtAnswers] = await Promise.all([
    dnsQuery("SRV", srvName),
    dnsQuery("TXT", srvName),
  ]);

  const hosts = srvAnswers.map((data) => {
    const parts = data.split(" ");
    const name = parts[3].replace(/\.$/, "");
    return `${name}:${parts[2] || 27017}`;
  }).join(",");

  const params = new URLSearchParams(txtAnswers.join("&"));
  const authSource = params.get("authSource") || "admin";
  const replicaSet = params.get("replicaSet") || "";

  const query = new URLSearchParams({
    authSource,
    retryWrites: "true",
    ssl: "true",
    ...(replicaSet ? { replicaSet } : {}),
  });

  return `mongodb://${creds}@${hosts}/${DB_NAME}?${query.toString()}`;
}

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // Persists the connection across HMR re-executions in dev mode
  var _mongoose: Cached | undefined;
}

// Reuse the existing connection object across module re-imports (connection pooling)
const cached: Cached = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

// Database name — matches the database specified in MONGO_URI
const DB_NAME = "trendsposts-db";

export async function connectDB() {
  const { MONGO_URI, USE_DATABASE } = getEnv();

  // USE_DATABASE=false lets the app boot without a DB (e.g., for UI-only dev work)
  if (USE_DATABASE === "false") {
    return null;
  }

  // Return existing connection if it's still alive
  if (cached.conn) return cached.conn;

  // Initiate connection only once; subsequent callers await the same promise
  if (!cached.promise) {
    // mongodb+srv URIs need resolving to a direct URI (see toDirectUri).
    // Plain URIs are used as-is; if they don't name a database, append it.
    let uri = await toDirectUri(MONGO_URI);
    if (!uri.includes(`/${DB_NAME}`)) {
      const base = uri.split("?")[0].replace(/\/+$/, "");
      const params = uri.includes("?") ? "?" + uri.split("?")[1] : "";
      uri = `${base}/${DB_NAME}${params}`;
    }

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false, // Fail fast instead of queuing commands when not connected
    }).catch((err) => {
      // Don't cache a failed promise — next call must retry
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

