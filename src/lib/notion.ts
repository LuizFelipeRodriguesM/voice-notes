import { env } from "@env";
import { z } from "zod";
import type { MeetingNotes } from "../agents/meeting-notes";

const NOTION_PAGES_URL = "https://api.notion.com/v1/pages";
const NOTION_VERSION = "2026-03-11";
const MAX_BLOCKS = 100;

type Block = Record<string, unknown>;

const richText = (content: string) => [{ text: { content: content.slice(0, 2000) } }];

const paragraph = (content: string): Block => ({
  object: "block",
  type: "paragraph",
  paragraph: { rich_text: richText(content) },
});

const heading = (content: string): Block => ({
  object: "block",
  type: "heading_2",
  heading_2: { rich_text: richText(content) },
});

const bullet = (content: string): Block => ({
  object: "block",
  type: "bulleted_list_item",
  bulleted_list_item: { rich_text: richText(content) },
});

const todo = (content: string): Block => ({
  object: "block",
  type: "to_do",
  to_do: { rich_text: richText(content), checked: false },
});

export function toNotionBlocks(notes: MeetingNotes): Block[] {
  const blocks: Block[] = [];

  if (notes.attendees.length > 0) {
    blocks.push(paragraph(`Participantes: ${notes.attendees.join(", ")}`));
  }

  blocks.push(paragraph(notes.summary));

  const mine = notes.actionItems.filter((item) => item.isMine);
  const others = notes.actionItems.filter((item) => !item.isMine);

  const action = (item: MeetingNotes["actionItems"][number]) => {
    const owner = item.owner ? ` (${item.owner})` : "";
    const due = item.due ? ` — até ${item.due}` : "";
    return todo(`${item.task}${owner}${due}`);
  };

  if (mine.length > 0) {
    blocks.push(heading("Minhas ações"), ...mine.map(action));
  }

  for (const topic of notes.topics) {
    blocks.push(heading(topic.title), ...topic.points.map(bullet));
  }

  const section = (title: string, items: string[]) => {
    if (items.length === 0) return;
    blocks.push(heading(title), ...items.map(bullet));
  };

  section("Decisões", notes.decisions);
  section("Decisões técnicas", notes.technicalDecisions);

  if (others.length > 0) {
    blocks.push(heading("Ações do time"), ...others.map(action));
  }

  section("A revisitar", notes.disagreements);
  section("Referências", notes.references);

  if (notes.followUp) {
    blocks.push(heading("Próxima conversa"), paragraph(notes.followUp));
  }

  return blocks;
}

const notionPageSchema = z.object({ id: z.string(), url: z.string() });

async function notionFetch(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Notion ${method} failed (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

export async function saveMeetingNotes(notes: MeetingNotes): Promise<string> {
  const blocks = toNotionBlocks(notes);

  const page = notionPageSchema.parse(
    await notionFetch(NOTION_PAGES_URL, "POST", {
      parent: { database_id: env.NOTION_DATABASE_ID },
      properties: {
        Name: { title: richText(notes.title) },
        Date: { date: { start: new Date().toISOString().slice(0, 10) } },
      },
      children: blocks.slice(0, MAX_BLOCKS),
    }),
  );

  for (let i = MAX_BLOCKS; i < blocks.length; i += MAX_BLOCKS) {
    await notionFetch(
      `https://api.notion.com/v1/blocks/${page.id}/children`,
      "PATCH",
      { children: blocks.slice(i, i + MAX_BLOCKS) },
    );
  }

  return page.url;
}