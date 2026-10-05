import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Detect whether visitor is accessing via the dedicated admin subdomain (e.g., admin.example.com)
const hostname = window.location.hostname.toLowerCase();
const isAdminSubdomain =
  hostname.startsWith('admin.') ||
  window.location.search.includes('__admin=true');

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    {isAdminSubdomain ? <AdminApp /> : <App />}
  </ErrorBoundary>
);

