/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EventsProvider } from './context/EventsContext';
import { AdminPage } from './pages/AdminPage';
import { Language } from './types';
import { Shield, Globe, ExternalLink } from 'lucide-react';

export default function AdminApp() {
  const lang: Language = 'en';

  // Set page title for Admin Portal
  useEffect(() => {
    document.title = 'Admin & Organizer Portal – Dhaka Night Market';
  }, []);

  // Determine public website URL
  const publicWebsiteUrl =
    (import.meta as any).env?.VITE_PUBLIC_URL ||
    (window.location.hostname.startsWith('admin.')
      ? `${window.location.protocol}//${window.location.hostname.replace(/^admin\./, '')}`
      : '/');

  return (
    <EventsProvider>
      <div className="min-h-screen flex flex-col bg-[#070B19] text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans">
        {/* Dedicated Admin Portal Header */}
        <header className="sticky top-0 z-50 w-full border-b border-amber-500/20 bg-[#070B19]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold">
                <Shield className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight text-white font-display">
                    Dhaka Night Market
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Admin Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                  admin.{window.location.hostname.replace(/^admin\./, '') || 'example.com'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Public Website Link */}
              <a
                href={publicWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">View Public Website</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </header>

        {/* Admin Workspace Content */}
        <main className="flex-1 w-full pb-16">
          <AdminPage
            onNavigate={(page) => {
              window.open(`${publicWebsiteUrl}#/${page}`, '_blank');
            }}
            lang={lang}
          />
        </main>

        {/* Dedicated Minimal Admin Footer */}
        <footer className="w-full border-t border-slate-900 bg-[#050814] py-4 text-center text-xs text-slate-400">
          <p>
            Dhaka Night Market Secure Admin Portal • Authorized Organizer Personnel Only
          </p>
        </footer>
      </div>
    </EventsProvider>
  );
}
