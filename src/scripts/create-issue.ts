import { writeIssue } from "../agents/issue-writer.ts";

const transcript = "Trocar todas as variaveis de ambiente vazadas"

console.log(await writeIssue(transcript));