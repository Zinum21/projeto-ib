import { Data, Row, Settings, pillarIds } from "./model";
export const pct = (n: number, d: number) =>
  d ? Math.min(100, Math.max(0, (n / d) * 100)) : 0;
export const sum = (rows: Row[], key: string) =>
  rows.reduce((a, r) => a + Number(r[key] || 0), 0);
export const day = (date = new Date(), timezone = "America/Fortaleza") =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export const shift = (d: string, n: number) =>
  new Date(Date.parse(d + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export const weekStart = (d: string) =>
  shift(d, -((new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7));
export const minutes = (n: number) =>
  `${Math.floor(n / 60)}h ${Math.round(n % 60)}min`;
export const weightedSkills = (rows: Row[]) => {
  const weights: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  return rows.length
    ? rows.reduce(
        (n, r) =>
          n +
          Number(r.currentLevel) * 20 * (weights[String(r.importance)] || 1),
        0,
      ) / rows.reduce((n, r) => n + (weights[String(r.importance)] || 1), 0)
    : 0;
};
export function streak(dates: string[], today: string, weekly = false) {
  const step = weekly ? 7 : 1,
    key = (d: string) => (weekly ? weekStart(d) : d);
  const set = new Set(dates.filter((d) => d <= today).map(key));
  let current = key(today);
  if (!set.has(current)) current = shift(current, -step);
  let count = 0;
  while (set.has(current)) {
    count++;
    current = shift(current, -step);
  }
  return count;
}
export function habitMetrics(
  h: Row,
  logs: Row[],
  today: string,
  from?: string,
) {
  const weekly = h.frequency === "WEEKLY",
    step = weekly ? 7 : 1,
    key = (d: string) => (weekly ? weekStart(d) : d);
  const created = String(h.createdAt).slice(0, 10),
    start = key(from && from > created ? from : created),
    end = key(today);
  const dates = logs
    .filter(
      (l) =>
        l.habitId === h.id &&
        String(l.date) >= created &&
        String(l.date) <= today,
    )
    .map((l) => String(l.date));
  const periods = [...new Set(dates.map(key))].sort();
  let best = 0,
    run = 0,
    last = "";
  for (const p of periods) {
    run = last && shift(last, step) === p ? run + 1 : 1;
    best = Math.max(best, run);
    last = p;
  }
  const eligible = Math.max(
    0,
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000 / step) + 1,
  );
  return {
    streak: streak(dates, today, weekly),
    best,
    rate: pct(periods.filter((p) => p >= start && p <= end).length, eligible),
    eligible,
  };
}
export const goalProgress = (g: Row, milestones: Row[]) => {
  const m = milestones.filter((x) => x.goalId === g.id);
  return m.length
    ? pct(m.filter((x) => x.completed).length, m.length)
    : Number(g.progress || 0);
};
export const levels = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500];
export const levelFor = (xp: number) => levels.filter((n) => xp >= n).length;
export function calculate(
  data: Data,
  s: Settings,
  today = day(new Date(), s.timezone),
) {
  const list = (key: string) => data[key] || [],
    skills = list("skills"),
    projects = list("projects"),
    contacts = list("contacts").filter((c) => c.status !== "ARCHIVED");
  // Explicit component policy: skills 60%, courses 25%, linked projects 15%.
  // Only existing component groups participate; no components means zero.
  const pillars = pillarIds.map((id, i) => {
    const sk = skills.filter((x) => x.pillarId === id),
      courses = list("courses").filter((x) => x.pillarId === id);
    const courseValues = courses.map((c) => {
      const mids = list("modules")
        .filter((m) => m.courseId === c.id)
        .map((m) => m.id);
      const lessons = list("lessons").filter((l) =>
        mids.includes(String(l.moduleId)),
      );
      return pct(
        lessons.filter((l) => l.status === "COMPLETED").length,
        lessons.length,
      );
    });
    const pr = projects.filter(
      (p) => p.pillarId === id && p.status !== "ARCHIVED",
    );
    const parts: { label: string; value: number; weight: number }[] = [];
    if (sk.length)
      parts.push({ label: "Skills", value: weightedSkills(sk), weight: 60 });
    if (courses.length)
      parts.push({
        label: "Cursos",
        value: courseValues.reduce((a, b) => a + b, 0) / courses.length,
        weight: 25,
      });
    if (pr.length)
      parts.push({
        label: "Projetos vinculados",
        value: sum(pr, "progress") / pr.length,
        weight: 15,
      });
    if (id === "experience")
      parts.push({
        label: "Experiência registrada",
        value: s.experienceLevel * 20,
        weight: 60,
      });
    const progress = parts.length
      ? parts.reduce((n, c) => n + c.value * c.weight, 0) /
        parts.reduce((n, c) => n + c.weight, 0)
      : 0;
    return {
      id,
      name: String(list("pillars").find((p) => p.id === id)?.title || id),
      progress,
      weight: s.pillarWeights[i],
      parts,
    };
  });
  const relevant = contacts.filter((c) => c.relevant).length;
  const networking =
    relevant === 0
      ? 0
      : relevant <= 2
        ? 20
        : relevant <= 5
          ? 40
          : relevant <= 10
            ? 60
            : relevant <= 20
              ? 80
              : 100;
  const completed = projects.filter((p) => p.status === "COMPLETED");
  const eligibleProjects = completed.filter((p) =>
    [
      "Fundamental Analysis",
      "Financial Statements",
      "DCF",
      "Valuation",
      "Financial Modeling",
      "Finance Excel",
    ].includes(String(p.category)),
  );
  const readinessValues = [
    weightedSkills(skills.filter((x) => x.pillarId === "finance")),
    s.englishLevel * 20,
    weightedSkills(
      skills.filter((x) =>
        ["Excel", "Financial Modeling"].includes(String(x.title)),
      ),
    ),
    pct(eligibleProjects.length, 5),
    s.experienceLevel * 20,
    networking,
    pct(
      list("profile").filter((p) => p.completed).length,
      list("profile").length,
    ),
  ];
  const readinessNames = [
    "Technical Knowledge",
    "English",
    "Excel / Modeling",
    "Projects",
    "Experience",
    "Networking",
    "Professional Profile",
  ];
  const readiness = readinessValues.reduce(
    (n, v, i) => n + (v * s.readinessWeights[i]) / 100,
    0,
  );
  const start = weekStart(today),
    end = shift(start, 6),
    sessions = list("sessions");
  const thisWeek = sessions.filter(
      (r) => String(r.date) >= start && String(r.date) <= today,
    ),
    previous = sessions.filter(
      (r) =>
        String(r.date) >= shift(start, -7) &&
        String(r.date) <= shift(today, -7),
    );
  const studyMinutes = sum(thisWeek, "durationMinutes"),
    previousMinutes = sum(previous, "durationMinutes");
  const tasks = list("tasks").filter(
    (t) =>
      t.status !== "CANCELLED" &&
      String(t.dueDate) >= start &&
      String(t.dueDate) <= end,
  );
  const taskRate = pct(
      tasks.filter((t) => t.status === "DONE").length,
      tasks.length,
    ),
    studyRate = pct(studyMinutes, s.weeklyMinutes);
  const habits = list("habits").filter((h) => h.active),
    habitRate = habits.length
      ? habits.reduce(
          (n, h) => n + habitMetrics(h, list("habitLogs"), today, start).rate,
          0,
        ) / habits.length
      : 0;
  const opp = list("opportunities").filter((o) => !o.archived),
    apps = opp.filter((o) =>
      ["APPLIED", "INTERVIEW", "FINALIST", "ACCEPTED", "REJECTED"].includes(
        String(o.status),
      ),
    ),
    interviews = opp.filter((o) =>
      ["INTERVIEW", "FINALIST", "ACCEPTED"].includes(String(o.status)),
    ),
    accepted = opp.filter((o) => o.status === "ACCEPTED");
  const notifications: { title: string; page: string }[] = [];
  for (const t of list("tasks"))
    if (
      t.dueDate &&
      String(t.dueDate) < today &&
      !["DONE", "CANCELLED"].includes(String(t.status))
    )
      notifications.push({
        title: `Tarefa atrasada: ${t.title}`,
        page: "tasks",
      });
  for (const r of list("reviews"))
    if (String(r.reviewDate) < today && !r.completed)
      notifications.push({ title: `Revisar: ${r.title}`, page: "reviews" });
  for (const c of contacts)
    if (c.nextFollowUpDate && String(c.nextFollowUpDate) <= today)
      notifications.push({
        title: `Retomar contato: ${c.title}`,
        page: "contacts",
      });
  for (const o of opp)
    if (
      o.deadline &&
      String(o.deadline) >= today &&
      String(o.deadline) <= shift(today, 7) &&
      ["INTERESTED", "TO_APPLY"].includes(String(o.status))
    )
      notifications.push({
        title: `Prazo próximo: ${o.title}`,
        page: "opportunities",
      });
  for (const m of list("milestones"))
    if (
      !m.completed &&
      m.dueDate &&
      String(m.dueDate) >= today &&
      String(m.dueDate) <= shift(today, 7)
    )
      notifications.push({
        title: `Milestone próximo: ${m.title}`,
        page: "goals",
      });
  const activityDates = [
    ...sessions.map((x) => String(x.date)),
    ...list("tasks")
      .filter((x) => x.completedAt)
      .map((x) => String(x.completedAt).slice(0, 10)),
    ...list("habitLogs").map((x) => String(x.date)),
  ];
  if (activityDates.length && streak(activityDates, today) === 0)
    notifications.push({
      title: "Um novo começo cabe em poucos minutos. Retome no seu ritmo.",
      page: "study",
    });
  const achievements = [
    {
      name: "Primeiro valuation",
      done: completed.some((p) => p.category === "Valuation"),
    },
    { name: "Primeiro DCF", done: completed.some((p) => p.category === "DCF") },
    {
      name: "Primeiro financial model",
      done: completed.some((p) => p.category === "Financial Modeling"),
    },
    {
      name: "Primeiro projeto publicado",
      done: completed.some((p) => p.repositoryUrl || p.fileUrl),
    },
    { name: "Primeiro networking", done: list("interactions").length > 0 },
    { name: "Primeiro processo seletivo", done: apps.length > 0 },
    { name: "Primeiro estágio em finanças", done: s.experienceLevel >= 3 },
    {
      name: "Primeiro contato com IB",
      done: list("interactions").some((i) =>
        contacts.some(
          (c) =>
            c.id === i.contactId &&
            /investment banking|\bIB\b/i.test(String(c.area)),
        ),
      ),
    },
  ];
  return {
    today,
    pillars,
    careerProgress: pillars.reduce(
      (n, p) => n + (p.progress * p.weight) / 100,
      0,
    ),
    readiness,
    readinessComponents: readinessNames.map((name, i) => ({
      name,
      value: readinessValues[i],
      weight: s.readinessWeights[i],
    })),
    studyMinutes,
    previousMinutes,
    comparison:
      previousMinutes === 0
        ? "New"
        : `${(((studyMinutes - previousMinutes) / previousMinutes) * 100).toFixed(0)}%`,
    studyRate,
    taskRate,
    habitRate,
    weeklyExecution: taskRate * 0.4 + studyRate * 0.4 + habitRate * 0.2,
    tasksDone: tasks.filter((t) => t.status === "DONE").length,
    tasksTotal: tasks.length,
    streak: streak(activityDates, today),
    xp: sum(list("xp"), "amount"),
    contacts: contacts.length,
    newContacts: contacts.filter(
      (c) => String(c.firstContactDate).slice(0, 7) === today.slice(0, 7),
    ).length,
    followUps: contacts.filter(
      (c) => c.nextFollowUpDate && String(c.nextFollowUpDate) <= today,
    ).length,
    activeNetworking: contacts.filter((c) =>
      ["ACTIVE", "MENTOR", "OPPORTUNITY"].includes(String(c.status)),
    ).length,
    companies: new Set(contacts.map((c) => c.company).filter(Boolean)).size,
    opportunities: opp.length,
    applications: apps.length,
    interviews: interviews.length,
    accepted: accepted.length,
    conversion: apps.length ? (interviews.length / apps.length) * 100 : null,
    acceptance: apps.length ? (accepted.length / apps.length) * 100 : null,
    notifications,
    achievements,
  };
}
