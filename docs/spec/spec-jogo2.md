Spec — Modos de Adivinhação: Armas, Skins e Habilidades
1. Visão geral
Expandir o jogo de adivinhação existente, mantendo a mesma identidade visual, estrutura de navegação e experiência do modo principal de Adivinhe o Agente.

Adicionar dois novos grandes grupos de desafios:

Adivinhe a Arma

Adivinhe a Habilidade

O sistema deve ser desenvolvido de forma modular para que todos os modos compartilhem os mesmos componentes de jogo, sistema de tentativas, pistas, pontuação, animações, estatísticas e tela de resultado.

O jogador deve sentir que está jogando diferentes versões do mesmo jogo, e não produtos separados.

2. Modos de jogo
A estrutura principal deverá ficar:

JOGAR
│
├── 👤 Agentes
│
├── 🔫 Armas
│   ├── Arma padrão
│   └── Skin de arma
│
└── ⚡ Habilidades

Cada modo deve possuir suas próprias regras e banco de dados, mas utilizar a mesma infraestrutura de jogo.

3. Modo — Adivinhe a Arma
Criar um modo em que o jogador precisa descobrir qual arma está sendo apresentada.

O sistema deve selecionar aleatoriamente uma arma e apresentar uma representação visual dela.

Exemplos de armas:

Vandal

Phantom

Sheriff

Ghost

Classic

Frenzy

Shorty

Spectre

Stinger

Bulldog

Guardian

Marshal

Operator

Outlaw

Bucky

Judge

Ares

Odin

Knife/Melee

A lista de armas deve ser armazenada em uma fonte de dados centralizada para permitir atualizações futuras.

4. Tipos de desafio de armas
O modo de armas deve possuir diferentes variantes.

4.1 Adivinhe a arma
O jogador recebe uma imagem da arma com o mesmo sistema utilizado no modo de agentes.

A imagem começa borrada.

Exemplo:

┌──────────────────────────┐
│                          │
│      [ ARMA BORRADA ]    │
│                          │
└──────────────────────────┘

Qual arma é essa?

[ Digite o nome da arma... ]

A cada erro:

diminuir o blur;

revelar mais detalhes;

apresentar uma nova pista;

aumentar a quantidade de informação visual disponível.

5. Sistema de pistas para armas
As pistas devem ser relacionadas às características da arma.

Exemplos:

Pista 1
Categoria:
Rifle

Pista 2
Preço:
2900

Pista 3
Modo de disparo:
Automático

Pista 4
Capacidade:
25 munições

Pista 5
Arma utilizada principalmente em combates de média e longa distância.

As pistas devem ser reveladas progressivamente.

Não revelar todas as informações de uma vez.

6. Categorias de armas
Utilizar as categorias existentes no jogo como parte do sistema de pistas:

Sidearm
SMG
Shotgun
Rifle
Sniper
Heavy
Melee

A categoria pode ser apresentada como uma pista ou como informação sempre visível, dependendo da dificuldade escolhida.

7. Modo — Descubra a Skin
Criar uma variante em que o objetivo não é descobrir a arma base, mas identificar a skin/conjunto visual apresentado.

Exemplo conceitual:

┌─────────────────────────────┐
│                             │
│       [ SKIN BORRADA ]      │
│                             │
└─────────────────────────────┘

Qual é essa skin?

[ Digite sua resposta... ]

O sistema deve permitir que o jogador tente identificar:

nome da skin;

coleção/conjunto;

arma associada.

8. Sistema de dificuldade para skins
Como skins podem ser muito mais difíceis de identificar, criar um sistema de revelação específico.

Estado inicial
Mostrar uma imagem fortemente desfocada.

Após cada erro
Gradualmente:

reduzir o blur;

aumentar a área visível;

revelar cores;

revelar detalhes visuais;

revelar parte do design;

finalmente mostrar a skin completa.

Exemplo:

Tentativa 0 → 95% blur
Tentativa 1 → 75% blur
Tentativa 2 → 55% blur
Tentativa 3 → 35% blur
Tentativa 4 → 15% blur
Tentativa 5 → imagem completa

Os valores devem ser configuráveis.

9. Pistas para skins
Criar pistas específicas para esse modo.

Exemplos:

Pista 1:
Arma: Vandal

Pista 2:
Coleção: [categoria/conjunto]

Pista 3:
Possui efeitos visuais especiais.

Pista 4:
Possui variante(s) de aparência.

Pista 5:
Nome começa com a letra "S".

As pistas devem ser configuráveis individualmente por skin.

10. Sistema de resposta para skins
O autocomplete deve permitir pesquisar pelo nome da skin.

