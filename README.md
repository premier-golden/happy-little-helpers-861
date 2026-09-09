# preject da frança cood 

.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://horassscompletas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/434f623a-9799-486c-adc1-57216c851504).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Supabase sem depender do editor

A integração já existe em `src/integrations/supabase`. Use Node.js 22+ e
`bun install --frozen-lockfile` (há um `bun.lock`), ou instale com npm.

1. Copie `.env.example` para `.env.local` e informe a URL do projeto e a chave
   **publishable** do painel Supabase (Project Settings → API Keys / Connect).
   A chave legada **anon** também funciona em `VITE_SUPABASE_ANON_KEY`.
2. Use os mesmos valores públicos em `SUPABASE_URL` e
   `SUPABASE_PUBLISHABLE_KEY` para os handlers de autenticação existentes.
3. Execute `npm run dev`. Na hospedagem, configure as variáveis antes do build;
   reinicie o desenvolvimento ou gere um novo build após alterá-las.

As variáveis `VITE_*` são públicas e entram no JavaScript do navegador. Nunca
coloque senhas ou chaves administrativas nelas. `.env.local` é ignorado pelo Git;
este repositório já possui um `.env` versionado, que permanece por compatibilidade.
Ao trocar de projeto, sobrescreva todos os valores relevantes em `.env.local` e
na hospedagem. Não publique credenciais novas no `.env` versionado.

```ts
import { getSupabaseClient } from "@/integrations/supabase/client";

// Dentro de um evento ou efeito no navegador:
const { data, error } = await getSupabaseClient().auth.getUser();
if (error) throw error;
```

O cliente é reutilizado apenas no navegador e valida a configuração ao primeiro
uso. Importá-lo durante SSR é seguro, mas acessá-lo no servidor gera um erro claro.
Handlers protegidos devem usar `requireSupabaseAuth`, que cria um cliente por
requisição e valida o token. A sessão do navegador não é compartilhada por cookies
com SSR. O fluxo TikPay existente possui armazenamento próprio e foi preservado.

Para um projeto novo, URL e chave pública conectam o cliente, mas não migram dados:
o repositório não inclui migrações SQL. Será necessário obter o esquema e os dados
do projeto atual, criar as tabelas e configurar políticas RLS e
os provedores/URLs de redirecionamento de Auth conforme os recursos usados.
As funções administrativas preexistentes de cadastro e metadados têm configuração
privilegiada de servidor própria; esta alteração não adiciona nem solicita segredos
e não migra esses fluxos. Não considere uma migração completa validada só pelo build.

Edite o código e faça commits/push normalmente para a branch conectada ao Lovable,
sem reescrever o histórico. Esta configuração não requer chamadas ao editor.

Referências: [variáveis Vite](https://vite.dev/guide/env-and-mode) e
[cliente Supabase](https://supabase.com/docs/reference/javascript/initializing).

Verificações locais: `node --test tests/*.test.mjs`, `npm run build`, `npm run lint` e `npx tsc --noEmit`. Os testes usam apenas valores sintéticos e não acessam um projeto real.
