"use client";
import { useState, useEffect, type FormEvent } from "react";
import {
  LayoutDashboard,
  Route,
  BookOpen,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  Users,
  Target,
  CalendarDays,
  ListChecks,
  Activity,
  UserRound,
  Settings2,
  Menu,
  Bell,
  Plus,
  Search,
  ArrowUpRight,
  ChevronRight,
  LogOut,
  Flame,
  Clock3,
  Check,
  CheckCheck,
  Pencil,
  Trash2,
  Download,
  ShieldCheck,
  GraduationCap,
  Layers,
  Repeat2,
  Compass,
  FileCheck2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  Data,
  Row,
  Settings,
  definitions,
  labels,
  pillarIds,
  defaultSettings,
  type Value,
} from "@/lib/model";
import {
  calculate,
  day,
  shift,
  weekStart,
  minutes,
  pct,
  goalProgress,
  habitMetrics,
  levelFor,
  levels,
  sum,
} from "@/lib/metrics";
import { Badge, Empty, Modal, Progress, Stat } from "./ui";

type State = {
  data: Data;
  settings: Settings;
  metrics: ReturnType<typeof calculate>;
};
const navigation = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["roadmap", "Career Roadmap", Route],
  ["study", "Study Center", BookOpen],
  ["skills", "Technical Skills", Layers],
  ["projects", "Projects", BriefcaseBusiness],
  ["contacts", "Networking", Users],
  ["opportunities", "Opportunities", Target],
  ["plans", "Weekly Planner", CalendarDays],
  ["goals", "Goals", Compass],
  ["tasks", "Tasks", ListChecks],
  ["habits", "Habits", CheckCheck],
  ["analytics", "Analytics", ChartNoAxesCombined],
  ["profile", "Profile", UserRound],
  ["settings", "Settings", Settings2],
] as const;
const names: Record<string, string> = {
  dashboard: "Career Dashboard",
  study: "Study Center",
  analytics: "Analytics",
  settings: "Settings",
  inspector: "Metrics Inspector",
  ...Object.fromEntries(
    Object.entries(definitions).map(([k, d]) => [k, d.title]),
  ),
};
const format = (n: number) => `${Math.round(n)}%`;

