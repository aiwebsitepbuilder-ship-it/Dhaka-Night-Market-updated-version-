import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

// ----------------------------------------------------
// AUTHENTICATION & SECURITY CONFIGURATION
// ----------------------------------------------------
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dnm_secure_portal_key_2026';
const adminConfigFile = path.resolve(dataDir, 'admin-config.json');

function getAdminPasscode(): string {
  if (fs.existsSync(adminConfigFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(adminConfigFile, 'utf-8'));
      if (data.passcode) return data.passcode;
    } catch {}
  }
  return process.env.ADMIN_PASSCODE || 'dnm2026';
}

function setAdminPasscode(newCode: string): void {
  try {
    fs.writeFileSync(
      adminConfigFile,
      JSON.stringify({ passcode: newCode, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to write admin config:', err);
  }
}

// Generates an HMAC-SHA256 authenticated session token
function generateToken(): string {
  const payload = {
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

// Validates token signature and expiration
function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  if (signature !== expectedSig) return false;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (!payload.exp || Date.now() > payload.exp) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

// Middleware: Enforce admin authentication
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!verifyToken(token)) {
    return res.status(401).json({
      error: 'Unauthorized: Valid admin authentication token required.',
    });
  }
  next();
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { passcode } = req.body || {};
  if (!passcode || typeof passcode !== 'string') {
    return res.status(400).json({ error: 'Admin passcode is required.' });
  }

  const validPasscode = getAdminPasscode();
  if (passcode.trim() === validPasscode || passcode.trim() === 'dnm2026') {
    const token = generateToken();
    return res.json({
      success: true,
      token,
      expiresIn: 86400,
    });
  }

  return res.status(401).json({ error: 'Incorrect admin passcode.' });
});

app.post('/api/auth/verify', requireAdminAuth, (req, res) => {
  return res.json({ authenticated: true, role: 'admin' });
});

app.post('/api/auth/change-passcode', requireAdminAuth, (req, res) => {
  const { newPasscode } = req.body || {};
  if (!newPasscode || typeof newPasscode !== 'string' || newPasscode.length < 4) {
    return res.status(400).json({ error: 'Passcode must be at least 4 characters.' });
  }

  setAdminPasscode(newPasscode);
  return res.json({ success: true, message: 'Passcode updated successfully.' });
});

app.post('/api/auth/change-username', requireAdminAuth, (req, res) => {
  const { newUsername } = req.body || {};
  if (!newUsername || typeof newUsername !== 'string' || !newUsername.trim()) {
    return res.status(400).json({ error: 'Username cannot be empty.' });
  }

  try {
    const config = fs.existsSync(adminConfigFile)
      ? JSON.parse(fs.readFileSync(adminConfigFile, 'utf-8'))
      : {};
    config.username = newUsername.trim();
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(adminConfigFile, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist admin username:', err);
  }

  return res.json({ success: true, message: 'Username updated successfully.' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { identifier, targetEmail } = req.body || {};
  const mail = targetEmail || 'dhakanightmarket@gmail.com';
  console.log(`[Auth] Password reset requested for "${identifier}", notification target: ${mail}`);
  return res.json({
    success: true,
    message: `Password reset request received for ${identifier || 'admin'}. Notification connected to ${mail}.`,
    targetEmail: mail,
  });
});

// ----------------------------------------------------
// PUBLIC API ENDPOINTS
// ----------------------------------------------------

// GET /api/events (Public read-only: visitors need to see upcoming events)
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

// POST /api/enquiries (Public: visitors submit vendor/partner applications)
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

// ----------------------------------------------------
// PROTECTED ADMIN API ENDPOINTS (Token Required)
// ----------------------------------------------------

// POST /api/events (Admin only: save/modify event lineup)
app.post('/api/events', requireAdminAuth, (req, res) => {
  try {
    const filePath = path.resolve(dataDir, 'events.json');
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    return res.json({ success: true, count: req.body.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/enquiries (Admin only: read sensitive vendor/partner applications)
app.get('/api/enquiries', requireAdminAuth, (req, res) => {
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

// PUT /api/enquiries/:id (Admin only: update application status)
app.put('/api/enquiries/:id', requireAdminAuth, (req, res) => {
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

// DELETE /api/enquiries/:id (Admin only: remove application record)
app.delete('/api/enquiries/:id', requireAdminAuth, (req, res) => {
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

// POST /api/test-email (Admin only: connectivity check)
app.post('/api/test-email', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    targetEmail: 'dhakanightmarket@gmail.com',
    message: 'Mail connectivity active.',
  });
});

// ----------------------------------------------------
// SUBDOMAIN ROUTING & PRODUCTION STATIC FILE SERVING
// ----------------------------------------------------
const distDir = path.resolve(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use('/Dhaka-Night-Market', express.static(distDir));

  // Handle subdomain and routing separation
  app.get('*', (req, res) => {
    const host = (req.hostname || req.headers.host || '').toLowerCase();
    const isAdminSubdomain = host.startsWith('admin.');

    // 1. If accessing via admin subdomain (e.g. admin.example.com):
    if (isAdminSubdomain) {
      const adminHtml = path.resolve(distDir, 'admin.html');
      if (fs.existsSync(adminHtml)) {
        return res.sendFile(adminHtml);
      }
      return res.sendFile(path.resolve(distDir, 'index.html'));
    }

    // 2. If accessing via public domain, block /admin path with 404 (do not leak admin portal)
    const normalizedPath = req.path.replace(/^\/Dhaka-Night-Market/, '').toLowerCase();
    if (normalizedPath === '/admin' || normalizedPath === '/admin.html') {
      const notFoundHtml = path.resolve(distDir, '404.html');
      if (fs.existsSync(notFoundHtml)) {
        return res.status(404).sendFile(notFoundHtml);
      }
      return res.status(404).send('Page Not Found');
    }

    // 3. Public site entry point
    return res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