Exemplo:

Qual skin é essa?

[ Digite o nome... ]

  Skin A
  Skin B
  Skin C

Quando possível, o sistema também pode aceitar respostas relacionadas à coleção, caso o modo esteja configurado para isso.

O tipo de resposta esperado deve ser explicitamente definido no objeto da pergunta:

{
  "answerType": "skin"
}

ou:

{
  "answerType": "collection"
}

Isso evita ambiguidades na validação.

11. Modo — Adivinhe a Habilidade
Adicionar um novo modo seguindo exatamente a mesma filosofia do modo Adivinhe o Agente.

A diferença é que o objeto a ser descoberto será uma habilidade.

O sistema deve selecionar:

um agente aleatório;

uma habilidade aleatória pertencente a esse agente.

O jogador deve descobrir qual habilidade está sendo apresentada.

12. Fluxo da partida de habilidades
Exemplo:

Sistema seleciona:

Agente:
[aleatório]

Habilidade:
[aleatória]

↓
Imagem da habilidade é apresentada
↓
Imagem começa borrada
↓
Jogador tenta descobrir
↓
Resposta incorreta
↓
Nova parte da imagem é revelada
↓
Nova pista
↓
Nova tentativa

O agente associado à habilidade não deve ser mostrado inicialmente.

13. Conteúdo visual da habilidade
A apresentação pode utilizar diferentes tipos de informação:

ícone da habilidade;

imagem da habilidade;

representação visual;

screenshot;

elemento visual associado à habilidade.

O sistema deve priorizar uma imagem/ícone que permita aplicar o mesmo efeito de blur e revelação utilizado no modo de agentes.

14. Exemplo de partida
Imagine que o sistema selecionou uma habilidade aleatória.

O jogador vê:

┌───────────────────────────┐
│                           │
│      [ IMAGEM BORRADA ]   │
│                           │
└───────────────────────────┘

Qual habilidade é essa?

[ Digite sua resposta... ]

O jogador responde incorretamente.

O sistema revela:

❌ Incorreto!

Nova pista:
Essa habilidade pertence a um Duelista.

Nova tentativa.

Se errar novamente:

❌ Incorreto!

Nova pista:
A habilidade pode causar dano.

Depois:

Nova pista:
O agente possui 4 habilidades.

O jogador continua tentando até acertar ou atingir o limite.

15. Informações que podem ser utilizadas como pistas
As pistas das habilidades devem ser geradas a partir dos dados do agente.

Possíveis informações:

agente associado;

classe/função do agente;

tipo da habilidade;

custo;

quantidade de cargas;

se causa dano;

se causa debuff;

se fornece mobilidade;

se cria área;

se é Ultimate;

descrição resumida;

primeira letra do nome da habilidade.

Importante:

A pista não deve revelar diretamente o nome da habilidade.

16. Tipos de habilidade
O sistema deve diferenciar:

Q
E
C
X / Ultimate

A letra da habilidade pode ser utilizada como pista em dificuldades mais fáceis.

No modo difícil, ela pode permanecer oculta.

17. Modo "Descubra o Agente pela Habilidade"
Adicionar futuramente uma variante adicional.

Nesse modo, o objetivo não é descobrir o nome da habilidade.

O jogador recebe:

[ HABILIDADE ]

e precisa responder:

Qual agente possui essa habilidade?

Exemplo:

┌─────────────────────────┐
│     ÍCONE BORRADO       │
└─────────────────────────┘

A qual agente pertence?

[ Digite o nome... ]

Isso cria uma segunda maneira de utilizar o mesmo banco de habilidades.

18. Modos de habilidade
A arquitetura deve suportar pelo menos:

Modo A — Adivinhe a habilidade
Imagem → descobrir habilidade

Modo B — Adivinhe o agente
Imagem da habilidade → descobrir agente

Modo C — Ultimate
Imagem/efeito da Ultimate → descobrir agente ou habilidade

O modo pode ser definido por configuração.

19. Estrutura de dados
Criar uma estrutura consistente para os dados.

Arma
{
  "id": "vandal",
  "name": "Vandal",
  "category": "Rifle",
  "price": 2900,
  "image": "/weapons/vandal.webp",
  "ammo": 25,
  "fireMode": "Automatic",
  "hints": []
}

Skin
{
  "id": "skin-id",
  "name": "Skin Name",
  "weaponId": "vandal",
  "collection": "collection-name",
  "image": "/skins/skin-name.webp",
  "variants": [],
  "hints": []
}

Habilidade
{
  "id": "ability-id",
  "agentId": "agent-id",
  "name": "Ability Name",
  "slot": "Q",
  "type": "ability-type",
  "icon": "/abilities/ability.webp",
  "description": "Description",
  "cost": 200,
  "hints": []
}

