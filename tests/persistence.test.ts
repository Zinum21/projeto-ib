import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CareerStore } from "../lib/db";
import { day } from "../lib/metrics";
test("SQLite preserva registros e XP após fechar e reabrir o banco", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "career-persistence-")),
    file = path.join(dir, "test.db");
  let store = new CareerStore(file);
  store.mutate("save", "sessions", {
    title: "Persistir estudo",
    pillarId: "english",
    date: day(),
    durationMinutes: 30,
  });
  store.db.close();
  store = new CareerStore(file);
  assert.equal(store.all().sessions.length, 1);
  assert.equal(store.state().metrics.studyMinutes, 30);
  assert.equal(store.state().metrics.xp, 5);
  assert.equal(store.all().pillars.length, 5);
  store.db.close();
});
