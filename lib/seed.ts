import { Data, Row, pillarIds, defaultSettings } from "./model";
export function initialData(today: string): Data {
  const data: Data = {};
  let counter = 0;
  const add = (
    kind: string,
    values: Record<string, string | number | boolean>,
    id?: string,
  ) => {
    const row = {
      id: id || `seed-${kind}-${++counter}`,
      createdAt: today,
      updatedAt: today,
      ...values,
    } as Row;
    (data[kind] ??= []).push(row);
    return row.id;
  };
  ["College", "English", "Finance", "Technical Skills", "Experience"].forEach(
    (title, i) =>
      add(
        "pillars",
        {
          title,
          description: [
            "Administração",
            "Inglês profissional",
            "Fundamentos de finanças",
            "Excel e Financial Modeling",
            "Experiência e networking",
          ][i],
          weight: defaultSettings.pillarWeights[i],
          active: true,
        },
        pillarIds[i],
      ),
  );
  const skills: Record<string, string[]> = {
    college: ["Administração"],
    english: [
      "Reading",
      "Listening",
      "Speaking",
      "Writing",
      "Business Vocabulary",
    ],
    finance: [
      "Accounting",
      "Financial Statements",
      "Valuation",
      "DCF",
      "WACC",
      "Financial Analysis",
      "M&A",
      "Capital Markets",
    ],
    technical: ["Excel", "Financial Modeling", "PowerPoint", "Power BI"],
  };
  Object.entries(skills).forEach(([pillarId, names]) =>
    names.forEach((title) =>
      add("skills", {
        title,
        pillarId,
        currentLevel: 0,
        targetLevel: 5,
        importance:
          title === "Power BI"
            ? "LOW"
            : ["Writing", "PowerPoint", "M&A", "Capital Markets"].includes(
                  title,
                )
              ? "MEDIUM"
              : "HIGH",
        status: "NOT_STARTED",
        stage: "Other",
      }),
    ),
  );
  add("courses", { title: "English", pillarId: "english" });
  add("courses", {
    title: "Escola do Investidor",
    pillarId: "finance",
    notes: "Cadastre somente módulos e aulas do seu material real.",
  });
  [
    "Estudar inglês",
    "Estudar finanças",
    "Praticar Excel",
    "Ler",
    "Fazer networking",
    "Trabalhar em projetos",
  ].forEach((title, i) =>
    add("habits", {
      title,
      frequency: i < 4 ? "DAILY" : "WEEKLY",
      active: true,
    }),
  );
  [
    "Foto",
    "Headline",
    "About",
    "Educação",
    "Experiência",
    "Skills",
    "Cursos",
    "Projetos",
    "Certificações",
    "Featured",
  ].forEach((title) => add("profile", { title, completed: false }));
  ["CNPI", "CFA"].forEach((title) =>
    add("certifications", { title, status: "FUTURE" }),
  );
  [
    ["Análise fundamentalista de uma empresa", "Fundamental Analysis"],
    ["DRE + Balanço + Fluxo de Caixa", "Financial Statements"],
    ["DCF de uma empresa da B3", "DCF"],
    ["Valuation por múltiplos", "Valuation"],
    ["Financial Model completo", "Financial Modeling"],
  ].forEach(([title, category]) =>
    add("projects", {
      title,
      category,
      pillarId: "finance",
      status: "IDEA",
      progress: 0,
    }),
  );
  [
    ["Investment Banking", "LONG_TERM"],
    ["Excel avançado", "MEDIUM_TERM"],
    ["Primeiro valuation completo", "MEDIUM_TERM"],
    ["Melhorar inglês", "MEDIUM_TERM"],
    ["Atualizar LinkedIn", "SHORT_TERM"],
  ].forEach(([title, category]) =>
    add("goals", {
      title,
      category,
      status: "NOT_STARTED",
      priority: "MEDIUM",
      progress: 0,
    }),
  );
  const internship = add("goals", {
    title: "Conseguir estágio em finanças",
    category: "MEDIUM_TERM",
    status: "NOT_STARTED",
    priority: "MEDIUM",
    progress: 0,
  });
  [
    "Atualizar LinkedIn",
    "Criar currículo",
    "Fazer primeiro projeto financeiro",
    "Aplicar para 10 vagas",
    "Participar de entrevista",
  ].forEach((title, order) =>
    add("milestones", { title, goalId: internship, order, completed: false }),
  );
  const roadmap: Record<string, string[]> = {
    Foundation: [
      "Faculdade",
      "Inglês",
      "Fundamentos de finanças",
      "Excel",
      "Valuation",
      "LinkedIn",
      "Networking inicial",
    ],
    Development: [
      "Excel avançado",
      "Financial Modeling",
      "Power BI",
      "Primeiros projetos financeiros",
      "Networking e eventos",
      "Buscar estágio em finanças",
    ],
    Experience: [
      "Corporate Finance",
      "Banco",
      "Research",
      "Asset",
      "Crédito",
      "FP&A",
      "Controladoria",
      "Tesouraria",
    ],
    Specialization: [
      "Investment Banking",
      "M&A",
      "Equity Research",
      "Asset Management",
      "Corporate Finance",
    ],
    Target: [
      "Investment Banking / M&A",
      "Considerar CNPI / CFA",
      "Networking avançado",
      "Processos seletivos",
      "Entrevistas técnicas",
    ],
  };
  Object.entries(roadmap).forEach(([phase, titles]) =>
    titles.forEach((title) =>
      add("roadmap", { title, phase, completed: false }),
    ),
  );
  [
    "English",
    "Escola do Investidor",
    "English",
    "Escola do Investidor",
    "Livre / revisão",
    "Projeto financeiro",
    "Planejamento semanal",
  ].forEach((title, i) =>
    add("plans", {
      title,
      weekday: String((i + 1) % 7),
      start: i < 5 ? "21:00" : "10:00",
      end: i < 5 ? "21:45" : "11:00",
      pillarId: i === 0 || i === 2 ? "english" : "finance",
    }),
  );
  return data;
}