20. Engine genérica de adivinhação
Não criar uma implementação completamente diferente para cada modo.

Criar uma engine reutilizável:

GuessingGameEngine
│
├── QuestionSelector
├── AnswerValidator
├── HintManager
├── RevealManager
├── ScoreManager
├── AttemptManager
├── Timer
└── ResultManager

Cada modo fornece seus próprios dados e regras.

Exemplo:

AgentGame
WeaponGame
SkinGame
AbilityGame

Todos utilizam a mesma engine.

21. Configuração do jogo
Cada modo deve possuir uma configuração semelhante:

{
  "maxAttempts": 6,
  "initialBlur": 35,
  "revealPerAttempt": 6,
  "hintsEnabled": true,
  "hintInterval": 1,
  "timerEnabled": true
}

Isso permitirá criar facilmente novos modos sem alterar a estrutura principal.

22. Seleção aleatória
O sistema deve selecionar os desafios aleatoriamente.

Entretanto, evitar repetir imediatamente o mesmo conteúdo.

Exemplo:

Partida 1 → Vandal
Partida 2 → Sheriff
Partida 3 → Operator
Partida 4 → Phantom

Não permitir:

Partida 1 → Vandal
Partida 2 → Vandal

Também pode existir um sistema de histórico recente para evitar repetições nas últimas N partidas.

23. Balanceamento
Cada modo deve possuir sua própria dificuldade.

Armas
Mais fácil:

categoria visível;

imagem menos borrada;

várias pistas.

Mais difícil:

imagem extremamente borrada;

categoria escondida;

poucas pistas.

Skins
Mais fácil:

arma base revelada;

coleção como pista;

imagem parcialmente visível.

Mais difícil:

somente uma pequena parte da skin;

nenhuma informação sobre a arma;

poucas pistas.

Habilidades
Mais fácil:

função do agente;

slot da habilidade;

tipo da habilidade.

Mais difícil:

somente imagem borrada;

nenhuma informação sobre o agente;

poucas pistas.

24. Interface compartilhada
Todos os modos devem utilizar o mesmo layout principal:

┌─────────────────────────────────────────────┐
│ LOGO                MODO       ESTATÍSTICAS │
├─────────────────────────────────────────────┤
│                                             │
│             ADIVINHE A ARMA                 │
│                                             │
│          ┌───────────────────┐              │
│          │                   │              │
│          │   IMAGEM BORRADA  │              │
│          │                   │              │
│          └───────────────────┘              │
│                                             │
│          Qual é essa arma?                  │
│                                             │
│       [ Digite sua resposta... ]            │
│                                             │
│       Tentativas: 2 / 6                     │
│                                             │
│       💡 Revelar pista                      │
│                                             │
└─────────────────────────────────────────────┘

O título, pergunta e conteúdo devem mudar dinamicamente de acordo com o modo.

25. Feedback
Todos os modos devem possuir feedback consistente.

Erro
❌ Não foi dessa vez.

Acerto
🎉 Você acertou!

Última tentativa
⚠️ Última tentativa!

Derrota
😔 Você não acertou.

A resposta era:

[ RESPOSTA ]

[ JOGAR NOVAMENTE ]

26. Resultado da partida
Ao finalizar uma partida, mostrar:

VOCÊ ACERTOU!

Resposta:
Vandal

Tentativas:
3

Pistas utilizadas:
1

Tempo:
18.4s

Pontuação:
820

[ JOGAR NOVAMENTE ]
[ VOLTAR AO MENU ]

Para habilidades:

VOCÊ ACERTOU!

Habilidade:
Nome da habilidade

Agente:
Nome do agente

Função:
Duelista

Tentativas:
2

27. Estatísticas separadas por modo
As estatísticas devem ser separadas.

Exemplo:

GERAL

Partidas: 350
Acertos: 292
Taxa: 83%

AGENTES
Partidas: 120
Média: 2.4 tentativas

ARMAS
Partidas: 95
Média: 2.1 tentativas

SKINS
Partidas: 60
Média: 3.7 tentativas

HABILIDADES
Partidas: 75
Média: 3.1 tentativas

28. Menu de seleção
Criar uma tela para selecionar o modo.

ESCOLHA SEU DESAFIO

┌────────────────┐
│ 👤 AGENTES     │
│                │
│ Adivinhe       │
│ o agente       │
└────────────────┘

┌────────────────┐
│ 🔫 ARMAS       │
│                │
│ Descubra       │
│ a arma         │
└────────────────┘

