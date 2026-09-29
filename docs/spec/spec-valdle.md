Spec — Jogo de Adivinhação de Agentes
1. Visão geral

Criar um jogo web de adivinhação inspirado na experiência de sites como o Valdle.gg, utilizando como referência sua estrutura de navegação, sensação visual, organização das informações e dinâmica de jogo.

O produto deve ser um jogo independente, com identidade visual própria, mas com uma experiência simples, rápida e intuitiva: o jogador recebe pistas sobre um agente e precisa descobrir qual é o personagem correto.

O foco principal deve ser a Adivinhação de Agentes, utilizando imagens parcialmente ocultas, borradas ou reveladas progressivamente.

2. Objetivo do jogo

A cada rodada, o sistema seleciona aleatoriamente um agente.

O jogador deve tentar identificar o agente utilizando as pistas disponíveis.

A dificuldade deve aumentar ou diminuir conforme a quantidade de informações reveladas.

O jogo deve incentivar o jogador a acertar utilizando o menor número possível de tentativas e pistas.

3. Modo principal — Adivinhe o Agente
Fluxo

O sistema seleciona um agente aleatoriamente.

Uma imagem do agente é apresentada ao jogador.

A imagem começa fortemente borrada e/ou parcialmente escondida.

O jogador digita sua resposta em um campo de busca.

O sistema apresenta sugestões de agentes conforme o jogador digita.

O jogador seleciona uma resposta.

O sistema verifica se a resposta está correta.

Caso esteja errada:

registra a tentativa;

revela uma nova pista;

reduz o nível de desfoque;

ou revela uma parte maior da imagem.

Caso esteja correta:

exibe uma animação de sucesso;

mostra o agente completo;

apresenta estatísticas da rodada;

permite iniciar a próxima rodada.

4. Sistema de imagem

A imagem do agente deve ser o elemento central da interface.

Estado inicial

A imagem deve começar extremamente difícil de identificar.

Exemplo:

Blur: 30–40px

Escurecimento parcial

Contraste reduzido

Pequena área da imagem visível

Progressão

A cada tentativa incorreta, a imagem deve ficar mais clara.

Exemplo:

Tentativa	Blur	Imagem revelada
0	35px	15%
1	25px	30%
2	18px	45%
3	12px	60%
4	6px	80%
5	0px	100%

Esses valores devem ser configuráveis para permitir balanceamento posterior.

A transição entre os níveis deve possuir uma animação suave.

5. Sistema de pistas

Além da imagem, o jogo pode revelar pistas progressivamente.

Possíveis pistas:

Nome da função/classe do agente

País ou região de origem

Tipo de agente

Função

Data aproximada de lançamento

Classe/categoria

Habilidades

Arma característica, caso faça sentido

Cor predominante do personagem

Quantidade de letras no nome

Primeira letra do nome

Última letra do nome

As pistas devem ser desbloqueadas gradualmente para evitar entregar a resposta imediatamente.

6. Sistema de tentativa

O jogador deve possuir um campo:

"Qual agente você acha que é?"

Enquanto digita, o sistema deve apresentar um autocomplete contendo os agentes disponíveis.

Exemplo:

Qual agente você acha que é?

[ Digite o nome do agente... ]

  Phoenix
  Fade
  Viper
  Vyse


O jogador não deve conseguir enviar nomes que não existam na lista de agentes.

Após cada tentativa:

Resposta incorreta

Exibir uma indicação visual clara:

❌ Resposta incorreta

Em seguida:

registrar a tentativa;

revelar uma nova parte da imagem;

desbloquear uma pista;

atualizar o contador de tentativas.

Resposta correta

Exibir:

🎉 Você acertou!

Mostrar:

agente correto;

imagem completa;

quantidade de tentativas;

tempo gasto;

quantidade de pistas utilizadas;

pontuação obtida.

7. Pontuação

Criar um sistema de pontuação baseado na eficiência do jogador.

A pontuação deve considerar:

quantidade de tentativas;

tempo necessário;

quantidade de pistas utilizadas;

nível de revelação da imagem.

Exemplo conceitual:

Pontuação base: 1000

-100 por tentativa incorreta
-50 por pista utilizada
-penalidade progressiva por tempo

Pontuação mínima: 0


Os valores devem ficar centralizados em uma configuração para facilitar o balanceamento.

8. Modos de jogo adicionais

A arquitetura deve permitir adicionar novos modos futuramente.

8.1 Silhueta

Mostrar apenas a silhueta do agente.

O jogador precisa identificar o personagem pela aparência geral.

