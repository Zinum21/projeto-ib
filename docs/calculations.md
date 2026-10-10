# Contrato de métricas

Todos os dias são interpretados no fuso configurado (inicial: America/Fortaleza). Datas de calendário são `YYYY-MM-DD`, independentemente do fuso do servidor. Semanas começam na segunda-feira.

| Indicador               | Origem e fórmula                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill                   | `currentLevel / 5 × 100`; níveis inteiros 0–5                                                                                                                  |
| Skills do pilar         | Média por importância Low=1, Medium=2, High=3                                                                                                                  |
| Curso/módulo            | Aulas concluídas / total de aulas × 100                                                                                                                        |
| Pilar                   | Média ponderada dos grupos existentes: skills=60, cursos=25, projetos vinculados=15. Experience inclui nível/5 com peso 60. Ausência total de componentes = 0. |
| Career Progress         | Soma dos cinco pilares × pesos configurados (20/20/25/25/10 inicialmente)                                                                                      |
| Readiness               | Technical 25%, English 15%, Excel/Modeling 20%, Projects 15%, Experience 15%, Networking 5%, Profile 5%                                                        |
| Technical               | Apenas skills Finance, ponderadas por importância                                                                                                              |
| Excel/Modeling          | Skills nomeadas Excel e Financial Modeling, ponderadas por importância                                                                                         |
| English / Experience    | Nível registrado / 5 × 100                                                                                                                                     |
| Projects no Readiness   | Projetos financeiros concluídos / 5 × 100, máximo 100                                                                                                          |
| Networking no Readiness | Contatos marcados relevantes e não arquivados; 0=0%, 1–2=20%, 3–5=40%, 6–10=60%, 11–20=80%, 21+=100%                                                           |
| Profile                 | Itens marcados / total do checklist                                                                                                                            |
| Horas                   | Soma de StudySessions.durationMinutes; check-ins são reflexivos e não entram nessa soma                                                                        |
| Meta semanal            | Minutos na semana / meta; barra limitada a 100%, rótulo 100%+ quando excedida                                                                                  |
| Conclusão semanal       | Tarefas DONE / tarefas não CANCELLED com prazo na semana; tarefas de outras semanas excluídas                                                                  |
| Goals                   | Milestones concluídos / total, quando existem; progresso manual somente sem milestones                                                                         |
| Habits                  | Períodos concluídos / elegíveis desde a criação; uma conclusão por dia/semana                                                                                  |
| Streak                  | Períodos consecutivos; pode começar ontem/semana passada enquanto o período atual está aberto; nunca salta lacunas anteriores                                  |
| Weekly Execution        | Tarefas 40% + meta de estudo 40% + hábitos 20%; separado da evolução acumulada                                                                                 |
| Comparação              | `(atual − anterior) / anterior × 100`; anterior zero = New; compara os mesmos dias da semana anterior                                                          |
| Conversão               | (INTERVIEW + FINALIST + ACCEPTED) / candidaturas; zero candidaturas = —                                                                                        |
| Aprovação               | ACCEPTED / candidaturas; zero candidaturas = —                                                                                                                 |

O primeiro prompt não define os pesos internos dos componentes de cada pilar. A política **60/25/15** acima é uma decisão explícita desta implementação e aparece no Metrics Inspector. Os pesos dos cinco pilares e do Readiness são configuráveis e devem somar 100%.

## Eventos de XP

Aula +10; sessão manual +5; projeto concluído +100; tarefa +5; interação de networking +20; revisão +10; milestone +50. A sessão gerada por uma aula não recebe outro bônus. Cadastrar um contato sem registrar interação não gera XP.

Cada origem recebe XP uma única vez, protegido por chave única e transação. Editar, reabrir ou concluir novamente não concede XP extra. O livro de XP é histórico: excluir ou reabrir o registro de origem não remove a conquista já concedida. IDs novos representam atividades novas. As conquistas visuais automáticas não dão XP extra.

Níveis: 0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500 e 7500 XP. Máximo inicial: nível 10.

## Regras adicionais

- Concluir projeto força progresso 100; IDEA força 0.
- Concluir aula cria/atualiza a sessão com ID determinístico, evitando duplicação. Reabrir remove a sessão gerada.
- Marcar revisão necessária em uma aula cria uma revisão para o dia seguinte se não existir revisão aberta. O usuário define as próximas revisões e o domínio.
- Atividades realizadas não podem ser futuras; datas de planejamento podem.
- Snapshot de métricas é atualizado após cada mutação e consolidado por dia. O histórico começa no uso efetivo do aplicativo.
- Notificações: atrasos, revisões, follow-ups vencidos, milestones/oportunidades nos próximos sete dias e convite suave para retomar consistência.
- Educação, inglês, experiência, certificações e resultados nunca são presumidos com base apenas no contexto do usuário.
