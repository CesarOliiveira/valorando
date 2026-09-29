# Valorando

Plataforma de desafios rápidos de adivinhação: agentes, armas, skins e habilidades. A imagem começa borrada e se revela a cada erro.

## Comandos

- `npm install`
- `npm run dev`: servidor de desenvolvimento
- `npm test`: testes da engine e dos modos (Vitest)
- `npm run build`: typecheck + build de produção em `dist/`
- `npm run content:sync`: baixa agentes, habilidades, armas e skins da valorant-api.com, converte as imagens para WebP em `public/assets/` e regenera `src/data/*.json` (use `--force` para baixar de novo imagens já existentes)

## Estrutura

- `src/domain`: engine genérica (`GuessingGameEngine`, seleção de desafios, validação de respostas, pistas, revelação, pontuação, estatísticas)
- `src/modes`: cada desafio transforma seus dados em perguntas, respostas e pistas (`agentModes`, `weaponModes`, `skinModes`, `abilityModes`)
- `src/content`: tipos e carregamento validado de `src/data/{agents,abilities,weapons,skins}.json`
- `src/config/gameConfig.ts`: dificuldades, curvas de revelação por tipo de imagem, pistas fixas/ocultas por modo, pontuação e tema
- `src/application`: `GameController`, que liga engine, preload e persistência
- `src/infrastructure`: localStorage (prefixo `valorando:v1:`), URLs de assets, preload de imagens
- `src/ui`: menu de desafios, tela de jogo/resultado e componentes

## Desafio do dia (modo contínuo)

Encadeia Agentes → Armas → Skins → Habilidades em uma única jornada, na dificuldade Normal (`DAILY_CHALLENGE` em `src/config/gameConfig.ts`).

- Todos recebem os mesmos desafios no mesmo dia: o sorteio usa uma semente derivada da data local (`src/domain/dailySeed.ts`).
- Uma jornada por dia. O progresso fica salvo entre etapas; sair ou recarregar no meio de uma etapa conta como derrota nela.
- O controle é local (localStorage): limpar os dados do navegador libera uma nova tentativa. Impedir isso de verdade exige backend.

## Conteúdo

Novos registros em `src/data/*.json` entram no jogo sem mudar a lógica. O campo `hints` de cada registro aceita pistas extras em texto. Dados manuais usados pela sincronização ficam em `scripts/agent-extras.json` (país, datas) e `scripts/weapon-extras.json` (descrição de uso, apelidos).

As skins incluídas são das edições Premium, Exclusiva e Ultra, de coleções com pelo menos 3 skins, sem armas brancas (`SKIN_RULES` em `scripts/sync-content.mjs`).

## Novo modo

Crie uma `ModeDefinition` no arquivo do desafio em `src/modes`, adicione o id em `ModeId` (`src/domain/rules.ts`) e o balanceamento em `MODE_BALANCE`.

Imagens e nomes de Valorant pertencem à Riot Games. Projeto de fã, sem afiliação.