8.2 Habilidade

Mostrar uma imagem ou trecho relacionado a uma habilidade do agente.

O jogador precisa descobrir qual agente possui aquela habilidade.

8.3 Voz

Reproduzir um pequeno trecho de voz associado ao agente.

O jogador precisa identificar quem está falando.

8.4 Ultimate

Mostrar uma representação visual relacionada à habilidade ultimate.

8.5 Emoji

Representar características do agente utilizando emojis.

Exemplo:

🔥 🦊 ⚡


O jogador precisa descobrir o agente.

8.6 Descrição

Mostrar uma descrição progressivamente mais específica sobre o agente.

Exemplo:

Pista 1:
Este agente possui habilidades relacionadas a...

Pista 2:
Sua função é...

Pista 3:
Ele é originário de...

Pista 4:
Seu nome começa com "P".

9. Modo diário

Adicionar posteriormente um modo:

Agente do Dia

Todos os jogadores recebem o mesmo agente durante aquele dia.

O objetivo é criar uma experiência compartilhável.

Após terminar:

AGENTE DO DIA

Você acertou em 4 tentativas.

🟩 🟩 🟨 🟥

Pontuação: 720


Adicionar botão:

Compartilhar resultado

O compartilhamento não deve revelar diretamente o agente correto.

10. Interface

A interface deve possuir uma aparência moderna, minimalista e voltada para jogos.

Estrutura
┌──────────────────────────────────────────────┐
│ LOGO                         🔥 Sequência 12 │
├──────────────────────────────────────────────┤
│                                              │
│              ADIVINHE O AGENTE              │
│                                              │
│           ┌──────────────────┐               │
│           │                  │               │
│           │  IMAGEM BORRADA  │               │
│           │                  │               │
│           └──────────────────┘               │
│                                              │
│        Qual agente você acha que é?          │
│                                              │
│       [ Digite o nome do agente... ]         │
│                                              │
│              Tentativas: 2/6                 │
│                                              │
│  🔍 Pista disponível                         │
│                                              │
└──────────────────────────────────────────────┘


A interface deve funcionar perfeitamente em:

Desktop

Tablet

Mobile

11. Direção visual

Utilizar uma estética inspirada em jogos competitivos modernos, porém com identidade própria.

Características

Fundo escuro

Alto contraste

Cards com bordas discretas

Tipografia moderna

Elementos com cantos levemente arredondados

Microanimações

Transições suaves

Estados de sucesso e erro claramente diferenciados

Cores

Base:

Background: #0B0D10
Surface:    #15181D
Border:     #272C33
Text:       #F5F5F5
Muted:      #8B929D
Accent:     cor configurável
Success:    #35D07F
Error:      #FF4D61


As cores devem ser centralizadas em variáveis de tema.

12. Página inicial

A home deve explicar rapidamente o funcionamento.

Exemplo:

ADIVINHE O AGENTE

Você consegue descobrir quem é?

Observe a imagem.
Digite seu palpite.
Use as pistas.
Descubra o agente com o menor número de tentativas.

[ JOGAR AGORA ]


Também apresentar:

melhor pontuação;

sequência atual;

melhor sequência;

partidas jogadas;

taxa de acerto.

13. Estatísticas

Criar uma página ou modal de estatísticas.

Exibir:

ESTATÍSTICAS

Partidas jogadas       127
Acertos                108
Taxa de acerto         85%
Sequência atual        12
Melhor sequência       27
Média de tentativas    2.8


As estatísticas devem ser persistidas localmente inicialmente.

Se houver backend, permitir sincronização por conta.

14. Banco de dados de agentes

Criar uma estrutura de dados organizada para os agentes.

Exemplo:

{
  "id": "agent-id",
  "name": "Agent Name",
  "role": "role",
  "country": "country",
  "releaseDate": "YYYY-MM-DD",
  "image": "/agents/agent-name.webp",
  "portrait": "/agents/agent-name-portrait.webp",
  "abilities": [
    {
      "name": "Ability",
      "image": "/abilities/ability.webp"
    }
  ]
}


Não deixar informações dos agentes espalhadas pelo código.

O conteúdo deve ser facilmente atualizável.

15. Arquitetura

Separar claramente:

UI
├── Home
├── Game
├── Results
├── Statistics
└── Settings

Game Logic
├── Agent Selector
├── Guess Validator
├── Hint System
├── Image Reveal System
├── Score Calculator
└── Game State

Data
├── Agents
├── Abilities
└── Game Configuration


A lógica do jogo não deve depender diretamente dos componentes visuais.

