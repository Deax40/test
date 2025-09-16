import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const toolsFile = path.join(process.cwd(), 'data', 'tools.json');

async function readToolsFile() {
  const content = await fs.readFile(toolsFile, 'utf8');
  return JSON.parse(content);
}

async function writeToolsFile(tools) {
  await fs.writeFile(toolsFile, JSON.stringify(tools, null, 2), 'utf8');
}

export async function getAllTools() {
  return readToolsFile();
}

export async function getToolByHash(hash) {
  const tools = await readToolsFile();
  return tools.find((tool) => tool.hash === hash) ?? null;
}

export async function updateTool(hash, updates) {
  const tools = await readToolsFile();
  const index = tools.findIndex((tool) => tool.hash === hash);

  if (index === -1) {
    throw new Error(`Outil introuvable pour le hash ${hash}`);
  }

  tools[index] = { ...tools[index], ...updates };
  await writeToolsFile(tools);
  revalidatePath('/common');
  revalidatePath('/scan');

  return tools[index];
}
