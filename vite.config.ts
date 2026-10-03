import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function apiMiddlewarePlugin() {
  return {
    name: 'api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';

        // GET /api/events
        if (url === '/api/events' && req.method === 'GET') {
          try {
            const filePath = path.resolve(process.cwd(), 'data', 'events.json');
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
              return;
            }
          } catch (e) {
            console.error('Error reading events:', e);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
          return;
        }

        // POST /api/events
        if (url === '/api/events' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const filePath = path.resolve(process.cwd(), 'data', 'events.json');
              fs.writeFileSync(filePath, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: JSON.parse(body).length }));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // GET /api/enquiries
        if (url === '/api/enquiries' && req.method === 'GET') {
          try {
            const filePath = path.resolve(process.cwd(), 'data', 'enquiries.json');
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
              return;
            }
          } catch (e) {
            console.error('Error reading enquiries:', e);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
          return;
        }

        // POST /api/enquiries
        if (url === '/api/enquiries' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const filePath = path.resolve(process.cwd(), 'data', 'enquiries.json');
              let existing: any[] = [];
              if (fs.existsSync(filePath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  // ignored
                }
              }
              const newRecord = JSON.parse(body);
              const updated = [newRecord, ...existing.filter((item: any) => item.id !== newRecord.id)];
              fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, record: newRecord }));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // PUT /api/enquiries/:id
        if (url.startsWith('/api/enquiries/') && req.method === 'PUT') {
          const id = url.split('/api/enquiries/')[1]?.split('?')[0];
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const filePath = path.resolve(process.cwd(), 'data', 'enquiries.json');
              if (fs.existsSync(filePath)) {
                const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const { status } = JSON.parse(body);
                const updated = existing.map((item: any) => (item.id === id ? { ...item, status } : item));
                fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // DELETE /api/enquiries/:id
        if (url.startsWith('/api/enquiries/') && req.method === 'DELETE') {
          const id = url.split('/api/enquiries/')[1]?.split('?')[0];
          try {
            const filePath = path.resolve(process.cwd(), 'data', 'enquiries.json');
            if (fs.existsSync(filePath)) {
              const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              const updated = existing.filter((item: any) => item.id !== id);
              fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ command }) => {
  // Dynamic base path:
  // - In dev server (AI Studio): '/'
  // - In Cloudflare Pages (CF_PAGES=1): '/' (hosted at root domain)
  // - On GitHub Pages / default: '/Dhaka-Night-Market/'
  const getBasePath = () => {
    if (command === 'serve') return '/';
    if (process.env.CF_PAGES === '1' || process.env.CF_PAGES_COMMIT_SHA) return '/';
    if (process.env.VITE_BASE_PATH) return process.env.VITE_BASE_PATH;
    if (process.env.BASE_PATH) return process.env.BASE_PATH;
    if (process.env.GITHUB_ACTIONS === 'true') return '/Dhaka-Night-Market/';
    return '/Dhaka-Night-Market/';
  };

  return {
    base: getBasePath(),
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          about: path.resolve(__dirname, 'about.html'),
          admin: path.resolve(__dirname, 'admin.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          events: path.resolve(__dirname, 'events.html'),
          experience: path.resolve(__dirname, 'experience.html'),
          gallery: path.resolve(__dirname, 'gallery.html'),
          partners: path.resolve(__dirname, 'partners.html'),
          stories: path.resolve(__dirname, 'stories.html'),
          vendors: path.resolve(__dirname, 'vendors.html'),
          notFound: path.resolve(__dirname, '404.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