export default function CareerApp() {
  const [auth, setAuth] = useState<{
      initialized: boolean;
      authenticated: boolean;
    } | null>(null),
    [state, setState] = useState<State | null>(null),
    [page, setPage] = useState("dashboard"),
    [tab, setTab] = useState("sessions"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState<{ kind: string; row?: Row } | null>(null),
    [range, setRange] = useState("30"),
    [onboardingStep, setOnboardingStep] = useState(0);
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then(setAuth)
      .catch(() => setError("Não foi possível conectar ao servidor."));
  }, []);
  useEffect(() => {
    if (auth?.authenticated)
      fetch("/api/state")
        .then(async (r) => {
          if (!r.ok) throw new Error("Não foi possível carregar os dados.");
          return r.json();
        })
        .then(setState)
        .catch((e) => setError(e.message));
  }, [auth]);
  useEffect(() => {
    document.documentElement.dataset.theme = state?.settings.theme || "light";
  }, [state?.settings.theme]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const go = (key: string) => {
    setPage(key);
    setSearch("");
    setFilter("Todos");
    setMobile(false);
    setNotice(false);
    if (key === "study") setTab("sessions");
  };
  async function mutate(
    action: string,
    kind: string,
    values: unknown = {},
    id?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, kind, values, id }),
      });
      const next = await res.json();
      if (!res.ok) throw new Error(next.error);
      setState(next);
      setToast("Alterações salvas");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const password = new FormData(event.currentTarget).get("password");
    try {
      const r = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            action: auth?.initialized ? "login" : "setup",
          }),
        }),
        data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setAuth({ initialized: true, authenticated: true });
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }
  if (!auth)
    return (
      <div className="loading">
        <span className="brand-symbol">F</span>
        <p>{error || "Preparando seu Career OS…"}</p>
      </div>
    );
  if (!auth.authenticated)
    return (
      <main className="login">
        <div className="login-art">
          <div className="brand">
            <span className="brand-symbol">F</span> FINANCE CAREER OS
          </div>
          <span className="eyebrow">YOUR LONG-TERM INVESTMENT</span>
          <h1>
            Não tenho pressa.
            <br />
            <em>Tenho direção.</em>
          </h1>
          <p>Transforme sua carreira em um projeto de longo prazo.</p>
          <div className="login-grid">
            FOUNDATION <span>→</span> DEVELOPMENT <span>→</span> EXPERIENCE
          </div>
          <small>Build your career like an investment.</small>
        </div>
        <form className="login-form" onSubmit={login}>
          <span className="eyebrow">SEU ESPAÇO PESSOAL</span>
          <h2>
            {auth.initialized ? "Bem-vindo de volta." : "Comece com direção."}
          </h2>
          <p>
            {auth.initialized
              ? "Entre para continuar construindo a sua trajetória."
              : "Crie sua senha pessoal. Seus registros ficam no banco de dados desta instalação."}
          </p>
          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete={
                auth.initialized ? "current-password" : "new-password"
              }
              required
              minLength={10}
              maxLength={128}
              placeholder="Pelo menos 10 caracteres"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Aguarde…"
              : auth.initialized
                ? "Entrar no Career OS"
                : "Criar meu Career OS"}
            <ArrowUpRight size={17} />
          </button>
          <small>
            <ShieldCheck size={15} /> Acesso pessoal · Dados persistentes · Sem
            pressa
          </small>
        </form>
      </main>
    );
  if (!state)
    return (
      <div className="loading">
        <p>{error || "Carregando seus registros…"}</p>
        <button onClick={() => location.reload()}>Recarregar</button>
      </div>
    );
  const { data, settings: s, metrics: m } = state,
    today = m.today;
  const rows = (kind: string) => data[kind] || [];
  const add = (kind: string) => {
    setError("");
    setModal({ kind });
  };
  const saveRow = (kind: string, row: Row, patch: Record<string, Value>) =>
    mutate("save", kind, { ...row, ...patch }, row.id);
  const complete = (kind: string, row: Row) =>
    saveRow(
      kind,
      row,
      ["profile", "roadmap", "milestones", "reviews"].includes(kind)
        ? { completed: !row.completed }
        : kind === "tasks"
          ? { status: row.status === "DONE" ? "TODO" : "DONE" }
          : {
              status: row.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED",
            },
    );
  const periodStart =
    range === "YTD"
      ? today.slice(0, 4) + "-01-01"
      : shift(today, 1 - Number(range));
  const filteredSessions = rows("sessions").filter(
    (r) => String(r.date) >= periodStart && String(r.date) <= today,
  );
  const visibleKind = page === "study" ? tab : page;
  function display(row: Row, key: string, kind: string) {
    const value = row[key];
    const field = definitions[kind]?.fields.find((f) => f.key === key);
    if (field?.relation)
      return String(
        rows(field.relation).find((x) => x.id === value)?.title || "—",
      );
    if (key === "progress")
      return (
        <Progress
          value={
            kind === "goals"
              ? goalProgress(row, rows("milestones"))
              : Number(value || 0)
          }
        />
      );
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    if (key === "durationMinutes") return minutes(Number(value));
    if (key === "currentLevel") return `${value} / 5`;
    if (field?.type === "select")
      return <Badge>{labels[String(value)] || String(value || "—")}</Badge>;
    return String(value || "—");
  }
  function collection(kind: string, extraFilter?: (r: Row) => boolean) {
    const def = definitions[kind];
    let items = rows(kind).filter(
      (r) =>
        (!extraFilter || extraFilter(r)) &&
        JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
    );
    if (filter === "Hoje")
      items = items.filter((r) => (r.date || r.dueDate) === today);
    if (filter === "Semana")
      items = items.filter(
        (r) =>
          String(r.date || r.dueDate) >= weekStart(today) &&
          String(r.date || r.dueDate) <= shift(weekStart(today), 6),
      );
    if (filter === "Em andamento")
      items = items.filter((r) => r.status === "IN_PROGRESS");
    if (filter === "Concluídos")
      items = items.filter(
        (r) => ["COMPLETED", "DONE"].includes(String(r.status)) || r.completed,
      );
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{def.title}</h2>
            <p>{def.description}</p>
          </div>
          <button className="primary small" onClick={() => add(kind)}>
            <Plus size={16} />
            Adicionar
          </button>
        </div>
        <div className="table-tools">
          <label className="search">
            <Search size={16} />
            <input
              aria-label="Buscar registros"
              placeholder="Buscar registros…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          {["sessions", "tasks", "lessons", "projects"].includes(kind) && (
            <select
              aria-label="Filtrar registros"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["Todos", "Hoje", "Semana", "Em andamento", "Concluídos"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          )}
        </div>
        {!items.length ? (
          <Empty
            text={
              kind === "contacts"
                ? "Adicione seu primeiro contato profissional."
                : kind === "projects"
                  ? "Crie seu primeiro projeto financeiro."
                  : "Seus registros aparecerão aqui."
            }
            action={
              <button onClick={() => add(kind)}>
                Adicionar {def.singular}
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {def.columns.map((key) => (
                    <th key={key}>
                      {def.fields.find((f) => f.key === key)?.label || key}
                    </th>
                  ))}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    {def.columns.map((key) => (
                      <td key={key}>{display(row, key, kind)}</td>
                    ))}
                    <td>
                      <div className="row-actions">
                        {["tasks", "lessons", "reviews", "milestones"].includes(
                          kind,
                        ) && (
                          <button
                            disabled={busy}
                            className="icon-button"
                            title="Concluir / reabrir"
                            onClick={() => complete(kind, row)}
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          className="icon-button"
                          title={`Editar ${row.title || "registro"}`}
                          onClick={() => setModal({ kind, row })}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          disabled={busy}
                          className="icon-button danger"
                          title={`Excluir ${row.title || "registro"}`}
                          onClick={() => {
                            if (
                              confirm(
                                "Excluir este registro? Itens vinculados precisam ser removidos primeiro.",
                              )
                            )
                              void mutate("delete", kind, {}, row.id);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }
  const chartData = Array.from(
    {
      length:
        range === "7"
          ? 7
          : range === "30"
            ? 30
            : range === "90"
              ? 90
              : Math.floor(
                  (Date.parse(today) - Date.parse(periodStart)) / 86400000,
                ) + 1,
    },
    (_, i) => {
      const date = shift(periodStart, i);
      return {
        date: date.slice(5).split("-").reverse().join("/"),
        Minutos: sum(
          filteredSessions.filter((r) => r.date === date),
          "durationMinutes",
        ),
      };
    },
  );
  const chart = (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={chartData}>
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="var(--line)"
        />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          minTickGap={25}
          fontSize={11}
        />
        <YAxis axisLine={false} tickLine={false} fontSize={11} />
        <Tooltip />
        <Bar
          dataKey="Minutos"
          fill="#24816d"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button className="brand" onClick={() => go("dashboard")}>
          <span className="brand-symbol">F</span>
          <span>
            FINANCE<span className="brand-sub">CAREER OS</span>
          </span>
        </button>
        <div className="workspace">
          <span className="avatar">{s.name.slice(0, 1)}</span>
          <div>
            <b>Personal workspace</b>
            <small>Sua carreira, com direção</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navigation.map(([key, title, Icon]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              onClick={() => go(key)}
            >
              <Icon size={17} />
              {title}
              {page === key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="eyebrow">LONG-TERM MINDSET</span>
          <p>
            Não tenho pressa.
            <br />
            <b>Tenho direção.</b>
          </p>
          <button onClick={() => go("inspector")}>
            <Activity size={15} /> Metrics Inspector
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <b>{names[page] || page}</b>
          </div>
          <div className="header-actions">
            <span className="date-label">
              {new Date(today + "T12:00:00Z").toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              className="icon-button notification-button"
              aria-label="Notificações"
              onClick={() => setNotice(!notice)}
            >
              <Bell size={18} />
              {s.notifications && m.notifications.length > 0 && <i />}
            </button>
            <button
              className="avatar"
              aria-label="Perfil"
              onClick={() => go("profile")}
            >
              {s.name.slice(0, 1)}
            </button>
          </div>
        </header>
        {notice && (
          <div className="notifications panel">
            <h3>Seu próximo passo</h3>
            {!s.notifications ? (
              <p>Notificações desativadas nas configurações.</p>
            ) : m.notifications.length ? (
              m.notifications.slice(0, 8).map((n, i) => (
                <button key={i} onClick={() => go(n.page)}>
                  {n.title}
                  <ChevronRight size={14} />
                </button>
              ))
            ) : (
              <p>Tudo tranquilo por aqui.</p>
            )}
          </div>
        )}
        <main className="main">
          <div className="page-title">
            <div>
              <span className="eyebrow">
                {page === "dashboard"
                  ? "YOUR CAREER, COMPOUNDING DAILY"
                  : "FINANCE CAREER OS"}
              </span>
              <h1>{names[page]}</h1>
              <p>
                {page === "dashboard"
                  ? "Pequenos passos hoje. Uma trajetória sólida amanhã."
                  : definitions[page]?.description ||
                    "Transforme sua carreira em um projeto de longo prazo."}
              </p>
            </div>
            <div className="title-actions">
              {page === "dashboard" ? (
                <>
                  <button onClick={() => go("checkins")}>Daily check-in</button>
                  <button className="primary" onClick={() => add("sessions")}>
                    <Plus size={17} />
                    Registrar estudo
                  </button>
                </>
              ) : page === "analytics" ? (
                <select
                  aria-label="Período"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                >
                  {["7", "30", "90", "YTD"].map((v) => (
                    <option key={v} value={v}>
                      {v === "YTD" ? "Este ano" : `${v} dias`}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>
          {error && !modal && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setError("")}>Fechar</button>
            </div>
          )}
          {page === "dashboard" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <Badge>LONG-TERM GOAL</Badge>
                  <h2>{s.careerGoal}</h2>
                  <p>
                    Construção de Base <span>•</span> Administração ·{" "}
                    {s.currentSemester}º semestre
                  </p>
                  <div className="hero-foot">
                    <span className="live-dot" /> Working + College{" "}
                    <span className="muted">
                      08–16h trabalho / 18–21h faculdade
                    </span>
                  </div>
                </div>
                <div className="hero-progress">
                  <span>CAREER PROGRESS</span>
                  <strong>
                    {format(m.careerProgress)}
                    <ArrowUpRight size={28} />
                  </strong>
                  <Progress value={m.careerProgress} />
                  <button onClick={() => go("inspector")}>
                    Entenda o cálculo <ArrowUpRight size={13} />
                  </button>
                </div>
              </section>
              <div className="section-label">
                <span>THIS WEEK</span>
                <small>
                  Desde segunda-feira · {today.split("-").reverse().join("/")}
                </small>
              </div>
              <div className="stats">
                <Stat
                  label="Horas estudadas"
                  value={minutes(m.studyMinutes)}
                  detail={`${m.comparison} vs. mesmos dias da semana anterior`}
                  accent
                />
                <Stat
                  label="Tarefas concluídas"
                  value={
                    <>
                      {m.tasksDone}
                      <em> / {m.tasksTotal}</em>
                    </>
                  }
                  detail="Tarefas com prazo nesta semana"
                />
                <Stat
                  label="Consistência"
                  value={
                    <>
                      {m.streak}
                      <em> dias</em>
                    </>
                  }
                  detail={
                    <>
                      <Flame size={13} /> Um passo de cada vez
                    </>
                  }
                />
                <Stat
                  label="Career Readiness"
                  value={format(m.readiness)}
                  detail="Preparação profissional registrada"
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">BUILDING BLOCKS</span>
                      <h2>Career Pillars</h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("skills")}
                    >
                      Explorar
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="pillar-list">
                    {m.pillars.map((p, i) => (
                      <button
                        className="pillar-row"
                        key={p.id}
                        onClick={() =>
                          go(p.id === "experience" ? "profile" : "skills")
                        }
                      >
                        <span className={`pillar-icon tone-${i}`}>
                          <GraduationCap size={18} />
                        </span>
                        <div>
                          <div className="between">
                            <b>{p.name}</b>
                            <span>{format(p.progress)}</span>
                          </div>
                          <Progress value={p.progress} />
                        </div>
                        <ChevronRight size={15} />
                      </button>
                    ))}
                  </div>
                  <div className="panel-note">
                    Seu progresso representa desenvolvimento registrado. Não é
                    uma probabilidade de conseguir uma vaga.
                  </div>
                </section>
                <section className="panel today-panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">KEEP IT SIMPLE</span>
                      <h2>Hoje, com intenção</h2>
                    </div>
                    <Badge>HOJE</Badge>
                  </div>
                  <div className="today-list">
                    {rows("tasks")
                      .filter(
                        (t) => t.dueDate === today && t.status !== "CANCELLED",
                      )
                      .map((t) => (
                        <button
                          key={t.id}
                          disabled={busy}
                          className="check-row"
                          onClick={() => complete("tasks", t)}
                        >
                          <span
                            className={`checkbox ${t.status === "DONE" ? "checked" : ""}`}
                          >
                            {t.status === "DONE" && <Check size={12} />}
                          </span>
                          <span>
                            {t.title}
                            <small>Tarefa · {labels[String(t.priority)]}</small>
                          </span>
                        </button>
                      ))}
                    {rows("plans")
                      .filter(
                        (p) =>
                          Number(p.weekday) ===
                          new Date(today + "T12:00:00Z").getUTCDay(),
                      )
                      .map((p) => (
                        <div className="check-row" key={p.id}>
                          <Clock3 size={17} />
                          <span>
                            {p.title}
                            <small>
                              Planejado · {p.start}–{p.end}
                            </small>
                          </span>
                        </div>
                      ))}
                    {rows("reviews")
                      .filter((r) => r.reviewDate === today && !r.completed)
                      .map((r) => (
                        <button
                          className="check-row"
                          key={r.id}
                          onClick={() => complete("reviews", r)}
                        >
                          <Repeat2 size={17} />
                          <span>
                            {r.title}
                            <small>Revisão de hoje</small>
                          </span>
                        </button>
                      ))}
                    {rows("habits")
                      .filter((h) => h.active)
                      .slice(0, 3)
                      .map((h) => (
                        <button
                          disabled={busy}
                          className="check-row"
                          key={h.id}
                          onClick={() =>
                            mutate("habit", "habits", {
                              habitId: h.id,
                              date: today,
                            })
                          }
                        >
                          <span
                            className={`checkbox ${rows("habitLogs").some((l) => l.habitId === h.id && l.date === today) ? "checked" : ""}`}
                          >
                            {rows("habitLogs").some(
                              (l) => l.habitId === h.id && l.date === today,
                            ) && <Check size={12} />}
                          </span>
                          <span>
                            {h.title}
                            <small>
                              Hábito{" "}
                              {h.frequency === "WEEKLY" ? "semanal" : "diário"}
                            </small>
                          </span>
                        </button>
                      ))}
                  </div>
                  <button className="panel-link" onClick={() => go("tasks")}>
                    Ver todas as tarefas
                    <ArrowUpRight size={14} />
                  </button>
                </section>
              </div>
              <div className="dashboard-grid lower">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">
                        CONSISTENCY OVER INTENSITY
                      </span>
                      <h2>Seu investimento em tempo</h2>
                    </div>
                    <Badge>30 DIAS</Badge>
                  </div>
                  {chart}
                  <div className="panel-note">
                    {filteredSessions.length
                      ? "Cada sessão registrada conta."
                      : "Comece registrando sua primeira sessão de estudo."}
                  </div>
                </section>
                <section className="panel next-panel">
                  <span className="eyebrow">NEXT MILESTONE</span>
                  <h2>
                    {String(
                      rows("milestones").find((x) => !x.completed)?.title ||
                        "Defina seu próximo marco",
                    )}
                  </h2>
                  <p>
                    {String(
                      rows("milestones").find((x) => !x.completed)?.dueDate ||
                        "Sem prazo definido. Avance no seu ritmo.",
                    )}
                  </p>
                  <Progress
                    label="Meta semanal de estudos"
                    value={m.studyRate}
                  />
                  <div className="between">
                    <small>
                      {minutes(m.studyMinutes)} / {minutes(s.weeklyMinutes)}
                    </small>
                    <b>
                      {m.studyMinutes > s.weeklyMinutes
                        ? "100%+"
                        : format(m.studyRate)}
                    </b>
                  </div>
                  <button onClick={() => go("goals")}>
                    Ver meus objetivos
                    <ArrowUpRight size={15} />
                  </button>
                  <div className="xp">
                    <span>LEVEL {levelFor(m.xp)}</span>
                    <b>{m.xp} XP</b>
                    <Progress
                      value={
                        levelFor(m.xp) === 10
                          ? 100
                          : pct(
                              m.xp - levels[levelFor(m.xp) - 1],
                              levels[levelFor(m.xp)] -
                                levels[levelFor(m.xp) - 1],
                            )
                      }
                    />
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "study" && (
            <>
              <div className="tabs">
                {[
                  ["sessions", "Sessões"],
                  ["courses", "Cursos"],
                  ["modules", "Módulos"],
                  ["lessons", "Aulas"],
                  ["reviews", "Revisões"],
                ].map(([key, title]) => (
                  <button
                    className={tab === key ? "selected" : ""}
                    key={key}
                    onClick={() => {
                      setTab(key);
                      setSearch("");
                      setFilter("Todos");
                    }}
                  >
                    {title}
                  </button>
                ))}
              </div>
              {tab === "courses" && (
                <div className="card-grid">
                  {rows("courses").map((c) => {
                    const mods = rows("modules").filter(
                        (x) => x.courseId === c.id,
                      ),
                      ls = rows("lessons").filter((l) =>
                        mods.some((x) => x.id === l.moduleId),
                      );
                    return (
                      <section className="panel compact" key={c.id}>
                        <BookOpen size={22} />
                        <h3>{c.title}</h3>
                        <p>
                          {mods.length} módulos · {ls.length} aulas
                        </p>
                        <Progress
                          value={pct(
                            ls.filter((l) => l.status === "COMPLETED").length,
                            ls.length,
                          )}
                        />
                        <small>
                          {ls.length
                            ? `${ls.filter((l) => l.status === "COMPLETED").length} aulas concluídas`
                            : "Cadastre os módulos do seu material."}
                        </small>
                      </section>
                    );
                  })}
                </div>
              )}
              {tab === "modules" && (
                <div className="card-grid">
                  {rows("modules").map((mod) => {
                    const ls = rows("lessons").filter(
                      (l) => l.moduleId === mod.id,
                    );
                    return (
                      <section className="panel compact" key={mod.id}>
                        <h3>{mod.title}</h3>
                        <Progress
                          label="Aulas concluídas"
                          value={pct(
                            ls.filter((l) => l.status === "COMPLETED").length,
                            ls.length,
                          )}
                        />
                      </section>
                    );
                  })}
                </div>
              )}
              {tab === "reviews" && (
                <div className="stats">
                  <Stat
                    label="Revisar urgentemente"
                    value={
                      rows("reviews").filter(
                        (r) => !r.completed && String(r.reviewDate) < today,
                      ).length
                    }
                  />
                  <Stat
                    label="Revisar em breve"
                    value={
                      rows("reviews").filter(
                        (r) =>
                          !r.completed &&
                          String(r.reviewDate) >= today &&
                          String(r.reviewDate) <= shift(today, 7),
                      ).length
                    }
                  />
                  <Stat
                    label="Dominado"
                    value={
                      rows("reviews").filter((r) => Number(r.mastery) === 5)
                        .length
                    }
                  />
                </div>
              )}
              {collection(tab)}
            </>
          )}
          {page === "roadmap" && (
            <>
              <div className="callout">
                <Compass size={20} />
                <span>
                  Onde estou → o que estou construindo → meu próximo passo. As
                  idades são referências flexíveis.
                </span>
              </div>
              <div className="timeline">
                {[
                  "Foundation",
                  "Development",
                  "Experience",
                  "Specialization",
                  "Target",
                ].map((phase, i) => (
                  <section
                    className={`timeline-phase ${i === 0 ? "current" : ""}`}
                    key={phase}
                  >
                    <div className="timeline-dot">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="panel">
                      <div className="panel-head">
                        <div>
                          <span className="eyebrow">
                            {
                              [
                                "21 anos",
                                "22 anos",
                                "23 anos",
                                "24 anos",
                                "24–25+ anos",
                              ][i]
                            }
                          </span>
                          <h2>{phase}</h2>
                        </div>
                        {i === 0 && <Badge>ETAPA ATUAL</Badge>}
                      </div>
                      <div className="roadmap-items">
                        {rows("roadmap")
                          .filter((r) => r.phase === phase)
                          .map((r) => (
                            <button
                              className={`roadmap-chip ${r.completed ? "done" : ""}`}
                              key={r.id}
                              onClick={() => complete("roadmap", r)}
                            >
                              <span
                                className={`checkbox ${r.completed ? "checked" : ""}`}
                              >
                                {r.completed && <Check size={12} />}
                              </span>
                              {r.title}
                            </button>
                          ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
              <p className="muted">
                Este roadmap é uma direção, não uma garantia de carreira.
              </p>
            </>
          )}
          {page === "skills" && (
            <>
              <div className="callout">
                <Layers size={20} />
                <span>
                  0 Não iniciado · 1 Básico · 2 Fundamental · 3 Intermediário ·
                  4 Avançado · 5 Domínio
                </span>
              </div>
              <div className="card-grid">
                {m.pillars
                  .filter((p) => p.id !== "experience")
                  .map((p) => (
                    <section className="panel compact" key={p.id}>
                      <div className="between">
                        <h3>{p.name}</h3>
                        <Badge>{format(p.progress)}</Badge>
                      </div>
                      {rows("skills")
                        .filter((k) => k.pillarId === p.id)
                        .map((k) => (
                          <div className="skill-row" key={k.id}>
                            <label htmlFor={k.id}>
                              {k.title}
                              <small>
                                {labels[String(k.importance)]} importância
                              </small>
                            </label>
                            <select
                              id={k.id}
                              value={Number(k.currentLevel)}
                              disabled={busy}
                              onChange={(e) =>
                                saveRow("skills", k, {
                                  currentLevel: Number(e.target.value),
                                  status:
                                    Number(e.target.value) === 5
                                      ? "MASTERED"
                                      : Number(e.target.value) > 0
                                        ? "IN_PROGRESS"
                                        : "NOT_STARTED",
                                })
                              }
                            >
                              {[0, 1, 2, 3, 4, 5].map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                    </section>
                  ))}
              </div>
              <details className="panel compact">
                <summary>Trilha de Excel e Financial Modeling</summary>
                <p>
                  Basics: referências, formatação, filtros, tabelas, gráficos e
                  organização.
                </p>
                <p>
                  Intermediate: SOMA, MÉDIA, SE, SEERRO, SOMASE, SOMASES,
                  CONT.SE, CONT.SES, PROCX, ÍNDICE, CORRESP, tabelas dinâmicas e
                  Power Query.
                </p>
                <p>
                  Finance Excel: DRE, Balanço, Fluxo de Caixa, indicadores,
                  projeções e cenários.
                </p>
                <p>
                  Financial Modeling: projeções, DCF, WACC, valuation,
                  sensitivities e múltiplos.
                </p>
                <button onClick={() => add("skills")}>
                  Adicionar skill à trilha
                </button>
              </details>
              {collection("skills")}
            </>
          )}
          {page === "projects" && (
            <>
              {collection("projects")}
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">PROFESSIONAL PORTFOLIO</span>
                    <h2>Projetos concluídos</h2>
                  </div>
                </div>
                {rows("projects").some((p) => p.status === "COMPLETED") ? (
                  <div className="card-grid padded">
                    {rows("projects")
                      .filter((p) => p.status === "COMPLETED")
                      .map((p) => (
                        <article className="portfolio-card" key={p.id}>
                          <Badge>{p.category}</Badge>
                          <h3>{p.title}</h3>
                          <p>{p.description}</p>
                          <p>{p.result}</p>
                          {(p.repositoryUrl || p.fileUrl) && (
                            <a
                              href={String(p.repositoryUrl || p.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir projeto
                              <ArrowUpRight size={15} />
                            </a>
                          )}
                        </article>
                      ))}
                  </div>
                ) : (
                  <Empty text="Conclua seu primeiro projeto financeiro para construir seu portfólio." />
                )}
              </section>
            </>
          )}
          {page === "contacts" && (
            <>
              <div className="stats">
                <Stat label="Contatos totais" value={m.contacts} />
                <Stat label="Novos neste mês" value={m.newContacts} />
                <Stat label="Follow-ups pendentes" value={m.followUps} />
                <Stat label="Empresas conectadas" value={m.companies} />
              </div>
              {collection("contacts")}
              {collection("interactions")}
              <p className="muted">
                {m.activeNetworking} contatos ativos. Quantidade não significa
                qualidade de networking.
              </p>
            </>
          )}
          {page === "opportunities" && (
            <>
              <div className="stats">
                <Stat label="Candidaturas" value={m.applications} />
                <Stat label="Entrevistas" value={m.interviews} />
                <Stat
                  label="Conversão"
                  value={m.conversion === null ? "—" : format(m.conversion)}
                />
                <Stat
                  label="Aprovação"
                  value={m.acceptance === null ? "—" : format(m.acceptance)}
                />
              </div>
              <div className="kanban">
                {definitions.opportunities.fields
                  .find((f) => f.key === "status")!
                  .options!.map((status) => (
                    <section className="kanban-column" key={status}>
                      <h3>
                        {labels[status]}
                        <Badge>
                          {
                            rows("opportunities").filter(
                              (r) => r.status === status && !r.archived,
                            ).length
                          }
                        </Badge>
                      </h3>
                      {rows("opportunities")
                        .filter((r) => r.status === status && !r.archived)
                        .map((r) => (
                          <article className="kanban-card" key={r.id}>
                            <small>{r.company}</small>
                            <button
                              className="text-button"
                              onClick={() =>
                                setModal({ kind: "opportunities", row: r })
                              }
                            >
                              {r.title}
                            </button>
                            <small>{r.deadline || "Sem prazo"}</small>
                            <select
                              aria-label={`Status de ${r.title}`}
                              value={String(r.status)}
                              onChange={(e) =>
                                saveRow("opportunities", r, {
                                  status: e.target.value,
                                })
                              }
                            >
                              {definitions.opportunities.fields
                                .find((f) => f.key === "status")!
                                .options!.map((o) => (
                                  <option value={o} key={o}>
                                    {labels[o]}
                                  </option>
                                ))}
                            </select>
                          </article>
                        ))}
                    </section>
                  ))}
              </div>
              {collection("opportunities")}
            </>
          )}
          {page === "plans" && (
            <>
              <div className="planner">
                {["1", "2", "3", "4", "5", "6", "0"].map((d) => (
                  <section className="planner-day" key={d}>
                    <h3>{labels[d]}</h3>
                    {Number(d) > 0 && Number(d) < 6 && (
                      <>
                        <div className="routine">
                          08:00–16:00 <b>Trabalho</b>
                        </div>
                        <div className="routine">
                          18:00–21:00 <b>Faculdade</b>
                        </div>
                      </>
                    )}
                    {rows("plans")
                      .filter((p) => p.weekday === d)
                      .sort((a, b) =>
                        String(a.start).localeCompare(String(b.start)),
                      )
                      .map((p) => (
                        <button
                          className="plan-block"
                          key={p.id}
                          onClick={() => setModal({ kind: "plans", row: p })}
                        >
                          <small>
                            {p.start}–{p.end}
                          </small>
                          <b>{p.title}</b>
                        </button>
                      ))}
                  </section>
                ))}
              </div>
              {collection("plans")}
            </>
          )}
          {page === "goals" && (
            <>
              <div className="card-grid">
                {["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"].map((cat) => (
                  <section className="panel compact" key={cat}>
                    <span className="eyebrow">{labels[cat]}</span>
                    {rows("goals")
                      .filter(
                        (g) => g.category === cat && g.status !== "CANCELLED",
                      )
                      .map((g) => (
                        <article className="goal-card" key={g.id}>
                          <button
                            className="text-button"
                            onClick={() => setModal({ kind: "goals", row: g })}
                          >
                            <h3>{g.title}</h3>
                          </button>
                          <Progress
                            value={goalProgress(g, rows("milestones"))}
                          />
                          <small>
                            {format(goalProgress(g, rows("milestones")))} ·{" "}
                            {g.deadline || "No seu ritmo"}
                          </small>
                          {rows("milestones")
                            .filter((x) => x.goalId === g.id)
                            .sort((a, b) => Number(a.order) - Number(b.order))
                            .map((ms) => (
                              <label className="check-row" key={ms.id}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(ms.completed)}
                                  onChange={() => complete("milestones", ms)}
                                />
                                {ms.title}
                              </label>
                            ))}
                        </article>
                      ))}
                  </section>
                ))}
              </div>
              {collection("goals")}
              {collection("milestones")}
              <div className="panel compact">
                <h2>Conquistas profissionais</h2>
                <div className="achievements">
                  {m.achievements.map((a) => (
                    <div className={a.done ? "unlocked" : ""} key={a.name}>
                      <FileCheck2 size={20} />
                      <span>
                        {a.name}
                        <small>
                          {a.done ? "Desbloqueado" : "Em construção"}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {page === "habits" && (
            <>
              <div className="panel compact">
                <div className="panel-head">
                  <h2>Seu calendário de consistência</h2>
                  <button onClick={() => add("habits")}>
                    <Plus size={16} /> Novo hábito
                  </button>
                </div>
                {rows("habits")
                  .filter((h) => h.active)
                  .map((h) => {
                    const hm = habitMetrics(h, rows("habitLogs"), today);
                    return (
                      <div className="habit-row" key={h.id}>
                        <div>
                          <h3>{h.title}</h3>
                          <small>
                            {hm.streak}{" "}
                            {h.frequency === "WEEKLY" ? "semanas" : "dias"} ·
                            melhor {hm.best} · {format(hm.rate)}
                          </small>
                        </div>
                        <div className="habit-calendar">
                          {Array.from({ length: 28 }, (_, i) =>
                            shift(today, i - 27),
                          ).map((d) => (
                            <span
                              key={d}
                              title={d}
                              className={
                                rows("habitLogs").some(
                                  (l) => l.habitId === h.id && l.date === d,
                                )
                                  ? "filled"
                                  : d < String(h.createdAt).slice(0, 10)
                                    ? "ineligible"
                                    : ""
                              }
                            />
                          ))}
                        </div>
                        <button
                          disabled={busy}
                          className={
                            rows("habitLogs").some(
                              (l) => l.habitId === h.id && l.date === today,
                            )
                              ? "primary"
                              : "secondary"
                          }
                          onClick={() =>
                            mutate("habit", "habits", {
                              habitId: h.id,
                              date: today,
                            })
                          }
                        >
                          <Check size={15} /> Hoje
                        </button>
                      </div>
                    );
                  })}
              </div>
              {collection("habits")}
            </>
          )}
          {page === "analytics" && (
            <>
              <div className="stats">
                <Stat
                  label="Horas no período"
                  value={minutes(sum(filteredSessions, "durationMinutes"))}
                />
                <Stat
                  label="Execução desta semana"
                  value={format(m.weeklyExecution)}
                  detail="40% tarefas · 40% estudo · 20% hábitos"
                />
                <Stat
                  label="Skills adquiridas"
                  value={
                    rows("skills").filter(
                      (k) => Number(k.currentLevel) >= Number(k.targetLevel),
                    ).length
                  }
                  detail="Nível atual atingiu o alvo"
                />
                <Stat
                  label="Projetos concluídos"
                  value={
                    rows("projects").filter(
                      (p) =>
                        p.status === "COMPLETED" &&
                        String(p.completedAt) >= periodStart &&
                        String(p.completedAt) <= today,
                    ).length
                  }
                />
              </div>
              <div className="panel compact">
                <h2>Tempo estudado por dia</h2>
                {chart}
              </div>
              <div className="dashboard-grid">
                <section className="panel compact">
                  <h2>Horas por área</h2>
                  {m.pillars.map((p) => (
                    <div className="analytics-row" key={p.id}>
                      <div className="between">
                        <span>{p.name}</span>
                        <b>
                          {minutes(
                            sum(
                              filteredSessions.filter(
                                (r) => r.pillarId === p.id,
                              ),
                              "durationMinutes",
                            ),
                          )}
                        </b>
                      </div>
                      <Progress
                        value={pct(
                          sum(
                            filteredSessions.filter((r) => r.pillarId === p.id),
                            "durationMinutes",
                          ),
                          sum(filteredSessions, "durationMinutes"),
                        )}
                      />
                    </div>
                  ))}
                </section>
                <section className="panel compact">
                  <h2>Evolução dos pilares</h2>
                  {rows("snapshots").filter(
                    (r) => String(r.date) >= periodStart,
                  ).length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart
                        data={rows("snapshots")
                          .filter((r) => String(r.date) >= periodStart)
                          .sort((a, b) =>
                            String(a.date).localeCompare(String(b.date)),
                          )}
                      >
                        <XAxis dataKey="date" fontSize={10} />
                        <YAxis domain={[0, 100]} fontSize={10} />
                        <Tooltip />
                        <Legend />
                        {m.pillars.map((p, i) => (
                          <Area
                            key={p.id}
                            type="monotone"
                            dataKey={p.id}
                            name={p.name}
                            stroke={
                              [
                                "#487d9c",
                                "#38a18a",
                                "#d2a663",
                                "#8b80ba",
                                "#889194",
                              ][i]
                            }
                            fill="transparent"
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty text="O histórico começa com suas primeiras alterações. Nenhum progresso anterior é presumido." />
                  )}
                </section>
              </div>
              <div className="card-grid">
                <section className="panel compact">
                  <h3>Projetos por status</h3>
                  {definitions.projects.fields
                    .find((f) => f.key === "status")!
                    .options!.map((st) => (
                      <div className="analytics-row between" key={st}>
                        <span>{labels[st]}</span>
                        <b>
                          {
                            rows("projects").filter(
                              (p) =>
                                p.status === st &&
                                String(p.createdAt).slice(0, 10) >= periodStart,
                            ).length
                          }
                        </b>
                      </div>
                    ))}
                </section>
                <section className="panel compact">
                  <h3>Networking por mês</h3>
                  {[
                    ...new Set(
                      rows("contacts")
                        .filter(
                          (c) =>
                            String(c.firstContactDate) >= periodStart &&
                            String(c.firstContactDate) <= today,
                        )
                        .map((c) => String(c.firstContactDate).slice(0, 7)),
                    ),
                  ]
                    .sort()
                    .map((month) => (
                      <div className="analytics-row between" key={month}>
                        <span>{month}</span>
                        <b>
                          {
                            rows("contacts").filter((c) =>
                              String(c.firstContactDate).startsWith(month),
                            ).length
                          }
                        </b>
                      </div>
                    ))}
                  {!rows("contacts").length && (
                    <p>Adicione seu primeiro contato profissional.</p>
                  )}
                </section>
                <section className="panel compact">
                  <h3>Oportunidades no período</h3>
                  {definitions.opportunities.fields
                    .find((f) => f.key === "status")!
                    .options!.map((st) => (
                      <div className="analytics-row between" key={st}>
                        <span>{labels[st]}</span>
                        <b>
                          {
                            rows("opportunities").filter(
                              (o) =>
                                o.status === st &&
                                String(o.createdAt).slice(0, 10) >=
                                  periodStart &&
                                !o.archived,
                            ).length
                          }
                        </b>
                      </div>
                    ))}
                </section>
              </div>
            </>
          )}
          {page === "profile" && (
            <>
              <div className="profile-hero panel compact">
                <span className="large-avatar">{s.name.slice(0, 1)}</span>
                <div>
                  <h2>{s.name}</h2>
                  <p>
                    Administração · {s.currentSemester}º semestre · {s.age} anos
                  </p>
                  <Badge>Working + College</Badge>
                </div>
                <button onClick={() => go("settings")}>Editar perfil</button>
              </div>
              <div className="dashboard-grid">
                <section className="panel compact">
                  <h2>LinkedIn Profile</h2>
                  <Progress
                    label="Completude do perfil"
                    value={pct(
                      rows("profile").filter((r) => r.completed).length,
                      rows("profile").length,
                    )}
                  />
                  {rows("profile").map((r) => (
                    <label className="check-row" key={r.id}>
                      <input
                        type="checkbox"
                        checked={Boolean(r.completed)}
                        onChange={() => complete("profile", r)}
                      />
                      {r.title}
                    </label>
                  ))}
                  <button onClick={() => add("tasks")}>
                    Criar tarefa para melhorar perfil
                  </button>
                </section>
                <section className="panel compact">
                  <h2>Experiência e inglês</h2>
                  <p>
                    O trabalho atual não é classificado automaticamente como
                    experiência financeira.
                  </p>
                  <label>
                    Experiência
                    <select
                      value={s.experienceLevel}
                      onChange={(e) =>
                        mutate("settings", "settings", {
                          ...s,
                          experienceLevel: Number(e.target.value),
                        })
                      }
                    >
                      {[
                        "Nenhuma relevante registrada",
                        "Profissional geral",
                        "Administrativa / financeira",
                        "Estágio em finanças",
                        "Mercado financeiro",
                        "Diretamente ligada ao objetivo",
                      ].map((x, i) => (
                        <option value={i} key={x}>
                          {i} — {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Inglês registrado
                    <select
                      value={s.englishLevel}
                      onChange={(e) =>
                        mutate("settings", "settings", {
                          ...s,
                          englishLevel: Number(e.target.value),
                        })
                      }
                    >
                      {[
                        "Não registrado",
                        "Básico",
                        "Fundamental",
                        "Intermediário",
                        "Avançado",
                        "Domínio",
                      ].map((x, i) => (
                        <option value={i} key={x}>
                          {i} — {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p>
                    Esses níveis são autoavaliados e não representam
                    certificação.
                  </p>
                </section>
              </div>
              {collection("certifications")}
            </>
          )}
          {page === "settings" && (
            <SettingsForm
              settings={s}
              busy={busy}
              save={(v) => mutate("settings", "settings", v)}
              exportData={() => {
                const blob = new Blob(
                  [
                    JSON.stringify(
                      {
                        version: 1,
                        exportedAt: new Date().toISOString(),
                        settings: s,
                        data,
                      },
                      null,
                      2,
                    ),
                  ],
                  { type: "application/json" },
                );
                const url = URL.createObjectURL(blob),
                  a = document.createElement("a");
                a.href = url;
                a.download = `career-os-${today}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              logout={async () => {
                await fetch("/api/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "logout" }),
                });
                setState(null);
                setAuth({ initialized: true, authenticated: false });
              }}
            />
          )}
          {page === "inspector" && (
            <>
              <div className="callout">
                <ShieldCheck size={20} />
                <span>
                  Dados → métricas → metas. Cada número tem uma origem.
                  Calculado agora, em {s.timezone}.
                </span>
              </div>
              <section className="panel compact">
                <h2>Career Progress — {format(m.careerProgress)}</h2>
                <p>
                  Σ (progresso do pilar × peso / 100). Cada pilar usa skills
                  (peso 60), cursos (25) e projetos vinculados (15),
                  normalizados pelos grupos existentes. Experience inclui o
                  nível registrado (60).
                </p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Pilar</th>
                        <th>Componentes reais</th>
                        <th>Progresso</th>
                        <th>Peso</th>
                        <th>Contribuição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.pillars.map((p) => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>
                            {p.parts
                              .map(
                                (x) =>
                                  `${x.label}: ${x.value.toFixed(2)} (peso ${x.weight})`,
                              )
                              .join(" · ") || "Sem componentes"}
                          </td>
                          <td>{p.progress.toFixed(2)}</td>
                          <td>{p.weight}%</td>
                          <td>{((p.progress * p.weight) / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel compact">
                <h2>Readiness — {format(m.readiness)}</h2>
                <p>
                  Indicador independente. Skills ponderadas por importância
                  (1/2/3); projetos relevantes concluídos ÷ 5; níveis ÷ 5;
                  networking por faixas; checklist do perfil.
                </p>
                {m.readinessComponents.map((c) => (
                  <div className="analytics-row between" key={c.name}>
                    <span>{c.name}</span>
                    <code>
                      {c.value.toFixed(2)} × {c.weight}% ={" "}
                      {((c.value * c.weight) / 100).toFixed(2)}
                    </code>
                  </div>
                ))}
              </section>
              <section className="panel compact">
                <h2>Execução e consistência</h2>
                <p>
                  Tarefas: {m.tasksDone} / {m.tasksTotal} = {format(m.taskRate)}
                  . Canceladas excluídas; prazo dentro da semana de segunda a
                  domingo.
                </p>
                <p>
                  Estudos: {m.studyMinutes} / {s.weeklyMinutes} min ={" "}
                  {format(m.studyRate)}. Check-ins não duplicam horas. Aula
                  concluída gera apenas uma sessão.
                </p>
                <p>
                  Hábitos: média de conclusão na semana = {format(m.habitRate)}.
                  Períodos anteriores à criação excluídos.
                </p>
                <p>
                  Weekly Execution: {m.taskRate.toFixed(2)} × 0,4 +{" "}
                  {m.studyRate.toFixed(2)} × 0,4 + {m.habitRate.toFixed(2)} ×
                  0,2 = {format(m.weeklyExecution)}.
                </p>
                <p>
                  Comparação: ({m.studyMinutes} − {m.previousMinutes}) /{" "}
                  {m.previousMinutes || "0 → New"} × 100. Mesmos dias da semana
                  anterior.
                </p>
                <p>
                  Streak: {m.streak} dias consecutivos de estudo, tarefas ou
                  hábitos; hoje ainda aberto não quebra a sequência.
                </p>
                <p>
                  Networking relevante:{" "}
                  {
                    rows("contacts").filter(
                      (c) => c.relevant && c.status !== "ARCHIVED",
                    ).length
                  }
                  . Quantidade não mede a qualidade das relações.
                </p>
                <p>
                  Conversão: {m.interviews} / {m.applications || "0 → —"};
                  aprovação: {m.accepted} / {m.applications || "0 → —"}.
                </p>
                <p>
                  XP: {m.xp}. Nível: {levelFor(m.xp)}. Eventos únicos; editar ou
                  reabrir e concluir o mesmo item não concede XP novamente.
                </p>
                <small>
                  Última alteração:{" "}
                  {rows("snapshots")
                    .map((r) => String(r.updatedAt))
                    .sort()
                    .at(-1) || "Nenhuma atividade registrada"}
                </small>
              </section>
              <section className="panel compact">
                <h2>Livro de XP</h2>
                {rows("xp").length ? (
                  rows("xp").map((x) => (
                    <div className="analytics-row between" key={x.id}>
                      <code>{x.title}</code>
                      <b>+{x.amount} XP</b>
                    </div>
                  ))
                ) : (
                  <p>Sem eventos ainda.</p>
                )}
              </section>
            </>
          )}
          {["tasks", "checkins", "reviews"].includes(page) &&
            collection(visibleKind)}
          <footer className="footer">
            <span>FINANCE CAREER OS</span>
            <span>Não tenho pressa. Tenho direção.</span>
            <button className="text-button" onClick={() => go("inspector")}>
              Métricas transparentes
              <ShieldCheck size={13} />
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {modal && (
        <Modal
          title={`${modal.row ? "Editar" : "Adicionar"} ${definitions[modal.kind].singular}`}
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <RecordForm
            key={modal.row?.id || modal.kind}
            kind={modal.kind}
            row={modal.row}
            data={data}
            today={today}
            busy={busy}
            error={error}
            submit={async (values) => {
              if (await mutate("save", modal.kind, values, modal.row?.id))
                setModal(null);
            }}
          />
        </Modal>
      )}
      {!s.onboarding && (
        <Modal title="Sua carreira começa com direção" onClose={() => {}}>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Onboarding
            step={onboardingStep}
            settings={s}
            busy={busy}
            next={() => setOnboardingStep((n) => n + 1)}
            back={() => setOnboardingStep((n) => Math.max(0, n - 1))}
            finish={(v) =>
              mutate("settings", "settings", { ...v, onboarding: true })
            }
          />
        </Modal>
      )}
    </div>
  );
}

function RecordForm({
  kind,
  row,
  data,
  today,
  busy,
  error,
  submit,
}: {
  kind: string;
  row?: Row;
  data: Data;
  today: string;
  busy: boolean;
  error: string;
  submit: (values: Record<string, Value>) => Promise<void>;
}) {
  const def = definitions[kind];
  const [values, setValues] = useState<Record<string, Value>>(() =>
    Object.fromEntries(
      def.fields.map((f) => [
        f.key,
        row?.[f.key] ??
          f.default ??
          (f.type === "checkbox"
            ? false
            : f.type === "number"
              ? (f.min ?? 0)
              : f.type === "date" && f.required
                ? today
                : (f.options?.[0] ?? "")),
      ]),
    ),
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(values);
      }}
    >
      <div className="form-grid">
        {def.fields.map((f) => (
          <label
            key={f.key}
            className={
              f.type === "textarea"
                ? "full"
                : f.type === "checkbox"
                  ? "check-label"
                  : ""
            }
          >
            {f.type === "checkbox" ? (
              <>
                <input
                  type="checkbox"
                  checked={Boolean(values[f.key])}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.checked })
                  }
                />
                {f.label}
              </>
            ) : (
              <>
                {f.label}
                {f.required ? " *" : ""}
                {f.type === "select" ? (
                  <select
                    required={f.required}
                    value={String(values[f.key])}
                    onChange={(e) =>
                      setValues({ ...values, [f.key]: e.target.value })
                    }
                  >
                    {f.relation && <option value="">Selecione…</option>}
                    {f.relation
                      ? (data[f.relation] || []).map((r) => (
                          <option value={r.id} key={r.id}>
                            {r.title}
                          </option>
                        ))
                      : f.options?.map((o) => (
                          <option value={o} key={o}>
                            {labels[o] || o}
                          </option>
                        ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={String(values[f.key])}
                    onChange={(e) =>
                      setValues({ ...values, [f.key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    type={f.type || "text"}
                    required={f.required}
                    min={f.min}
                    max={f.max}
                    value={String(values[f.key])}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [f.key]:
                          f.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}
              </>
            )}
          </label>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-footer">
        <small>* Campos obrigatórios</small>
        <button className="primary" disabled={busy}>
          {busy ? "Salvando…" : "Salvar registro"}
        </button>
      </div>
    </form>
  );
}
function SettingsForm({
  settings,
  busy,
  save,
  exportData,
  logout,
}: {
  settings: Settings;
  busy: boolean;
  save: (v: Settings) => Promise<boolean>;
  exportData: () => void;
  logout: () => void;
}) {
  const [s, set] = useState(settings);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(s);
      }}
    >
      <section className="panel compact">
        <h2>Perfil e rotina</h2>
        <div className="form-grid">
          {[
            ["name", "Nome"],
            ["email", "E-mail"],
            ["age", "Idade"],
            ["currentSemester", "Semestre"],
            ["careerGoal", "Objetivo principal"],
            ["interests", "Áreas de interesse"],
            ["timezone", "Fuso horário"],
            ["studyStart", "Início de estudos"],
            ["studyEnd", "Fim de estudos"],
            ["weeklyMinutes", "Meta semanal (minutos)"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type={
                  ["age", "currentSemester", "weeklyMinutes"].includes(key)
                    ? "number"
                    : ["studyStart", "studyEnd"].includes(key)
                      ? "time"
                      : key === "email"
                        ? "email"
                        : "text"
                }
                value={String(s[key as keyof Settings])}
                onChange={(e) =>
                  set({
                    ...s,
                    [key]: ["age", "currentSemester", "weeklyMinutes"].includes(
                      key,
                    )
                      ? Number(e.target.value)
                      : e.target.value,
                  })
                }
              />
            </label>
          ))}
          <label>
            Tema
            <select
              value={s.theme}
              onChange={(e) =>
                set({ ...s, theme: e.target.value as Settings["theme"] })
              }
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={s.notifications}
              onChange={(e) => set({ ...s, notifications: e.target.checked })}
            />
            Notificações internas
          </label>
        </div>
      </section>
      <section className="panel compact">
        <h2>Pesos dos pilares</h2>
        <p>
          A soma deve ser exatamente 100%. Os cinco pilares permanecem ativos.
        </p>
        <div className="weights">
          {[
            "College",
            "English",
            "Finance",
            "Technical Skills",
            "Experience",
          ].map((name, i) => (
            <label key={name}>
              {name}
              <input
                type="number"
                min={0}
                max={100}
                value={s.pillarWeights[i]}
                onChange={(e) =>
                  set({
                    ...s,
                    pillarWeights: s.pillarWeights.map((v, j) =>
                      i === j ? Number(e.target.value) : v,
                    ),
                  })
                }
              />
            </label>
          ))}
        </div>
        <b>Total: {s.pillarWeights.reduce((a, b) => a + b, 0)}%</b>
      </section>
      <section className="panel compact">
        <h2>Pesos de Career Readiness</h2>
        <div className="weights">
          {[
            "Technical Knowledge",
            "English",
            "Excel / Modeling",
            "Projects",
            "Experience",
            "Networking",
            "Professional Profile",
          ].map((name, i) => (
            <label key={name}>
              {name}
              <input
                type="number"
                min={0}
                max={100}
                value={s.readinessWeights[i]}
                onChange={(e) =>
                  set({
                    ...s,
                    readinessWeights: s.readinessWeights.map((v, j) =>
                      i === j ? Number(e.target.value) : v,
                    ),
                  })
                }
              />
            </label>
          ))}
        </div>
        <b>Total: {s.readinessWeights.reduce((a, b) => a + b, 0)}%</b>
      </section>
      <div className="settings-actions">
        <button className="primary" disabled={busy}>
          Salvar configurações
        </button>
        <button type="button" onClick={exportData}>
          <Download size={16} />
          Exportar dados JSON
        </button>
        <button type="button" onClick={logout}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
      <p className="muted">
        Para backup restaurável, copie o banco SQLite com o servidor parado.
        Instruções no README.
      </p>
    </form>
  );
}
function Onboarding({
  step,
  settings,
  busy,
  next,
  back,
  finish,
}: {
  step: number;
  settings: Settings;
  busy: boolean;
  next: () => void;
  back: () => void;
  finish: (s: Settings) => Promise<boolean>;
}) {
  const [s, set] = useState(settings);
  return (
    <div className="onboarding">
      <span className="eyebrow">PASSO {step + 1} DE 5</span>
      <Progress value={(step + 1) * 20} />
      {step === 0 ? (
        <>
          <h2>Qual é a sua direção?</h2>
          <label>
            Seu nome
            <input
              value={s.name}
              onChange={(e) => set({ ...s, name: e.target.value })}
            />
          </label>
          <label>
            Objetivo
            <input
              value={s.careerGoal}
              onChange={(e) => set({ ...s, careerGoal: e.target.value })}
            />
          </label>
        </>
      ) : step === 1 ? (
        <>
          <h2>Onde você está hoje?</h2>
          <p>Administração · trabalhando + faculdade</p>
          <label>
            Semestre
            <input
              type="number"
              min="1"
              max="20"
              value={s.currentSemester}
              onChange={(e) =>
                set({ ...s, currentSemester: Number(e.target.value) })
              }
            />
          </label>
        </>
      ) : step === 2 ? (
        <>
          <h2>Um ritmo que cabe na sua vida.</h2>
          <label>
            Início
            <input
              type="time"
              value={s.studyStart}
              onChange={(e) => set({ ...s, studyStart: e.target.value })}
            />
          </label>
          <label>
            Fim
            <input
              type="time"
              value={s.studyEnd}
              onChange={(e) => set({ ...s, studyEnd: e.target.value })}
            />
          </label>
          <label>
            Meta semanal em minutos
            <input
              type="number"
              min="1"
              value={s.weeklyMinutes}
              onChange={(e) =>
                set({ ...s, weeklyMinutes: Number(e.target.value) })
              }
            />
          </label>
        </>
      ) : step === 3 ? (
        <>
          <h2>Cinco pilares. Uma direção.</h2>
          <p>College, English, Finance, Technical Skills e Experience.</p>
          <label>
            Interesses secundários
            <input
              value={s.interests}
              onChange={(e) => set({ ...s, interests: e.target.value })}
            />
          </label>
          <p>Os níveis começam em zero até você registrar suas competências.</p>
        </>
      ) : (
        <>
          <h2>Your Career OS is ready.</h2>
          <p>Foundation → Development → Experience → Specialization → Target</p>
          <p>Seu roadmap é flexível. Escolha um próximo passo, não vinte.</p>
        </>
      )}
      <div className="form-footer">
        <button onClick={back} disabled={step === 0 || busy}>
          Voltar
        </button>
        <button
          className="primary"
          disabled={busy}
          onClick={() => (step < 4 ? next() : finish(s))}
        >
          {step === 4 ? "Começar minha trajetória" : "Continuar"}
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}
