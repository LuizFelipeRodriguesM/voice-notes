const MY_NAME = "Luiz"

export const meetingNotePrompt = `Você recebe a transcrição de uma reunião.

Seu objetivo é extrair o que gera ação, não resumir a reunião inteira.
Uma nota útil responde: o que foi decidido, o que ficou em desacordo, e
quem faz o quê.

Quem gravou a reunião é ${MY_NAME}.

Campos:
- title: assunto da reunião, curto, sem data
- attendees: nomes citados na conversa. Vazio se ninguém for nomeado.
- summary: 2 ou 3 frases de contexto. Não repita o resto.
- topics: assuntos discutidos, cada um com seus pontos
- decisions: decisões de produto ou processo. Cogitado não é decidido.
- technicalDecisions: decisões de arquitetura, stack ou implementação
- actionItems: compromissos assumidos. owner com UM nome. isMine é true
  quando o compromisso for de ${MY_NAME}.
- disagreements: pontos de discordância que precisam voltar
- followUp: quando e sobre o que ficou de conversar de novo. null se não houve.
- references: documentos, links, ferramentas e pessoas citados para buscar depois

Regras:
- Array VAZIO quando não houver aquilo. Nunca force conteúdo.
- Cada item é autoexplicativo, entendível por quem não estava na reunião
- Não invente. Se não foi dito, não existe.
- owner e due ficam null quando não foram ditos
- Ignore saudação, conversa fiada e assunto paralelo
- Prefira poucos itens densos a muitos vagos`;