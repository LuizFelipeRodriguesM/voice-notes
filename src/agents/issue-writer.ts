import { env } from "@env";
import { z } from "zod";

const COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

const issueSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(8000),
  labels: z.array(z.enum(["bug", "feature", "chore", "docs", "refactor"])),
});

const decisionSchema = z.object({
  decision: z.enum(["create", "discard"]),
  reason: z.string().min(1),
  issue: issueSchema.nullable(),
});

export type IssueDecision = z.infer<typeof decisionSchema>;

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

const INSTRUCTIONS = `Você recebe a transcrição de uma nota de voz de um desenvolvedor.

Decida se ela deve virar uma issue de GitHub.

Descarte quando: for ruído, silêncio, conversa pessoal, ou vaga demais para virar tarefa.
Crie quando houver problema, tarefa ou ideia identificável, mesmo curta.
Na dúvida, descarte: issue ruim custa mais caro que issue não criada.

Se criar:
- title: uma linha, sem ponto final, direto ao problema
- body: markdown com contexto e, se houver, passos para reproduzir
- Não invente detalhes que não estão na transcrição
- Corrija erros de transcrição em termos técnicos pelo contexto`;

export async function writeIssue(transcript: string): Promise<IssueDecision> {
  if (transcript.trim().length < 10) {
    return { decision: "discard", reason: "transcrição vazia", issue: null };
  }

  const response = await fetch(COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      messages: [
        { role: "system", content: INSTRUCTIONS },
        { role: "user", content: transcript },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "issue_decision",
          strict: true,
          schema: z.toJSONSchema(decisionSchema),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Issue generation failed (${response.status}): ${await response.text()}`);
  }

  const completion = completionSchema.parse(await response.json());
  const parsed = decisionSchema.safeParse(JSON.parse(completion.choices[0]!.message.content));

  if (!parsed.success) {
    throw new Error(`Invalid issue payload: ${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}