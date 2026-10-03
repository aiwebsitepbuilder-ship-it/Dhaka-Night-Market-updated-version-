import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio nginx proxies external port 8080 to internal port 3000
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data folder exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// API Routes
app.get('/api/events', (req, res) => {
  try {
    const filePath = path.resolve(dataDir, 'events.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return res.json(JSON.parse(data));
    }
  } catch (err) {
    console.error('Error reading events:', err);
  }
  return res.json([]);
});

app.post('/api/events', (req, res) => {
  try {
    const filePath = path.resolve(dataDir, 'events.json');
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    return res.json({ success: true, count: req.body.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/enquiries', (req, res) => {
  try {
    const filePath = path.resolve(dataDir, 'enquiries.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return res.json(JSON.parse(data));
    }
  } catch (err) {
    console.error('Error reading enquiries:', err);
  }
  return res.json([]);
});

app.post('/api/enquiries', (req, res) => {
  try {
    const filePath = path.resolve(dataDir, 'enquiries.json');
    let existing: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {}
    }
    const newRecord = req.body;
    const updated = [newRecord, ...existing.filter((item: any) => item.id !== newRecord.id)];
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return res.json({ success: true, record: newRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/enquiries/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filePath = path.resolve(dataDir, 'enquiries.json');
    if (fs.existsSync(filePath)) {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const { status } = req.body;
      const updated = existing.map((item: any) => (item.id === id ? { ...item, status } : item));
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/enquiries/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filePath = path.resolve(dataDir, 'enquiries.json');
    if (fs.existsSync(filePath)) {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const updated = existing.filter((item: any) => item.id !== id);
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/test-email', (req, res) => {
  res.json({
    success: true,
    targetEmail: 'dhakanightmarket@gmail.com',
    message: 'Mail connectivity active.',
  });
});

// Serve dist in production
const distDir = path.resolve(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use('/Dhaka-Night-Market', express.static(distDir));
  app.get('/Dhaka-Night-Market*', (req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
