// Забирает зашифрованные ответы из ntfy (там они живут 12 часов)
// и складывает в answers.json, чтобы ничего не потерялось.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const topic = process.env.TOPIC;
const file = 'answers.json';
if (!topic) throw new Error('TOPIC is not set');

const old = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8') || '[]') : [];
const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
if (!res.ok) throw new Error(`ntfy responded ${res.status}`);

const incoming = (await res.text())
  .split('\n')
  .filter(Boolean)
  .map(line => JSON.parse(line))
  .filter(m => m.event === 'message' && m.message);

const known = new Set(old.map(m => m.message));
let added = 0;
for (const m of incoming) {
  if (known.has(m.message)) continue;
  known.add(m.message);
  old.push({ id: m.id, time: m.time, message: m.message });
  added++;
}

if (!added) {
  console.log('Новых ответов нет');
} else {
  old.sort((a, b) => a.time - b.time);
  writeFileSync(file, JSON.stringify(old, null, 1) + '\n');
  console.log(`Добавлено: ${added}`);
}
