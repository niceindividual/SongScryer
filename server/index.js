import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import { initDatabase } from './db/database.js';
import { submissionsRouter } from './routes/submissions.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/songscryer.db');

// Initialize database
const db = initDatabase(DB_PATH);

// Seed cards on startup (INSERT OR IGNORE is safe to re-run)
async function seedCards() {
  const cardCount = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;
  if (cardCount === 0) {
    const cardsPath = path.join(__dirname, '../data/cards.json');
    if (fs.existsSync(cardsPath)) {
      const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
      const insert = db.prepare('INSERT OR IGNORE INTO cards (id, prompt, tone) VALUES (?, ?, ?)');
      const insertMany = db.transaction((cards) => {
        for (const card of cards) insert.run(card.id, card.prompt, card.tone);
      });
      insertMany(cards);
      console.log(`Seeded ${cards.length} cards`);
    }
  }
}

seedCards();

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());

// API routes
app.use('/api', submissionsRouter(db));

// Serve frontend static files (Vite build output)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback -- /{*splat} matches root / and all sub-paths in Express 5
app.get('/{*splat}', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not built. Run: npm run build' });
  }
});

// Express 5 error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SongScryer server running on port ${PORT}`);
});

export { app };
