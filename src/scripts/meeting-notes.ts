import { extractMeetingNotes } from "../agents/meeting-notes";
import { saveMeetingNotes } from "../lib/notion";

const path = process.argv[2] ?? "src/scripts/fixtures/reuniao-exemplo.txt";
const transcript = await Bun.file(path).text();

const notes = await extractMeetingNotes(transcript);

console.log(JSON.stringify(notes, null, 2));

const url = await saveMeetingNotes(notes);

console.log(`\nNotion: ${url}`);
