# i10 LP Test

Landing page institucional do Instituto i10 — site **estático em HTML/CSS/JS puro** (pesquisa, inovação e impacto na educação pública via IA), servido pela Vercel como static hosting. Bilíngue PT/EN via atributos `data-pt` / `data-en`.

## Stack

- **Linguagem:** HTML5 + CSS + JavaScript vanilla. **Sem build, sem framework, sem Node** (não há `package.json`).
- **Deploy:** Vercel (static hosting; auto-deploy da `main`).
- **Roteamento especial:** `vercel.json` faz rewrite de `/marketing` (e `/marketing/:path*`) para o app `i10-marketing.vercel.app/marketing` — este repo é a "casca" de domínio que monta o painel de marketing sob subpath.

## Comandos

Não há toolchain. Para desenvolver, abra os `.html` no navegador ou sirva a pasta com um servidor estático simples, por exemplo:

```bash
python3 -m http.server 8000     # abre http://localhost:8000/index.html
# ou: npx serve .
```

Deploy é automático via Vercel ao dar push na `main`.

## Estrutura

- `index.html`, `sobre.html`, `programas.html`, `impacto.html`, `pesquisa.html`, `contato.html` — páginas publicadas na raiz.
- `assets/` — `styles.css`, `app.js` (toggle de idioma PT/EN, nav mobile, scroll reveal via IntersectionObserver, animação de contadores), `images/`, `videos/`.
- `vercel.json` — rewrites do subpath `/marketing`.
- `site-test/` — versão de trabalho/expansão do site (mais páginas: `projeto-*.html`, `projetos.html`, `tools/`); **não** é o que está publicado na raiz. Confirme qual conjunto está no ar antes de editar.

## Convenções de código

- HTML semântico; conteúdo bilíngue sempre com par `data-pt` / `data-en` (o toggle em `assets/app.js` troca o texto; não hardcode um idioma só).
- Estilos centralizados em `assets/styles.css`; comportamento em `assets/app.js` (IIFE, `'use strict'`).
- Aplicar o **brandbook i10** em peças visuais (logo = 3 barras ascendentes azul→verde; paleta ciano/verde/azul-marinho, ver favicon inline).

## Variáveis de ambiente

Nenhuma — site estático sem backend. Não há segredos neste repo.

## CI/CD & Deploy

- **Deploy:** push em `main` → deploy de produção na Vercel.
- **Sem CI.** Como não há build, um workflow mínimo opcional (em PR) poderia validar HTML/links (ex.: `htmlhint` + um link-checker) para evitar página quebrada em produção.

## Boas práticas de PR

- Branch: `feat/…`, `fix/…`, `chore/…`. Conventional Commits.
- PR pequeno. Checklist: páginas abrem sem erro no console; pares `data-pt`/`data-en` completos; links e assets resolvem; screenshots antes/depois das telas alteradas.
- ≥1 review; squash merge; `main` sempre deployável.

## Testes

Não se aplica (sem lógica de app). Verificação manual: abrir cada página, alternar idioma, checar responsividade e ausência de erros no console.

## Segurança & dados

- Não commitar `.env`/segredos (o `.gitignore` já cobre `.env`, `.env.local`, `node_modules/`, `.DS_Store`, `assets/_backup_pre_manus/`).
- Sem coleta de dados pessoais no repo; o formulário de contato deve apontar para serviço externo — não embutir credenciais.

## Gotchas

- **Dois conjuntos de páginas** (`/` e `site-test/`) — só o da raiz está publicado. Editar em `site-test/` não altera o site no ar; confirme o alvo.
- **Rewrite `/marketing`** — este repo intercepta `/marketing` e encaminha para o app `i10-marketing`; não crie uma pasta `marketing/` aqui que colidiria com o rewrite.
- Bilinguismo é obrigatório: adicionar texto só em PT (ou só em EN) quebra o toggle de idioma.
