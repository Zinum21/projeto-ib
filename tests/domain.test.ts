import test from "node:test";
import assert from "node:assert/strict";
import { CareerStore } from "../lib/db";
import {
  defaultSettings,
  settingsSchema,
  validateRow,
  type Row,
} from "../lib/model";
import {
  calculate,
  day,
  shift,
  weekStart,
  streak,
  habitMetrics,
  goalProgress,
  levelFor,
  weightedSkills,
} from "../lib/metrics";
import { passwordHash, checkPassword } from "../lib/auth";
const record = (fields: Record<string, string | number | boolean>) =>
  ({
    id: "x",
    createdAt: "2026-10-08",
    updatedAt: "2026-10-08",
    ...fields,
  }) as Row;
const db = () => new CareerStore(":memory:");
test("seed contém cinco pilares e nenhum resultado profissional inventado", () => {
  const s = db();
  const state = s.state();
  assert.equal(state.data.pillars.length, 5);
  assert.equal(state.metrics.careerProgress, 0);
  assert.equal(state.metrics.readiness, 0);
  assert.equal(state.data.lessons.length, 0);
  assert.equal(state.data.modules.length, 0);
  assert.equal(state.metrics.xp, 0);
  s.db.close();
});
test("fórmula de Career Progress reproduz o exemplo 32%", () => {
  const data = {
    skills: [
      record({
        id: "a",
        pillarId: "college",
        currentLevel: 2.5,
        importance: "HIGH",
      }),
      record({
        id: "b",
        pillarId: "english",
        currentLevel: 1.5,
        importance: "HIGH",
      }),
      record({
        id: "c",
        pillarId: "finance",
        currentLevel: 2,
        importance: "HIGH",
      }),
      record({
        id: "d",
        pillarId: "technical",
        currentLevel: 1,
        importance: "HIGH",
      }),
    ],
  };
  const m = calculate(
    data,
    { ...defaultSettings, experienceLevel: 0.5 },
    "2026-10-10",
  );
  assert.equal(m.careerProgress, 32);
});
test("skills usam níveis /5 e importância 1/2/3", () => {
  assert.equal(
    weightedSkills([
      record({ currentLevel: 5, importance: "HIGH" }),
      record({ currentLevel: 1, importance: "LOW" }),
    ]),
    80,
  );
  assert.equal(weightedSkills([]), 0);
});
test("pesos inválidos, níveis inválidos e datas impossíveis são rejeitados", () => {
  assert.throws(() =>
    settingsSchema.parse({
      ...defaultSettings,
      pillarWeights: [10, 10, 10, 10, 10],
    }),
  );
  assert.throws(() =>
    settingsSchema.parse({
      ...defaultSettings,
      readinessWeights: [0, 0, 0, 0, 0, 0, 0],
    }),
  );
  assert.throws(() =>
    validateRow("skills", { title: "X", pillarId: "finance", currentLevel: 6 }),
  );
  assert.throws(() =>
    validateRow("tasks", { title: "X", dueDate: "2026-02-30" }),
  );
  assert.throws(() => validateRow("tasks", {}));
  assert.throws(() =>
    validateRow("opportunities", {
      title: "X",
      company: "X",
      status: "INVALID",
    }),
  );
});
test("sessão calcula minutos e bloqueia intervalo reverso", () => {
  const s = db(),
    date = day();
  s.mutate("save", "sessions", {
    title: "DCF",
    pillarId: "finance",
    date,
    startTime: date + "T21:00",
    endTime: date + "T21:45",
    durationMinutes: 999,
  });
  assert.equal(s.all().sessions[0].durationMinutes, 45);
  assert.throws(() =>
    s.mutate("save", "sessions", {
      title: "X",
      pillarId: "finance",
      date,
      startTime: date + "T22:00",
      endTime: date + "T21:00",
    }),
  );
  assert.equal(s.all().sessions.length, 1);
  s.db.close();
});
test("aula concluída cria só uma sessão e 10 XP; reabertura não duplica", () => {
  const s = db(),
    course = s.all().courses[1];
  s.mutate("save", "modules", { title: "Material real", courseId: course.id });
  const module = s.all().modules[0];
  s.mutate("save", "lessons", {
    title: "Aula 1",
    moduleId: module.id,
    durationMinutes: 45,
    status: "COMPLETED",
  });
  let l = s.all().lessons[0];
  assert.equal(s.all().sessions.length, 1);
  assert.equal(s.state().metrics.xp, 10);
  s.mutate(
    "save",
    "lessons",
    { ...l, notes: "Editei", durationMinutes: 60 },
    l.id,
  );
  assert.equal(s.all().sessions.length, 1);
  assert.equal(s.all().sessions[0].durationMinutes, 60);
  assert.equal(s.state().metrics.xp, 10);
  s.mutate("save", "lessons", { ...l, status: "IN_PROGRESS" }, l.id);
  assert.equal(s.all().sessions.length, 0);
  s.mutate("save", "lessons", { ...l, status: "COMPLETED" }, l.id);
  assert.equal(s.all().sessions.length, 1);
  assert.equal(s.state().metrics.xp, 10);
  s.db.close();
});
test("tarefas duplicadas são bloqueadas; conclusão tem data e XP único", () => {
  const s = db(),
    t = { title: "Study", dueDate: day(), pillarId: "english", status: "DONE" };
  s.mutate("save", "tasks", t);
  const r = s.all().tasks[0];
  assert.ok(r.completedAt);
  assert.throws(() => s.mutate("save", "tasks", t));
  s.mutate("save", "tasks", { ...r, notes: "edit" }, r.id);
  assert.equal(s.state().metrics.xp, 5);
  s.db.close();
});
test("relações são verificadas e impedem exclusão de pai em uso", () => {
  const s = db();
  assert.throws(() =>
    s.mutate("save", "modules", { title: "X", courseId: "missing" }),
  );
  assert.equal(s.all().modules.length, 0);
  const c = s.all().courses[0];
  s.mutate("save", "modules", { title: "X", courseId: c.id });
  assert.throws(() => s.mutate("delete", "courses", {}, c.id));
  assert.ok(s.get(c.id));
  s.db.close();
});
test("projeto completo força 100; ideia força zero; meta usa milestones", () => {
  const s = db();
  const p = s.all().projects[0];
  s.mutate(
    "save",
    "projects",
    { ...p, status: "COMPLETED", progress: 30 },
    p.id,
  );
  assert.equal(s.get(p.id)!.row.progress, 100);
  s.mutate("save", "projects", { ...p, status: "IDEA", progress: 80 }, p.id);
  assert.equal(s.get(p.id)!.row.progress, 0);
  assert.equal(
    goalProgress(record({ progress: 99 }), [
      record({ id: "m1", goalId: "x", completed: true }),
      record({ id: "m2", goalId: "x", completed: false }),
    ]),
    50,
  );
  s.db.close();
});
test("metas futuras e certificações não aumentam métricas de carreira", () => {
  const s = db(),
    before = s.state().metrics;
  s.mutate("save", "certifications", {
    title: "Nova certificação",
    status: "FUTURE",
  });
  s.mutate("save", "goals", {
    title: "Futuro",
    category: "LONG_TERM",
    progress: 100,
  });
  const after = s.state().metrics;
  assert.equal(after.careerProgress, before.careerProgress);
  assert.equal(after.readiness, before.readiness);
  s.db.close();
});
test("streak tolera hoje aberto, mas não lacunas antigas; semanas seguem segunda", () => {
  assert.equal(streak(["2026-10-08", "2026-10-09"], "2026-10-10"), 2);
  assert.equal(streak(["2026-10-07", "2026-10-08"], "2026-10-10"), 0);
  assert.equal(
    streak(["2026-10-08", "2026-10-09", "2026-10-10"], "2026-10-10"),
    3,
  );
  assert.equal(weekStart("2026-10-11"), "2026-10-05");
  assert.equal(streak(["2026-10-03", "2026-10-06"], "2026-10-10", true), 2);
});
test("hábitos excluem datas anteriores à criação e deduplicam semanas", () => {
  const h = record({ frequency: "DAILY" }),
    logs = [
      record({ habitId: "x", date: "2026-10-08" }),
      record({ habitId: "x", date: "2026-10-09" }),
    ];
  const m = habitMetrics(h, logs, "2026-10-10");
  assert.equal(m.eligible, 3);
  assert.ok(Math.abs(m.rate - 200 / 3) < 0.001);
  assert.equal(m.best, 2);
  assert.equal(
    habitMetrics({ ...h, frequency: "WEEKLY" }, logs, "2026-10-10").rate,
    100,
  );
});
test("hoje considera fuso; comparações zero e candidaturas vazias são seguras", () => {
  assert.equal(
    day(new Date("2026-10-11T01:00:00Z"), "America/Fortaleza"),
    "2026-10-10",
  );
  const m = calculate({}, defaultSettings, "2026-10-10");
  assert.equal(m.comparison, "New");
  assert.equal(m.conversion, null);
  assert.equal(m.acceptance, null);
});
test("taxa semanal exclui canceladas e tarefas fora da semana", () => {
  const data = {
    tasks: [
      record({ status: "DONE", dueDate: "2026-10-06" }),
      record({ id: "b", status: "CANCELLED", dueDate: "2026-10-07" }),
      record({ id: "c", status: "TODO", dueDate: "2026-10-19" }),
    ],
  };
  const m = calculate(data, defaultSettings, "2026-10-10");
  assert.equal(m.tasksTotal, 1);
  assert.equal(m.taskRate, 100);
});
test("check-in não adiciona horas e tem unicidade por dia", () => {
  const s = db(),
    date = day();
  s.mutate("save", "checkins", { date, studyMinutes: 90, energy: 4, focus: 5 });
  assert.equal(s.state().metrics.studyMinutes, 0);
  assert.throws(() => s.mutate("save", "checkins", { date, studyMinutes: 10 }));
  s.db.close();
});
test("habits e xp têm operações idempotentes por origem", () => {
  const s = db(),
    h = s.all().habits[0],
    date = day();
  s.mutate("habit", "habits", { habitId: h.id, date });
  assert.equal(s.all().habitLogs.length, 1);
  s.mutate("habit", "habits", { habitId: h.id, date });
  assert.equal(s.all().habitLogs.length, 0);
  assert.throws(() =>
    s.mutate("habit", "habits", { habitId: h.id, date: shift(date, 1) }),
  );
  s.db.close();
});
test("níveis de XP respeitam limites", () => {
  assert.equal(levelFor(99), 1);
  assert.equal(levelFor(100), 2);
  assert.equal(levelFor(7500), 10);
  assert.equal(levelFor(100000), 10);
});
test("hash de senha é salgado e verifica a senha correta", () => {
  const hash = passwordHash("uma-senha-segura");
  assert.ok(checkPassword("uma-senha-segura", hash));
  assert.equal(checkPassword("senha-incorreta", hash), false);
  assert.notEqual(hash, passwordHash("uma-senha-segura"));
});