Isso permitirá adicionar novos modos posteriormente sem reescrever o sistema inteiro.

16. Sistema de estado

A partida deve possuir estados bem definidos:

IDLE
↓
LOADING
↓
PLAYING
↓
GUESSING
↓
INCORRECT
↓
PLAYING
↓
CORRECT
↓
RESULT


Também deve existir um estado de derrota quando o jogador atingir o número máximo de tentativas.

17. Experiência de usuário

Prioridades:

O jogador deve entender o jogo em poucos segundos.

O próximo palpite deve ser sempre óbvio.

O feedback de acerto/erro deve ser imediato.

As animações devem melhorar a experiência, não atrasá-la.

O jogo deve funcionar bem mesmo em telas pequenas.

O carregamento das imagens deve ser otimizado.

O jogador deve conseguir iniciar uma nova rodada rapidamente.

18. Animações

Adicionar microinterações para tornar o jogo mais envolvente.

Acerto

Imagem deixa de estar borrada.

Pequeno efeito de escala.

Confetes ou partículas discretas.

Destaque verde.

Animação de pontuação.

Erro

Campo de resposta realiza uma pequena animação lateral.

Destaque vermelho temporário.

Nova parte da imagem é revelada.

Nova pista

Pista aparece com fade + slide.

Destacar visualmente a nova informação.

As animações devem respeitar prefers-reduced-motion.

19. Responsividade
Desktop

Utilizar uma área centralizada e relativamente ampla.

Mobile

A imagem deve ocupar a maior parte da área disponível.

Os controles devem ser facilmente acessíveis com o polegar.

O campo de resposta deve permanecer próximo à imagem.

Evitar interfaces excessivamente horizontais.

20. Acessibilidade

Implementar:

navegação por teclado;

foco visível;

labels nos campos;

contraste adequado;

textos alternativos para imagens;

suporte a leitores de tela;

prefers-reduced-motion;

feedback que não dependa exclusivamente de cor.

21. Performance

O jogo deve carregar rapidamente.

Implementar:

lazy loading quando apropriado;

imagens otimizadas;

formatos modernos de imagem;

preload da imagem da rodada;

cache de assets;

evitar downloads desnecessários.

O próximo agente pode ser pré-carregado em segundo plano após o início da partida atual.

22. Regras importantes

Não permitir que o agente correto seja descoberto diretamente pelo código enviado ao cliente quando isso comprometer o jogo.

Validar respostas de forma consistente.

Evitar duplicação de agentes.

Garantir que o sistema consiga adicionar novos agentes sem alterações na lógica principal.

Não revelar pistas futuras antes da hora.

Permitir configurar facilmente número máximo de tentativas, dificuldade, blur e quantidade de pistas.

A seleção do agente deve possuir aleatoriedade controlada para evitar repetições excessivas.

23. Configuração de dificuldade

Criar presets:

Fácil

Imagem pouco borrada

Muitas pistas

8 tentativas

Normal

Imagem moderadamente borrada

Pistas progressivas

6 tentativas

Difícil

Imagem muito borrada

Poucas pistas

5 tentativas

Insano

Imagem extremamente borrada

Sem pistas automáticas

3 tentativas

24. Critérios de aceitação

A primeira versão será considerada funcional quando:

 O jogador consegue iniciar uma partida.

 Um agente é selecionado corretamente.

 A imagem aparece borrada.

 O jogador consegue pesquisar agentes.

 Respostas inválidas são bloqueadas.

 Respostas incorretas são registradas.

 A imagem é progressivamente revelada.

 Pistas são desbloqueadas.

 O sistema identifica respostas corretas.

 Existe tela de resultado.

 Existe sistema básico de pontuação.

 Existe contador de tentativas.

 Estatísticas são armazenadas.

 O jogo funciona em desktop e mobile.

 O layout possui estados de loading, erro, sucesso e partida finalizada.

 A arquitetura permite adicionar novos modos de jogo.

25. Objetivo final

O resultado deve parecer um produto completo e polido, e não apenas uma demonstração técnica.

A prioridade é criar um loop extremamente simples:

Ver → Pensar → Chutar → Receber pista → Tentar novamente → Acertar → Jogar novamente

A experiência deve ser rápida o suficiente para que o jogador queira iniciar várias partidas consecutivas.

A primeira versão deve concentrar esforços na mecânica Adivinhe o Agente, deixando a arquitetura preparada para posteriormente adicionar os modos de Silhueta, Habilidade, Voz, Ultimate, Emoji e Agente do Dia.