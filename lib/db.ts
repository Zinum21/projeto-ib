import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  Data,
  Row,
  Settings,
  definitions,
  defaultSettings,
  settingsSchema,
  validateRow,
  pillarIds,
} from "./model";
import { initialData } from "./seed";
import { calculate, day, shift } from "./metrics";

export class CareerStore {
  readonly db: DatabaseSync;
  constructor(
    filename = process.env.DATABASE_PATH ||
      path.join(process.cwd(), "data", "career.db"),
  ) {
    if (filename !== ":memory:")
      mkdirSync(path.dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db
      .exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)));
   CREATE INDEX IF NOT EXISTS records_kind ON records(kind);
   CREATE TABLE IF NOT EXISTS relations (child TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE, field TEXT NOT NULL, parent TEXT NOT NULL REFERENCES records(id) ON DELETE RESTRICT, PRIMARY KEY(child,field));
   CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS unique_events (event TEXT PRIMARY KEY, record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE);
   PRAGMA user_version=1;`);
    if (!this.meta("settings")) {
      this.db.exec("BEGIN IMMEDIATE");
      try {
        this.setMeta("settings", JSON.stringify(defaultSettings));
        const seed = initialData(day());
        Object.entries(seed).forEach(([kind, rows]) =>
          rows.forEach((r) => this.put(kind, r)),
        );
        Object.entries(seed).forEach(([kind, rows]) =>
          rows.forEach((r) => this.link(kind, r)),
        );
        this.db.exec("COMMIT");
      } catch (e) {
        this.db.exec("ROLLBACK");
        throw e;
      }
    }
  }
  meta(key: string) {
    return (
      this.db.prepare("SELECT value FROM meta WHERE key=?").get(key) as
        { value: string } | undefined
    )?.value;
  }
  setMeta(key: string, value: string) {
    this.db
      .prepare(
        "INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(key, value);
  }
  settings(): Settings {
    return JSON.parse(this.meta("settings")!);
  }
  all(): Data {
    const data: Data = Object.fromEntries(
      [...Object.keys(definitions), "habitLogs", "xp", "snapshots"].map((k) => [
        k,
        [],
      ]),
    );
    for (const r of this.db.prepare("SELECT kind,data FROM records").all() as {
      kind: string;
      data: string;
    }[])
      (data[r.kind] ??= []).push(JSON.parse(r.data));
    return data;
  }
  get(id: string) {
    const raw = this.db
      .prepare("SELECT kind,data FROM records WHERE id=?")
      .get(id) as { kind: string; data: string } | undefined;
    return raw ? { kind: raw.kind, row: JSON.parse(raw.data) as Row } : null;
  }
  put(kind: string, row: Row) {
    this.db
      .prepare(
        "INSERT INTO records(id,kind,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .run(row.id, kind, JSON.stringify(row));
  }
  link(kind: string, row: Row) {
    this.db.prepare("DELETE FROM relations WHERE child=?").run(row.id);
    for (const f of definitions[kind]?.fields || []) {
      if (!f.relation || !row[f.key]) continue;
      const parent = this.get(String(row[f.key]));
      if (!parent || parent.kind !== f.relation)
        throw new Error(`${f.label}: registro relacionado não encontrado.`);
      this.db
        .prepare("INSERT INTO relations(child,field,parent) VALUES(?,?,?)")
        .run(row.id, f.key, parent.row.id);
    }
  }
  award(event: string, amount: number, date: string) {
    if (this.db.prepare("SELECT 1 FROM unique_events WHERE event=?").get(event))
      return;
    const id = randomUUID();
    this.put("xp", {
      id,
      title: event,
      amount,
      date,
      createdAt: date,
      updatedAt: date,
    });
    this.db
      .prepare("INSERT INTO unique_events(event,record_id) VALUES(?,?)")
      .run(event, id);
  }
  snapshot() {
    const s = this.settings(),
      today = day(new Date(), s.timezone),
      m = calculate(this.all(), s, today);
    this.put("snapshots", {
      id: `snapshot-${today}`,
      date: today,
      careerProgress: m.careerProgress,
      readiness: m.readiness,
      ...Object.fromEntries(m.pillars.map((p) => [p.id, p.progress])),
      createdAt: today,
      updatedAt: new Date().toISOString(),
    });
  }
  mutate(action: string, kind: string, input: unknown, id?: string) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const today = day(new Date(), this.settings().timezone),
        now = new Date().toISOString();
      if (action === "settings") {
        const s = settingsSchema.parse(input);
        this.setMeta("settings", JSON.stringify(s));
        pillarIds.forEach((pid, i) => {
          const p = this.get(pid)!.row;
          this.put("pillars", {
            ...p,
            weight: s.pillarWeights[i],
            updatedAt: now,
          });
        });
      } else if (action === "habit") {
        const { habitId, date } = input as { habitId: string; date: string };
        if (date !== today)
          throw new Error("Registre o hábito na data de hoje.");
        const h = this.get(habitId);
        if (h?.kind !== "habits" || !h.row.active)
          throw new Error("Hábito inválido.");
        const logId = `habit-${habitId}-${date}`;
        if (this.get(logId))
          this.db.prepare("DELETE FROM records WHERE id=?").run(logId);
        else {
          this.put("habitLogs", {
            id: logId,
            habitId,
            date,
            createdAt: now,
            updatedAt: now,
          });
          this.db
            .prepare("INSERT INTO relations(child,field,parent) VALUES(?,?,?)")
            .run(logId, "habitId", habitId);
        }
      } else {
        if (!definitions[kind] || kind === "pillars")
          throw new Error("Edite os pesos dos cinco pilares em Configurações.");
        const old = id ? this.get(id) : null;
        if (id && old?.kind !== kind)
          throw new Error("Registro não encontrado.");
        if (old?.row.sourceLessonId)
          throw new Error(
            "Esta sessão é gerada por uma aula. Edite a aula de origem.",
          );
        if (action === "delete") {
          if (!old) throw new Error("Registro não encontrado.");
          if (kind === "lessons")
            this.db
              .prepare("DELETE FROM records WHERE id=?")
              .run(`lesson-session-${id}`);
          if (kind === "habits")
            this.db
              .prepare(
                "DELETE FROM records WHERE id IN (SELECT child FROM relations WHERE parent=? AND field='habitId')",
              )
              .run(id!);
          if (
            this.db
              .prepare("SELECT 1 FROM relations WHERE parent=? LIMIT 1")
              .get(id!)
          )
            throw new Error(
              "Este registro possui itens vinculados. Remova ou mova esses itens primeiro.",
            );
          this.db.prepare("DELETE FROM records WHERE id=?").run(id!);
        } else if (action === "save") {
          const values = validateRow(kind, input),
            row: Row = {
              ...values,
              id: id || randomUUID(),
              createdAt: old?.row.createdAt || today,
              updatedAt: now,
            };
          if (
            kind === "tasks" &&
            this.all().tasks.some(
              (t) =>
                t.id !== row.id &&
                String(t.title).toLowerCase() ===
                  String(row.title).toLowerCase() &&
                t.dueDate === row.dueDate &&
                t.pillarId === row.pillarId,
            )
          )
            throw new Error("Já existe uma tarefa igual nesse dia e pilar.");
          if (
            kind === "checkins" &&
            this.all().checkins.some(
              (c) => c.id !== row.id && c.date === row.date,
            )
          )
            throw new Error(
              "Já existe um check-in para esta data. Edite o registro existente.",
            );
          if (kind === "sessions") {
            if (Boolean(row.startTime) !== Boolean(row.endTime))
              throw new Error("Informe início e fim juntos.");
            if (row.startTime && row.endTime) {
              const duration =
                (Date.parse(String(row.endTime) + "Z") -
                  Date.parse(String(row.startTime) + "Z")) /
                60000;
              if (duration <= 0 || duration > 1440)
                throw new Error(
                  "O fim deve ser posterior ao início e a sessão deve ter até 24h.",
                );
              row.durationMinutes = duration;
              row.date = String(row.startTime).slice(0, 10);
            }
            if (Number(row.durationMinutes) <= 0)
              throw new Error("Informe uma duração positiva.");
          }
          if (kind === "plans" && String(row.end) <= String(row.start))
            throw new Error("Fim deve ser posterior ao início.");
          if (
            row.startDate &&
            row.dueDate &&
            String(row.dueDate) < String(row.startDate)
          )
            throw new Error("Prazo anterior ao início.");
          if (
            row.startDate &&
            row.deadline &&
            String(row.deadline) < String(row.startDate)
          )
            throw new Error("Prazo anterior ao início.");
          if (
            ["sessions", "checkins", "interactions"].includes(kind) &&
            String(row.date) > today
          )
            throw new Error(
              "Atividades realizadas não podem estar no futuro. Use o planejamento.",
            );
          if (
            kind === "contacts" &&
            (String(row.firstContactDate) > today ||
              (row.lastInteractionDate &&
                String(row.lastInteractionDate) > today))
          )
            throw new Error(
              "Datas de contatos realizados não podem estar no futuro.",
            );
          if (kind === "projects") {
            if (row.status === "COMPLETED") row.progress = 100;
            if (row.status === "IDEA") row.progress = 0;
          }
          const complete =
            row.completed === true ||
            ["COMPLETED", "DONE"].includes(String(row.status));
          if (complete) {
            row.completedAt = row.completedAt || old?.row.completedAt || today;
            if (String(row.completedAt) > today)
              throw new Error("Conclusão não pode estar no futuro.");
          } else row.completedAt = "";
          this.put(kind, row);
          this.link(kind, row);
          if (kind === "lessons") {
            const sid = `lesson-session-${row.id}`;
            if (row.status === "COMPLETED") {
              const module = this.get(String(row.moduleId))!.row,
                course = this.get(String(module.courseId))!.row;
              this.put("sessions", {
                id: sid,
                title: row.title,
                pillarId: course.pillarId,
                date: String(row.completedAt),
                durationMinutes: row.durationMinutes,
                sourceLessonId: row.id,
                createdAt: now,
                updatedAt: now,
              });
              this.db
                .prepare(
                  "INSERT OR REPLACE INTO relations(child,field,parent) VALUES(?,?,?)",
                )
                .run(sid, "sourceLessonId", row.id);
              this.award(`lesson:${row.id}`, 10, today); // No session bonus for the same lesson activity.
            } else this.db.prepare("DELETE FROM records WHERE id=?").run(sid);
            if (
              row.needsReview &&
              !this.all().reviews.some(
                (r) => r.lessonId === row.id && !r.completed,
              )
            ) {
              const review: Row = {
                id: randomUUID(),
                title: row.title,
                lessonId: row.id,
                reviewDate: shift(today, 1),
                mastery: 0,
                completed: false,
                createdAt: today,
                updatedAt: now,
              };
              this.put("reviews", review);
              this.link("reviews", review);
            }
          }
          if (kind === "sessions") this.award(`session:${row.id}`, 5, today);
          if (kind === "interactions") {
            this.award(`networking:${row.id}`, 20, today);
            const c = this.get(String(row.contactId))!.row;
            this.put("contacts", {
              ...c,
              lastInteractionDate: row.date,
              updatedAt: now,
            });
          }
          if (complete) {
            const amount: Record<string, number> = {
              projects: 100,
              tasks: 5,
              reviews: 10,
              milestones: 50,
            };
            if (amount[kind])
              this.award(`${kind}:${row.id}`, amount[kind], today);
          }
        } else throw new Error("Ação inválida.");
      }
      this.snapshot();
      this.db.exec("COMMIT");
      return this.state();
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  state() {
    const settings = this.settings(),
      data = this.all();
    return { settings, data, metrics: calculate(data, settings) };
  }
}
const globalDb = globalThis as unknown as { careerStore?: CareerStore };
export const store = () =>
  globalDb.careerStore ?? (globalDb.careerStore = new CareerStore());
