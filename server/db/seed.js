import { initDatabase } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/songscryer.db');
const cardsPath = path.join(__dirname, '../../data/cards.json');

const db = initDatabase(dbPath);
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const insert = db.prepare('INSERT OR IGNORE INTO cards (id, prompt, tone) VALUES (?, ?, ?)');
const insertMany = db.transaction((cards) => {
  let count = 0;
  for (const card of cards) {
    const result = insert.run(card.id, card.prompt, card.tone);
    count += result.changes;
  }
  return count;
});

const inserted = insertMany(cards);
console.log(`Seeded ${inserted} card(s) (${cards.length - inserted} already existed)`);
db.close();
