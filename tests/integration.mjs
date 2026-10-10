import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const directory = mkdtempSync(path.join(os.tmpdir(), "career-os-test-"));
const base = "http://127.0.0.1:3187";
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3187",
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_PATH: path.join(directory, "integration.db"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
child.stdout.on("data", (d) => (logs += d));
child.stderr.on("data", (d) => (logs += d));
let cookie = "";
const request = (route, body, origin = base) =>
  fetch(base + route, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(base + "/api/auth")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Server did not become ready: " + logs);
  assert.equal((await request("/api/state")).status, 401);
  const password = randomBytes(20).toString("hex");
  let res = await request("/api/auth", { action: "setup", password });
  assert.equal(res.status, 200);
  cookie = res.headers.get("set-cookie").split(";")[0];
  res = await request("/api/state");
  assert.equal(res.status, 200);
  let state = await res.json();
  assert.equal(state.metrics.careerProgress, 0);
  const values = {
    title: "Integration test study",
    pillarId: "finance",
    date: state.metrics.today,
    durationMinutes: 45,
  };
  res = await request("/api/state", {
    action: "save",
    kind: "sessions",
    values,
  });
  assert.equal(res.status, 200);
  state = await res.json();
  assert.equal(state.metrics.studyMinutes, 45);
  assert.equal(state.metrics.xp, 5);
  res = await request("/api/state");
  state = await res.json();
  assert.equal(state.data.sessions.length, 1);
  res = await request(
    "/api/state",
    { action: "save", kind: "sessions", values },
    "https://evil.example",
  );
  assert.equal(res.status, 403);
  res = await request("/api/state", {
    action: "save",
    kind: "sessions",
    values: { ...values, pillarId: "missing" },
  });
  assert.equal(res.status, 400);
  res = await request("/api/state", {
    action: "settings",
    kind: "settings",
    values: { ...state.settings, pillarWeights: [1, 1, 1, 1, 1] },
  });
  assert.equal(res.status, 400);
  await request("/api/auth", { action: "logout" });
  cookie = "";
  assert.equal((await request("/api/state")).status, 401);
  res = await request("/api/auth", { action: "login", password });
  assert.equal(res.status, 200);
  cookie = res.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/api/state")).status, 200);
  console.log(
    "PASS: setup, authentication, persistence, study metrics, CSRF, references, weights, logout and login.",
  );
} finally {
  if (child.exitCode === null) {
    const stopped = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await stopped;
  }
}