┌────────────────┐
│ 🎨 SKINS       │
│                │
│ Descubra       │
│ a skin         │
└────────────────┘

┌────────────────┐
│ ⚡ HABILIDADES │
│                │
│ Descubra       │
│ a habilidade   │
└────────────────┘

Cada card deve possuir:

ícone;

nome;

descrição curta;

quantidade de desafios disponíveis;

indicador de dificuldade.

29. Sistema de compartilhamento
Todos os modos devem permitir compartilhar o resultado.

Exemplo:

Valorant Guess

🔫 Arma
🟩 🟩 🟨 🟥
3 tentativas
820 pontos

O compartilhamento não deve revelar a resposta.

Para habilidades:

Valorant Guess

⚡ Habilidade
🟩 🟨 🟨 🟥
4 tentativas
640 pontos

30. Performance e carregamento
Como armas, skins e habilidades podem possuir muitas imagens, implementar:

lazy loading;

cache;

compressão de imagens;

formatos modernos;

preload somente do conteúdo necessário;

carregamento progressivo;

tratamento de imagens inexistentes.

Não carregar todas as imagens de skins simultaneamente.

31. Organização dos assets
Organizar os arquivos de forma previsível:

/assets
  /agents
  /weapons
  /skins
  /abilities
  /ui
  /icons

Exemplo:

/assets/agents/
/assets/weapons/
/assets/skins/
/assets/abilities/

Os caminhos devem ser definidos nos arquivos de dados, não espalhados pelos componentes.

32. Tratamento de conteúdo
O sistema deve permitir adicionar novos conteúdos sem alterar a lógica do jogo.

Para adicionar uma nova arma, por exemplo, deve ser necessário apenas adicionar um novo registro:

{
  "id": "new-weapon",
  "name": "New Weapon",
  ...
}

O jogo deve automaticamente reconhecer o novo conteúdo.

O mesmo deve valer para:

agentes;

armas;

skins;

habilidades.

33. Arquitetura final
A estrutura conceitual deve ser:

Game
│
├── Game Engine
│   ├── Question Selector
│   ├── Guess Validator
│   ├── Hint System
│   ├── Reveal System
│   ├── Score System
│   └── Statistics
│
├── Game Modes
│   ├── Agents
│   ├── Weapons
│   ├── Skins
│   └── Abilities
│
└── Data
    ├── Agents
    ├── Weapons
    ├── Skins
    └── Abilities

34. Critérios de aceitação
Armas
 É possível iniciar uma partida de armas.

 Uma arma é selecionada aleatoriamente.

 A imagem começa borrada.

 O jogador consegue pesquisar armas.

 Respostas incorretas revelam informações.

 A imagem é progressivamente revelada.

 O sistema identifica o acerto.

 Existe pontuação.

 Existe tela de resultado.

Skins
 É possível iniciar uma partida de skins.

 Uma skin é selecionada aleatoriamente.

 A imagem começa fortemente borrada.

 O jogador consegue pesquisar skins.

 O sistema fornece pistas progressivas.

 A arma associada pode ser utilizada como pista.

 A resposta é validada corretamente.

Habilidades
 O sistema seleciona aleatoriamente um agente.

 O sistema seleciona aleatoriamente uma habilidade desse agente.

 A habilidade é apresentada visualmente.

 A imagem começa borrada.

 O jogador pode tentar adivinhar a habilidade.

 Erros revelam novas informações.

 O agente associado não é revelado prematuramente.

 O sistema identifica corretamente a habilidade.

 É possível implementar o modo inverso: habilidade → agente.

Geral
 Todos os modos utilizam a mesma engine.

 Todos possuem sistema de tentativas.

 Todos possuem sistema de pistas.

 Todos possuem sistema de revelação.

 Todos possuem pontuação.

 Todos possuem estatísticas.

 Todos possuem tela de resultado.

 Todos funcionam em desktop e mobile.

 Novos conteúdos podem ser adicionados sem alterar a lógica principal.

35. Objetivo da experiência
A experiência completa deve funcionar como uma plataforma de desafios rápidos relacionados ao universo do jogo.

O jogador deve conseguir entrar e imediatamente escolher:

"Quero descobrir quem é o agente."

"Quero descobrir qual é a arma."

"Quero descobrir qual é a skin."

"Quero descobrir qual é a habilidade."

Independentemente do modo escolhido, o loop deve permanecer consistente:

Ver → Analisar → Chutar → Errar → Receber pista → Tentar novamente → Acertar → Pontuar → Jogar novamente

A prioridade deve ser criar uma experiência rápida, viciante e fácil de entender, mantendo todos os modos visualmente e tecnicamente integrados.