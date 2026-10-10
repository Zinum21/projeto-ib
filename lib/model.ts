import { z } from "zod";

export type Value = string | number | boolean;
export type Row = {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: Value;
};
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "time"
    | "datetime-local"
    | "select"
    | "checkbox"
    | "url";
  required?: boolean;
  options?: string[];
  relation?: string;
  min?: number;
  max?: number;
  default?: Value;
};
export type Definition = {
  title: string;
  singular: string;
  description: string;
  fields: Field[];
  columns: string[];
};
const field = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const title = field("title", "Título", "text", { required: true });
const pillar = field("pillarId", "Pilar", "select", { relation: "pillars" });
const notes = field("notes", "Observações", "textarea");
const priority = field("priority", "Prioridade", "select", {
  options: ["LOW", "MEDIUM", "HIGH"],
  default: "MEDIUM",
});
const status = (options: string[], initial = options[0]) =>
  field("status", "Status", "select", { options, default: initial });
export const definitions: Record<string, Definition> = {
  pillars: {
    title: "Career Pillars",
    singular: "pilar",
    description: "Os cinco pilares que sustentam a sua direção.",
    columns: ["title", "weight", "active"],
    fields: [
      title,
      field("description", "Descrição", "textarea"),
      field("weight", "Peso (%)", "number", { min: 0, max: 100 }),
      field("active", "Ativo", "checkbox", { default: true }),
    ],
  },
  skills: {
    title: "Technical Skills",
    singular: "skill",
    description:
      "Registre o domínio que você já demonstrou. Estudar não aumenta seu nível automaticamente.",
    columns: ["title", "pillarId", "currentLevel", "importance"],
    fields: [
      title,
      { ...pillar, required: true },
      field("currentLevel", "Nível atual (0–5)", "number", {
        min: 0,
        max: 5,
        default: 0,
      }),
      field("targetLevel", "Nível alvo (0–5)", "number", {
        min: 0,
        max: 5,
        default: 5,
      }),
      field("importance", "Importância", "select", {
        options: ["LOW", "MEDIUM", "HIGH"],
        default: "HIGH",
      }),
      status(["NOT_STARTED", "IN_PROGRESS", "MASTERED"]),
      field("stage", "Etapa", "select", {
        options: [
          "Basics",
          "Intermediate",
          "Finance Excel",
          "Financial Modeling",
          "Other",
        ],
        default: "Other",
      }),
      field("projectId", "Projeto relacionado", "select", {
        relation: "projects",
      }),
      notes,
    ],
  },
  courses: {
    title: "Cursos",
    singular: "curso",
    description:
      "Inglês e Escola do Investidor. Cadastre o conteúdo real do seu curso.",
    columns: ["title", "pillarId"],
    fields: [title, { ...pillar, required: true }, notes],
  },
  modules: {
    title: "Módulos",
    singular: "módulo",
    description:
      "Nenhum módulo oficial é presumido. Inclua os nomes do seu material.",
    columns: ["title", "courseId"],
    fields: [
      title,
      field("courseId", "Curso", "select", {
        required: true,
        relation: "courses",
      }),
      notes,
    ],
  },
  lessons: {
    title: "Aulas",
    singular: "aula",
    description:
      "Concluir uma aula registra uma única sessão e atualiza horas, XP e curso.",
    columns: ["title", "moduleId", "status", "durationMinutes", "completedAt"],
    fields: [
      title,
      field("moduleId", "Módulo", "select", {
        required: true,
        relation: "modules",
      }),
      field("subject", "Matéria"),
      field("durationMinutes", "Duração (min)", "number", {
        min: 1,
        max: 1440,
        required: true,
        default: 30,
      }),
      priority,
      status(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "REVIEW"]),
      field("date", "Data planejada", "date"),
      field("completedAt", "Data de conclusão", "date"),
      field("personalGrade", "Nota pessoal (0–10)", "number", {
        min: 0,
        max: 10,
      }),
      field("difficulty", "Dificuldade", "select", {
        options: ["EASY", "MEDIUM", "HARD"],
        default: "MEDIUM",
      }),
      field("needsReview", "Revisão necessária", "checkbox"),
      notes,
    ],
  },
  sessions: {
    title: "Sessões de estudo",
    singular: "sessão",
    description:
      "Registre início e fim ou apenas a duração. Os totais são calculados.",
    columns: ["title", "pillarId", "date", "durationMinutes"],
    fields: [
      title,
      { ...pillar, required: true },
      field("date", "Data", "date", { required: true }),
      field("startTime", "Início", "datetime-local"),
      field("endTime", "Fim", "datetime-local"),
      field("durationMinutes", "Duração (min)", "number", {
        min: 1,
        max: 1440,
        default: 45,
      }),
      notes,
    ],
  },
  tasks: {
    title: "Tarefas",
    singular: "tarefa",
    description: "Um próximo passo de cada vez.",
    columns: ["title", "pillarId", "dueDate", "priority", "status"],
    fields: [
      title,
      pillar,
      field("description", "Descrição", "textarea"),
      priority,
      field("dueDate", "Prazo", "date", { required: true }),
      status(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
    ],
  },
  projects: {
    title: "Project Portfolio",
    singular: "projeto",
    description: "Transforme conhecimento em evidência concreta.",
    columns: ["title", "company", "category", "status", "progress"],
    fields: [
      title,
      field("company", "Empresa analisada"),
      field("category", "Categoria", "select", {
        options: [
          "Fundamental Analysis",
          "Financial Statements",
          "DCF",
          "Valuation",
          "Financial Modeling",
          "Finance Excel",
          "Other",
        ],
      }),
      pillar,
      field("description", "Descrição", "textarea"),
      status(["IDEA", "PLANNED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]),
      field("progress", "Progresso (%)", "number", {
        min: 0,
        max: 100,
        default: 0,
      }),
      field("startDate", "Início", "date"),
      field("dueDate", "Prazo", "date"),
      field("repositoryUrl", "Repositório", "url"),
      field("fileUrl", "Arquivo / link", "url"),
      field("skillsUsed", "Skills utilizadas"),
      field("result", "Resultado", "textarea"),
      notes,
    ],
  },
  goals: {
    title: "Goals",
    singular: "objetivo",
    description: "Objetivos de longo prazo são direção, não tarefas urgentes.",
    columns: ["title", "category", "deadline", "status", "progress"],
    fields: [
      title,
      pillar,
      field("category", "Horizonte", "select", {
        options: ["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"],
      }),
      priority,
      field("startDate", "Início", "date"),
      field("deadline", "Prazo", "date"),
      field("progress", "Progresso manual (sem milestones)", "number", {
        min: 0,
        max: 100,
        default: 0,
      }),
      status(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
    ],
  },
  milestones: {
    title: "Milestones",
    singular: "milestone",
    description:
      "O progresso de metas com etapas é calculado pelas etapas concluídas.",
    columns: ["title", "goalId", "completed", "dueDate"],
    fields: [
      title,
      field("goalId", "Objetivo", "select", {
        required: true,
        relation: "goals",
      }),
      field("order", "Ordem", "number", { min: 0, default: 0 }),
      field("dueDate", "Prazo", "date"),
      field("completed", "Concluído", "checkbox"),
    ],
  },
  habits: {
    title: "Habits",
    singular: "hábito",
    description: "Consistência sustentável, respeitando o seu ritmo.",
    columns: ["title", "frequency", "active"],
    fields: [
      title,
      field("frequency", "Frequência", "select", {
        options: ["DAILY", "WEEKLY"],
        default: "DAILY",
      }),
      field("active", "Ativo", "checkbox", { default: true }),
    ],
  },
  contacts: {
    title: "Networking",
    singular: "contato",
    description: "Relações profissionais com contexto e continuidade.",
    columns: ["title", "company", "role", "status", "nextFollowUpDate"],
    fields: [
      field("title", "Nome", "text", { required: true }),
      field("company", "Empresa"),
      field("role", "Cargo"),
      field("area", "Área"),
      field("linkedinUrl", "LinkedIn", "url"),
      field("firstContactDate", "Primeiro contato", "date", { required: true }),
      field("lastInteractionDate", "Última interação", "date"),
      field("nextFollowUpDate", "Próximo contato", "date"),
      status([
        "NEW",
        "CONTACTED",
        "CONVERSATION",
        "ACTIVE",
        "MENTOR",
        "OPPORTUNITY",
        "ARCHIVED",
      ]),
      field("relevant", "Relevante para o objetivo", "checkbox"),
      notes,
    ],
  },
  interactions: {
    title: "Interações",
    singular: "interação",
    description: "Registre uma conversa real para receber XP de networking.",
    columns: ["title", "contactId", "date"],
    fields: [
      title,
      field("contactId", "Contato", "select", {
        required: true,
        relation: "contacts",
      }),
      field("date", "Data", "date", { required: true }),
      notes,
    ],
  },
  opportunities: {
    title: "Career Opportunities",
    singular: "oportunidade",
    description: "Acompanhe processos, eventos e possibilidades.",
    columns: ["title", "company", "status", "deadline"],
    fields: [
      field("title", "Posição / evento", "text", { required: true }),
      field("company", "Empresa", "text", { required: true }),
      field("area", "Área"),
      field("location", "Localização"),
      field("type", "Tipo", "select", {
        options: [
          "INTERNSHIP",
          "TRAINEE",
          "FULL_TIME",
          "EVENT",
          "PROGRAM",
          "NETWORKING",
        ],
      }),
      field("deadline", "Prazo", "date"),
      field("url", "Link", "url"),
      status([
        "INTERESTED",
        "TO_APPLY",
        "APPLIED",
        "INTERVIEW",
        "FINALIST",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
      ]),
      field("archived", "Arquivada", "checkbox"),
      notes,
    ],
  },
  plans: {
    title: "Weekly Planner",
    singular: "bloco",
    description:
      "Sua rotina: trabalho 08–16h, faculdade 18–21h, estudos 21–23h30.",
    columns: ["title", "weekday", "start", "end", "pillarId"],
    fields: [
      title,
      field("weekday", "Dia", "select", {
        options: ["1", "2", "3", "4", "5", "6", "0"],
      }),
      field("start", "Início", "time", { required: true, default: "21:00" }),
      field("end", "Fim", "time", { required: true, default: "21:45" }),
      pillar,
      notes,
    ],
  },
  checkins: {
    title: "Daily Check-in",
    singular: "check-in",
    description:
      "Uma pausa para reconhecer o que avançou hoje. Minutos são reflexivos e não duplicam sessões.",
    columns: ["date", "energy", "focus", "studyMinutes"],
    fields: [
      field("date", "Data", "date", { required: true }),
      field("studied", "Estudei hoje", "checkbox"),
      field("title", "O que estudei?"),
      field("studyMinutes", "Minutos (reflexão)", "number", {
        min: 0,
        max: 1440,
        default: 0,
      }),
      field("note", "Principal evolução", "textarea"),
      field("improve", "O que melhorar?", "textarea"),
      field("energy", "Energia (1–5)", "number", {
        min: 1,
        max: 5,
        default: 3,
      }),
      field("focus", "Foco (1–5)", "number", { min: 1, max: 5, default: 3 }),
      field("completedMainTask", "Tarefa principal concluída", "checkbox"),
    ],
  },
  reviews: {
    title: "Review Center",
    singular: "revisão",
    description: "Conclua uma revisão e agende a próxima conforme seu domínio.",
    columns: ["title", "reviewDate", "mastery", "completed"],
    fields: [
      title,
      field("lessonId", "Aula", "select", { relation: "lessons" }),
      field("reviewDate", "Próxima revisão", "date", { required: true }),
      field("mastery", "Domínio (0–5)", "number", {
        min: 0,
        max: 5,
        default: 0,
      }),
      field("completed", "Concluída", "checkbox"),
      notes,
    ],
  },
  certifications: {
    title: "Certificações",
    singular: "certificação",
    description:
      "CNPI e CFA são possibilidades futuras e não entram no Career Progress.",
    columns: ["title", "status"],
    fields: [
      title,
      status(["FUTURE", "PLANNING", "STUDYING", "COMPLETED"]),
      notes,
    ],
  },
  profile: {
    title: "Professional Profile",
    singular: "item do perfil",
    description: "Sua apresentação profissional, construída aos poucos.",
    columns: ["title", "completed"],
    fields: [title, field("completed", "Concluído", "checkbox")],
  },
  roadmap: {
    title: "Career Roadmap",
    singular: "etapa",
    description: "Uma direção de longo prazo, não uma garantia de carreira.",
    columns: ["title", "phase", "completed"],
    fields: [
      title,
      field("phase", "Fase", "select", {
        options: [
          "Foundation",
          "Development",
          "Experience",
          "Specialization",
          "Target",
        ],
      }),
      field("completed", "Concluído", "checkbox"),
      notes,
    ],
  },
};
export type Data = Record<string, Row[]>;
export type Settings = {
  name: string;
  email: string;
  age: number;
  currentSemester: number;
  careerGoal: string;
  interests: string;
  timezone: string;
  studyStart: string;
  studyEnd: string;
  weeklyMinutes: number;
  englishLevel: number;
  experienceLevel: number;
  theme: "light" | "dark";
  notifications: boolean;
  onboarding: boolean;
  pillarWeights: number[];
  readinessWeights: number[];
};
export const defaultSettings: Settings = {
  name: "Meu Career OS",
  email: "",
  age: 21,
  currentSemester: 1,
  careerGoal: "Investment Banking",
  interests: "Equity Research, Asset Management",
  timezone: "America/Fortaleza",
  studyStart: "21:00",
  studyEnd: "23:30",
  weeklyMinutes: 360,
  englishLevel: 0,
  experienceLevel: 0,
  theme: "light",
  notifications: true,
  onboarding: false,
  pillarWeights: [20, 20, 25, 25, 10],
  readinessWeights: [25, 15, 20, 15, 15, 5, 5],
};
export const pillarIds = [
  "college",
  "english",
  "finance",
  "technical",
  "experience",
];
export const labels: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  REVIEW: "Revisar",
  TODO: "A fazer",
  DONE: "Concluído",
  CANCELLED: "Cancelado",
  IDEA: "Ideia",
  PLANNED: "Planejado",
  ARCHIVED: "Arquivado",
  SHORT_TERM: "Curto prazo",
  MEDIUM_TERM: "Médio prazo",
  LONG_TERM: "Longo prazo",
  DAILY: "Diário",
  WEEKLY: "Semanal",
  NEW: "Novo contato",
  CONTACTED: "Conheci",
  CONVERSATION: "Conversei",
  ACTIVE: "Ativo",
  MENTOR: "Mentor",
  OPPORTUNITY: "Oportunidade",
  INTERESTED: "Interessante",
  TO_APPLY: "Aplicar",
  APPLIED: "Aplicado",
  INTERVIEW: "Entrevista",
  FINALIST: "Finalista",
  ACCEPTED: "Aprovado",
  REJECTED: "Rejeitado",
  EXPIRED: "Expirado",
  INTERNSHIP: "Estágio",
  TRAINEE: "Trainee",
  FULL_TIME: "Vaga",
  EVENT: "Evento",
  PROGRAM: "Programa",
  NETWORKING: "Networking",
  FUTURE: "Futuro",
  PLANNING: "Planejando",
  STUDYING: "Estudando",
  MASTERED: "Dominado",
  EASY: "Fácil",
  HARD: "Difícil",
  "0": "Domingo",
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
};
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateRow(
  kind: string,
  input: unknown,
): Record<string, Value> {
  const def = definitions[kind];
  if (!def) throw new Error("Tipo de registro inválido.");
  const shape: Record<string, z.ZodType> = {};
  for (const f of def.fields) {
    let s: z.ZodType;
    if (f.type === "number")
      s = z
        .number()
        .finite()
        .min(f.min ?? 0)
        .max(f.max ?? 100000)
        .int();
    else if (f.type === "checkbox") s = z.boolean();
    else {
      let st = z
        .string()
        .trim()
        .max(f.type === "textarea" ? 10000 : 500);
      if (f.required) st = st.min(1, `${f.label} é obrigatório.`);
      s = st;
      if (f.type === "date")
        s = st.refine((v) => !v || validDate(v), "Data inválida.");
      if (f.type === "time")
        s = st.refine(
          (v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
          "Horário inválido.",
        );
      if (f.type === "datetime-local")
        s = st.refine(
          (v) =>
            !v ||
            (/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v) &&
              validDate(v.slice(0, 10))),
          "Data/hora inválida.",
        );
      if (f.type === "url")
        s = st.refine(
          (v) => !v || (/^https?:\/\//.test(v) && URL.canParse(v)),
          "Use um link http(s) válido.",
        );
      if (f.options)
        s = st.refine((v) => f.options!.includes(v), "Opção inválida.");
    }
    shape[f.key] =
      f.required && f.default === undefined
        ? s
        : s.default(
            f.default ??
              (f.type === "checkbox"
                ? false
                : f.type === "number"
                  ? (f.min ?? 0)
                  : (f.options?.[0] ?? "")),
          );
  }
  return z.object(shape).parse(input) as Record<string, Value>;
}
const weights = (n: number) =>
  z
    .array(z.number().finite().min(0).max(100))
    .length(n)
    .refine(
      (a) => Math.abs(a.reduce((x, y) => x + y, 0) - 100) < 0.00001,
      "Os pesos devem somar 100%.",
    );
export const settingsSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.union([z.literal(""), z.email()]),
    age: z.number().int().min(1).max(120),
    currentSemester: z.number().int().min(1).max(20),
    careerGoal: z.string().trim().min(1).max(120),
    interests: z.string().max(500),
    timezone: z.string().refine((t) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: t });
        return true;
      } catch {
        return false;
      }
    }, "Fuso inválido"),
    studyStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    studyEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    weeklyMinutes: z.number().int().min(1).max(10080),
    englishLevel: z.number().int().min(0).max(5),
    experienceLevel: z.number().int().min(0).max(5),
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean(),
    onboarding: z.boolean(),
    pillarWeights: weights(5),
    readinessWeights: weights(7),
  })
  .refine(
    (s) => s.studyEnd > s.studyStart,
    "O fim do estudo deve ser posterior ao início.",
  );
