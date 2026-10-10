# Finance Career OS

**Não tenho pressa. Tenho direção.** Um sistema pessoal de carreira para construir uma trajetória em finanças, com foco em Investment Banking. Interface em português, responsiva, com temas claro e escuro.

## Rodar localmente

Requer **Node.js 22.13+ (recomendado: Node 24 LTS)** e npm. SQLite vem integrado ao Node; não é preciso instalar um servidor de banco.

```sh
git clone https://github.com/Zinum21/projeto-ib.git
cd projeto-ib
npm ci
npm run dev
```

Abra http://127.0.0.1:3000, crie uma senha de pelo menos 10 caracteres e conclua o onboarding. Nenhuma conta de demonstração ou senha é distribuída no código. No Windows, use uma pasta com nome válido, por exemplo `C:\Projetos\projeto-ib` (não utilize nomes reservados como `con`).

Para uma execução otimizada:

```sh
npm run build
npm start
```

Os scripts escutam apenas em `127.0.0.1`. Este é um aplicativo pessoal de usuário único, pronto para rodar localmente. **O repositório não é uma hospedagem do aplicativo.** Hospedagem requer processo Node persistente, HTTPS e volume persistente para SQLite; não use filesystem efêmero de funções serverless. Complete a criação da senha antes de disponibilizar a instalação a outras pessoas.

## O que funciona

- Dashboard com cinco pilares, Career Progress, Readiness, XP, streak, tarefas de hoje e meta semanal.
- Cursos, módulos e aulas com CRUD. Concluir uma aula cria uma sessão de estudo única; reabrir remove essa sessão. Editar a duração ajusta o total sem duplicação.
- Sessões manuais com início/fim ou minutos, tarefas, revisão e histórico de check-ins.
- Skills com níveis de 0 a 5, importância, etapas de Excel e projeto relacionado.
- Projetos com links, resultados e portfólio de concluídos.
- Roadmap editável por conclusão, metas e milestones, conquistas profissionais automáticas.
- CRM com contatos, interações reais, follow-ups e empresas; oportunidades em Kanban com mudança de status.
- Planner semanal editável, hábitos diários/semanais, calendário, sequência atual e melhor sequência.
- Checklist profissional, níveis autoavaliados de experiência/inglês e tracking de CNPI/CFA.
- Analytics por 7/30/90 dias e ano, histórico de pilares iniciado nas primeiras alterações.
- Configurações de perfil, rotina, temas, notificações, pesos e exportação JSON.
- Metrics Inspector com fórmulas, componentes, resultados e livro de XP.

Os cursos English e Escola do Investidor são cadastrados sem módulos ou aulas inventadas. Projetos iniciais são **ideias**, nunca resultados concluídos. As certificações futuras não alteram o progresso. Career Copilot com IA e integrações externas não fazem parte desta versão.

## Dados e autenticação

Na primeira execução o banco é criado em `data/career.db`, com seed idempotente. A pasta `data/`, arquivos `.env`, dependências e builds são ignorados pelo Git. Somente o código e dados iniciais de configuração entram no repositório.

A autenticação utiliza senha com **scrypt e salt aleatório**, cookie HttpOnly/SameSite, sessão assinada com HMAC e expiração de sete dias. Login tem bloqueio após cinco tentativas por 15 minutos. Mutações exigem origem igual à aplicação e sessão autenticada. Senha e segredo de sessão ficam apenas no banco local.

`DATABASE_PATH` pode definir outro arquivo SQLite persistente. Consulte `.env.example`. Não compartilhe o banco: ele contém dados pessoais e informações de autenticação.

## Backup e recuperação

1. Pare o servidor (`Ctrl+C`).
2. Copie a pasta `data/` inteira para um local privado, incluindo arquivos `-wal`/`-shm` se existirem.
3. Para restaurar, com o servidor parado, substitua a pasta por sua cópia e inicie novamente.

Configurações → Exportar dados gera um JSON de consulta/portabilidade, sem senha e sem segredo de sessão. A restauração suportada usa o backup SQLite, não a importação JSON. Para redefinir uma senha esquecida, use uma cópia do banco e uma ferramenta SQLite local para remover as chaves `password`, `session_secret` e `auth_failures` da tabela `meta`; a próxima abertura permite criar uma senha sem apagar registros. Nunca exponha essa instalação durante a redefinição.

## Cálculos

Consulte [docs/calculations.md](docs/calculations.md). As regras do segundo prompt prevalecem sobre exemplos ilustrativos do primeiro. Nenhuma métrica representa probabilidade de contratação. Estudar gera horas e XP, mas não declara domínio de uma skill automaticamente.

## Validação

```sh
npm test
npm run typecheck
npm run build
npm run test:integration
```

Os testes de domínio usam bancos SQLite em memória. O teste HTTP usa banco temporário isolado e servidor em porta própria, sem alterar dados pessoais. Ele exige build prévio.

## Arquitetura

- `app/`: entrada Next.js e rotas autenticadas.
- `components/`: interface, componentes reutilizáveis e formulários orientados pelo schema.
- `lib/model.ts`: entidades, validação Zod, enums e configurações.
- `lib/db.ts`: repositório SQLite transacional, relações, eventos únicos e snapshots.
- `lib/metrics.ts`: cálculos puros testáveis.
- `lib/seed.ts`: configuração inicial sem atividade fictícia.
- `tests/`: testes de regras e integração HTTP.

O banco usa documentos JSON validados por entidade e uma tabela de relações com chaves estrangeiras SQLite. Isso mantém um CRUD simples sem abrir mão da integridade referencial. Exclusões de pais com dependentes são bloqueadas. A versão inicial do schema é `PRAGMA user_version=1`.

As tabelas de registro do usuário e configurações são uma única entrada `settings` em `meta`, pois a instalação tem apenas um dono. Progresso não é armazenado manualmente nos pilares: é calculado na leitura. Snapshots diários guardam a evolução para o gráfico.

## Limites conhecidos

- Uso pessoal, uma conta por instalação; sem colaboração multiusuário.
- Links de arquivos e repositórios são suportados; upload binário não está incluído.
- Notificações são internas, sem e-mail ou push.
- Roadmap é orientação flexível; experiência e skills dependem de autoavaliação.
- Cada nova instalação começa sem histórico. Gráficos não preenchem progresso passado fictício.
- A fonte web é opcional; há fallback local quando offline.
