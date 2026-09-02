# voice-notes

Gravo uma reunião pelo iPhone e a ata aparece organizada no Notion.

Um atalho do iOS envia o áudio para um servidor Bun, que transcreve, extrai
os pontos que geram ação e cria a página. Sem bot entrando na chamada e sem
app para instalar: o que já existe no celular grava, o resto acontece no
servidor.

```
iPhone (Atalhos)  ──▶  ngrok  ──▶  Bun + LangGraph  ──▶  Notion
     grava áudio          túnel      transcreve,            página da ata
                                     extrai, salva
```

## Por que existe

Ata de reunião presencial é sempre a mesma história: alguém anota pela
metade, ou ninguém anota. Ferramentas prontas resolvem reunião online
capturando o áudio do sistema, o que não serve para quem está numa sala com
outras pessoas.

Aqui o celular no meio da mesa resolve a captura, e o trabalho fica em
transformar 40 minutos de conversa em algo que se lê em dois.

## Como funciona

**Recebe** o áudio como corpo bruto da requisição, autenticado por um token
no header. Valida tamanho e tipo antes de gastar qualquer chamada paga.

**Transcreve** com `gpt-transcribe`, passando contexto sobre o tipo de
gravação para melhorar termos técnicos.

**Extrai** os pontos com saída estruturada: resumo, tópicos, decisões de
produto, decisões técnicas, compromissos com dono e prazo, discordâncias a
revisitar e referências citadas. O modelo é instruído a deixar seções
vazias quando não houver conteúdo, em vez de preencher por preencher.

**Salva** no Notion, montando os blocos a partir da estrutura validada.
Seções vazias não viram título órfão.

Os quatro passos são nós de um grafo do LangGraph. Cada um é uma função
comum que recebe e devolve dados, então dá para testar qualquer etapa sem
subir servidor.

## Decisões

**Sem diarização.** Separar quem falou custa mais caro e exige um modelo que
não aceita glossário. Em reunião presencial as pessoas se nomeiam sozinhas
("o Bruno fica com isso"), então o responsável sai do conteúdo da fala, não
de um rótulo de locutor.

**Saída estruturada em vez de markdown.** O modelo devolve um objeto
validado por schema, e o código gera markdown ou blocos do Notion a partir
dele. Pedir markdown direto obrigaria a fazer o caminho inverso na hora de
falar com a API.

**Um schema, quatro usos.** O mesmo schema Zod instrui o modelo (via JSON
Schema), valida a resposta, gera o tipo TypeScript e descreve o estado do
grafo. Um campo novo se propaga sozinho.

**Validação só na borda.** Zod entra onde o dado vem de fora e pode chegar
torto: variáveis de ambiente, corpo da requisição, resposta dos modelos e do
Notion. Dentro do programa, o TypeScript basta.

**`fetch` puro, sem SDK.** OpenAI e Notion são chamadas HTTP diretas. Menos
dependência, e o que acontece na rede fica visível.

## Rodando

```bash
bun install
cp .env.example .env   # preencha as chaves
bun dev
```

Variáveis necessárias:

| Variável | Para quê |
|---|---|
| `AUDIO_WEBHOOK_SECRET` | token que o atalho envia no header `Authorization` |
| `OPENAI_API_KEY` | transcrição e extração |
| `NOTION_TOKEN` | integração interna do Notion |
| `NOTION_DATABASE_ID` | database onde as atas são criadas |

O database precisa das propriedades `Name` (title) e `Date` (date), e a
integração precisa ser conectada a ele pelo menu do próprio Notion.

Testando sem gravar nada:

```bash
bun run src/scripts/meeting-notes.ts        # usa a transcrição de exemplo
bun run src/scripts/transcribe-file.ts a.m4a
```

## Custo

Cerca de US$ 2 por mês para oito reuniões de uma hora mais algumas notas
curtas. A transcrição responde por quase todo esse valor; o modelo de texto
é ruído no orçamento.

Áudio de uma hora em 44.1kHz estéreo passa do limite de 25MB da API. Mono a
16kHz e 32kbps cabe até 103 minutos, e não há perda: modelos de transcrição
trabalham em 16kHz mono internamente.

## Estado

Funciona ponta a ponta. O que ficou de fora por opção: fila para reuniões
longas (hoje o atalho espera o processamento terminar), classificador entre
tipos de gravação, e criação de issues no GitHub a partir de notas curtas.

## Stack

Bun, TypeScript, LangGraph, Zod, OpenAI, Notion API.
