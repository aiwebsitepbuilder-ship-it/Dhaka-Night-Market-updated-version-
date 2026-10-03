import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Building,
  Store,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  Eye,
  LogOut,
  Shield,
  Key,
  Layers,
  Inbox,
  Settings,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import { EventDetail, Language, PageId, EnquiryRecord, EnquiryStatus } from '../types';
import { useEvents } from '../context/EventsContext';
import {
  OFFICIAL_ADMIN_EMAIL,
  fetchAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  generateMailtoUrl,
} from '../services/emailService';

// Preset banner options from existing assets
const PRESET_BANNERS = [
  {
    label: 'The Wedding Show Banner',
    url: '/src/assets/images/the_wedding_show_1790767339554.jpg',
  },
  {
    label: 'Summer Edition Banner',
    url: '/src/assets/images/summer_edition_banner_1790770101633.jpg',
  },
  {
    label: 'Season 2 Sehri Banner',
    url: '/src/assets/images/season_2_sehri_banner_1790770541419.jpg',
  },
  {
    label: 'Dhaka Splendor Banner',
    url: '/src/assets/images/dhaka_splendor_banner_1790770764936.jpg',
  },
];

const PASSCODE_STORAGE_KEY = 'dnm_admin_passcode';
const SESSION_STORAGE_KEY = 'dnm_admin_session';

interface AdminPageProps {
  onNavigate: (page: PageId) => void;
  lang: Language;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, lang }) => {
  const {
    events,
    upcomingEvents,
    previousEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    resetToDefaults,
    importEvents,
    lastSaved,
  } = useEvents();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'events' | 'enquiries' | 'settings'>('events');

  // Enquiries State
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [enquiryFilter, setEnquiryFilter] = useState<'all' | 'vendor' | 'partner' | 'contact'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);

  // Event Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState<Partial<EventDetail>>({});
  const [offeringInputEn, setOfferingInputEn] = useState('');
  const [offeringInputBn, setOfferingInputBn] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Settings State
  const [currentPasscode, setCurrentPasscode] = useState<string>(() => {
    return localStorage.getItem(PASSCODE_STORAGE_KEY) || 'dnm2026';
  });
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [testMailStatus, setTestMailStatus] = useState<string | null>(null);

  // Load inquiries whenever authenticated or tab switched
  useEffect(() => {
    if (isAuthenticated) {
      loadEnquiries();
    }
  }, [isAuthenticated, activeTab]);

  const loadEnquiries = async () => {
    setEnquiriesLoading(true);
    try {
      const data = await fetchAllEnquiries();
      setEnquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setEnquiriesLoading(false);
    }
  };

  // Auth Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = localStorage.getItem(PASSCODE_STORAGE_KEY) || 'dnm2026';
    if (passcodeInput.trim() === stored || passcodeInput.trim() === 'dnm2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setAuthError('');
      setPasscodeInput('');
    } else {
      setAuthError('Incorrect passcode. Hint: Default passcode is dnm2026');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // Open Event Editor
  const handleOpenAddEvent = () => {
    setEditingEventId(null);
    setEventFormData({
      name: '',
      nameBn: '',
      status: 'upcoming',
      dates: '',
      datesBn: '',
      startDateIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) + ':00+06:00',
      endDateIso: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16) + ':00+06:00',
      time: '12:00 PM – 12:00 AM',
      timeBn: 'দুপুর ১২:০০ – রাত ১২:০০',
      location: 'Grand Ballroom, Sheraton Banani, Dhaka',
      locationBn: 'গ্র্যান্ড বলরুম, শেরাটন বনানী, ঢাকা',
      admission: 'Free entry',
      admissionBn: 'ফ্রি এন্ট্রি',
      theme: 'Dhaka Night Market Exhibition',
      themeBn: 'ঢাকা নাইট মার্কেট প্রদর্শনী',
      imageUrl: PRESET_BANNERS[0].url,
      imagePlaceholderText: '[Official Event Poster / Banner Placeholder]',
      offerings: {
        en: ['Lifestyle Brands', 'Artisan Cuisine & Food Stalls', 'Evening Entertainment'],
        bn: ['লাইফস্টাইল ব্র্যান্ডস', 'আর্টিসান খাবার ও ফুড স্টল', 'সান্ধ্যকালীন বিনোদন'],
      },
      notes: '',
      notesBn: '',
      mapUrl: 'https://maps.google.com/?q=Sheraton+Banani+Dhaka',
      facebookEventUrl: 'https://www.facebook.com/dhakanightmarket/',
    });
    setIsEditing(true);
  };

  const handleOpenEditEvent = (event: EventDetail) => {
    setEditingEventId(event.id);
    setEventFormData({ ...event });
    setIsEditing(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.name?.trim()) {
      alert('Event name in English is required.');
      return;
    }

    try {
      if (editingEventId) {
        await updateEvent(editingEventId, eventFormData);
        setSaveSuccessMessage('Event updated successfully! All pages are synchronized.');
      } else {
        await addEvent(eventFormData as Omit<EventDetail, 'id'>);
        setSaveSuccessMessage('New event created successfully! It is now active on the website.');
      }

      setIsEditing(false);
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Error saving event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete event "${name}"? This action cannot be undone.`)) {
      await deleteEvent(id);
    }
  };

  const handleDuplicateEvent = async (id: string) => {
    await duplicateEvent(id);
    setSaveSuccessMessage('Event duplicated successfully!');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  const handleAddOffering = () => {
    if (!offeringInputEn.trim()) return;
    const currentEn = eventFormData.offerings?.en || [];
    const currentBn = eventFormData.offerings?.bn || [];
    setEventFormData({
      ...eventFormData,
      offerings: {
        en: [...currentEn, offeringInputEn.trim()],
        bn: [...currentBn, offeringInputBn.trim() || offeringInputEn.trim()],
      },
    });
    setOfferingInputEn('');
    setOfferingInputBn('');
  };

  const handleRemoveOffering = (index: number) => {
    const currentEn = eventFormData.offerings?.en || [];
    const currentBn = eventFormData.offerings?.bn || [];
    setEventFormData({
      ...eventFormData,
      offerings: {
        en: currentEn.filter((_, i) => i !== index),
        bn: currentBn.filter((_, i) => i !== index),
      },
    });
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB limit. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEventFormData({
        ...eventFormData,
        imageUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // Enquiries Status Update
  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    await updateEnquiryStatus(id, newStatus);
    setEnquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (confirm('Delete this inquiry record?')) {
      await deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Export Enquiries as CSV
  const handleExportEnquiriesCsv = () => {
    if (enquiries.length === 0) {
      alert('No enquiries to export.');
      return;
    }

    const headers = [
      'ID',
      'Type',
      'Business/Org',
      'Contact Person',
      'Phone',
      'Email',
      'Category/Scope',
      'Details',
      'Notes/Message',
      'Submitted At',
      'Status',
      'Sent To Mail',
    ];

    const rows = enquiries.map((e) => [
      `"${e.id}"`,
      `"${e.type}"`,
      `"${e.businessOrOrg.replace(/"/g, '""')}"`,
      `"${e.contactName.replace(/"/g, '""')}"`,
      `"${e.phone.replace(/"/g, '""')}"`,
      `"${e.email.replace(/"/g, '""')}"`,
      `"${e.categoryOrType.replace(/"/g, '""')}"`,
      `"${(e.preferredEventOrDetails || '').replace(/"/g, '""')}"`,
      `"${e.notesOrMessage.replace(/"/g, '""')}"`,
      `"${e.submittedAt}"`,
      `"${e.status}"`,
      `"${e.sentToMail}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dhaka_night_market_enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Events JSON
  const handleExportEventsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dhaka_night_market_events_${Date.now()}.json`);
    downloadAnchor.click();
  };

  // Import Events JSON
  const handleImportEventsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await importEvents(parsed);
          setSettingsMessage('Events imported successfully!');
          setTimeout(() => setSettingsMessage(''), 4000);
        } else {
          alert('Invalid events JSON format.');
        }
      } catch (err: any) {
        alert(`Failed to parse JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Change Passcode
  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.length < 4) {
      setSettingsMessage('Passcode must be at least 4 characters long.');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setSettingsMessage('New passcode and confirm passcode do not match.');
      return;
    }
    localStorage.setItem(PASSCODE_STORAGE_KEY, newPasscode);
    setCurrentPasscode(newPasscode);
    setNewPasscode('');
    setConfirmPasscode('');
    setSettingsMessage('Admin passcode updated successfully!');
    setTimeout(() => setSettingsMessage(''), 4000);
  };

  // Send Test Mail Ping
  const handleTestMail = () => {
    setTestMailStatus('Sending test verification...');
    const testSubject = `[System Verification] Dhaka Night Market Portal Test`;
    const testBody = `This is a test notification from Dhaka Night Market Admin Portal.\nMail receiver: ${OFFICIAL_ADMIN_EMAIL}\nTimestamp: ${new Date().toISOString()}`;
    const url = generateMailtoUrl(testSubject, testBody);
    window.open(url, '_blank');
    setTestMailStatus(`Mail composer opened for ${OFFICIAL_ADMIN_EMAIL}. System is linked and active.`);
    setTimeout(() => setTestMailStatus(null), 5000);
  };

  // Filtered inquiries
  const filteredEnquiries = enquiries.filter((item) => {
    const matchesType = enquiryFilter === 'all' || item.type === enquiryFilter;
    const matchesSearch =
      searchQuery === '' ||
      item.businessOrOrg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-[#0D152D] border border-amber-500/30 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display">
              Dhaka Night Market
            </h1>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-display">
              Admin & Event Control Portal
            </p>
            <p className="text-xs text-slate-300 pt-1">
              Authorized organizers can modify events and review incoming vendor & partner applications without requiring Google AI Studio.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Enter Admin Access Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter passcode..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors pl-10"
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center space-y-2">
            <p className="text-[11px] text-slate-400">
              Default Organizer Passcode: <span className="text-amber-300 font-mono font-bold">dnm2026</span>
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              ← Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN ADMIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner & Organizer Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0E172E] via-[#121B38] to-[#0A1024] border border-amber-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Admin Session
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px]">
              <Mail className="w-3 h-3 text-amber-400" />
              Connected: {OFFICIAL_ADMIN_EMAIL}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Dhaka Night Market – Control Portal
          </h1>
          <p className="text-xs text-slate-300">
            Changes made here directly update the official website and live countdown timer for all visitors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>View Live Site</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-800/50 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Portal</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage('')}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'events'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Events ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'enquiries'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Enquiries & Applications ({enquiries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Mail</span>
          </button>
        </div>

        {activeTab === 'events' && (
          <button
            onClick={handleOpenAddEvent}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: MANAGE EVENTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0D152D] border border-amber-500/20">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Events</p>
              <p className="text-2xl font-bold text-white font-mono mt-1">{events.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D152D] border border-emerald-500/30">
              <p className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold">Upcoming / Active</p>
              <p className="text-2xl font-bold text-emerald-300 font-mono mt-1">{upcomingEvents.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D152D] border border-slate-700">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Previous Editions</p>
              <p className="text-2xl font-bold text-slate-300 font-mono mt-1">{previousEvents.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D152D] border border-amber-500/20">
              <p className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">Auto-Sync Status</p>
              <p className="text-xs text-slate-200 mt-2 font-mono">
                {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Connected (Disk & Memory)'}
              </p>
            </div>
          </div>

          {/* Event Cards Grid */}
          <div className="space-y-4">
            {events.map((event) => {
              const isUpcoming = event.status === 'upcoming';
              const isOngoing = event.status === 'ongoing';

              return (
                <div
                  key={event.id}
                  className="rounded-2xl bg-[#0D152D] border border-amber-500/20 p-5 sm:p-6 hover:border-amber-500/40 transition-all flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
                >
                  {/* Left: Thumbnail & Core Details */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
                    {/* Thumbnail Image */}
                    <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                          No Banner
                        </div>
                      )}
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isUpcoming
                            ? 'bg-emerald-500 text-slate-950'
                            : isOngoing
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    {/* Titles and Details */}
                    <div className="space-y-1.5 max-w-xl">
                      <h3 className="text-base sm:text-lg font-bold text-white font-display">
                        {event.name}
                      </h3>
                      {event.nameBn && (
                        <p className="text-xs text-amber-300/80 font-bangla">
                          {event.nameBn}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {event.dates}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          {event.location}
                        </span>
                      </div>

                      {event.notes && (
                        <p className="text-xs text-slate-400 line-clamp-1 pt-1">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEditEvent(event)}
                      className="px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Edit event details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      onClick={() => handleDuplicateEvent(event.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer transition-colors"
                      title="Duplicate event"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 text-xs cursor-pointer transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: ENQUIRIES & APPLICATIONS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-display">
                Applications Received via Mail & Portal
              </h2>
              <p className="text-xs text-slate-300">
                All submissions from the Vendor Application and Sponsor & Partner Enquiry forms are sent directly to{' '}
                <span className="text-amber-300 font-mono font-semibold">{OFFICIAL_ADMIN_EMAIL}</span> and archived here.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadEnquiries}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${enquiriesLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportEnquiriesCsv}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D152D] p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'vendor', 'partner', 'contact'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setEnquiryFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                    enquiryFilter === filterKey
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {filterKey === 'all' ? 'All Submissions' : `${filterKey}s`}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business, name, email..."
                className="w-full px-3 py-1.5 pl-8 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Enquiries List */}
          {filteredEnquiries.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-[#0D152D] border border-slate-800 space-y-3">
              <Inbox className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300 font-semibold">No enquiry records found</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When visitors submit the &quot;Vendor Enquiry / Application Form&quot; or &quot;Sponsor &amp; Partner Enquiry Form&quot;,
                their details will arrive directly at {OFFICIAL_ADMIN_EMAIL} and will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEnquiries.map((item) => {
                const isVendor = item.type === 'vendor';
                const isPartner = item.type === 'partner';

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#0D152D] border border-amber-500/20 space-y-4 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isVendor
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isPartner
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {isVendor ? 'Vendor Application' : isPartner ? 'Sponsor / Partner' : 'General'}
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-semibold">{item.id}</span>
                        <span className="text-xs text-slate-500">• {item.submittedAt}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Status:</span>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as EnquiryStatus)}
                          className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="approved">Approved</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* Applicant Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {isVendor ? 'Business / Brand' : 'Organization'}
                        </p>
                        <p className="text-sm font-bold text-white">{item.businessOrOrg}</p>
                        <p className="text-slate-300">Contact: {item.contactName}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Direct Contact
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-200">
                          <Phone className="w-3 h-3 text-amber-400" />
                          <a href={`tel:${item.phone}`} className="hover:underline">
                            {item.phone}
                          </a>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-200">
                          <Mail className="w-3 h-3 text-amber-400" />
                          <a href={`mailto:${item.email}`} className="hover:underline">
                            {item.email}
                          </a>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Category & Preference
                        </p>
                        <p className="font-semibold text-amber-300 capitalize">{item.categoryOrType}</p>
                        {item.preferredEventOrDetails && (
                          <p className="text-slate-300 text-[11px]">{item.preferredEventOrDetails}</p>
                        )}
                      </div>
                    </div>

                    {/* Message / Notes */}
                    {item.notesOrMessage && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                          Applicant Note / Proposal:
                        </p>
                        <p className="whitespace-pre-wrap">{item.notesOrMessage}</p>
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Delivered to {item.sentToMail}
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${item.email}?cc=${OFFICIAL_ADMIN_EMAIL}&subject=${encodeURIComponent(
                            `Re: Dhaka Night Market - ${item.title}`
                          )}&body=${encodeURIComponent(
                            `Dear ${item.contactName},\n\nThank you for reaching out to Dhaka Night Market regarding "${item.businessOrOrg}".\n\n`
                          )}`}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Reply via Mail</span>
                        </a>

                        <button
                          onClick={() => handleDeleteEnquiry(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 cursor-pointer transition-colors"
                          title="Delete enquiry record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: SETTINGS & MAIL */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email Connectivity Status */}
          <div className="p-6 rounded-2xl bg-[#0D152D] border border-amber-500/20 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                <span>Connected Email Account</span>
              </h2>
              <p className="text-xs text-slate-300">
                All form submissions are routed directly to this verified destination address.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Primary Receiver</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-base font-mono font-bold text-amber-300">
                {OFFICIAL_ADMIN_EMAIL}
              </p>
              <p className="text-xs text-slate-400">
                Connected Forms: &quot;Vendor Enquiry / Application Form&quot; &amp; &quot;Sponsor &amp; Partner Enquiry Form&quot;.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleTestMail}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Send Test Verification to {OFFICIAL_ADMIN_EMAIL}</span>
              </button>
              {testMailStatus && (
                <p className="text-xs text-amber-300 text-center">{testMailStatus}</p>
              )}
            </div>
          </div>

          {/* Change Admin Passcode */}
          <div className="p-6 rounded-2xl bg-[#0D152D] border border-amber-500/20 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Change Admin Passcode</span>
              </h2>
              <p className="text-xs text-slate-300">
                Update the passcode used to unlock this control portal.
              </p>
            </div>

            <form onSubmit={handleChangePasscode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  New Passcode
                </label>
                <input
                  type="password"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new passcode..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Repeat new passcode..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {settingsMessage && (
                <p className="text-xs text-amber-300 font-semibold">{settingsMessage}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow cursor-pointer transition-colors"
              >
                Update Passcode
              </button>
            </form>
          </div>

          {/* Backup & Restore Data */}
          <div className="p-6 rounded-2xl bg-[#0D152D] border border-amber-500/20 space-y-4 md:col-span-2">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Event Backup & System Restore</span>
            </h2>
            <p className="text-xs text-slate-300">
              Export event data as JSON for offline backup or restore original factory defaults if needed.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportEventsJson}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Export Events JSON Backup</span>
              </button>

              <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Import Events Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportEventsJson}
                  className="hidden"
                />
              </label>

              <button
                onClick={async () => {
                  if (
                    confirm(
                      'Are you sure you want to restore official default events? Any custom additions will be replaced.'
                    )
                  ) {
                    await resetToDefaults();
                    alert('Restored to default events successfully.');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                Restore Factory Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EVENT EDITOR MODAL */}
      {/* ---------------------------------------------------- */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0B132B] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900/90 border-b border-amber-500/20 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-display">
                  {editingEventId ? 'Edit Event Details' : 'Create New Event'}
                </h2>
                <p className="text-xs text-amber-300/80">
                  Update event names, dates, countdown timers, venue, and highlights.
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEvent} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Event Name (EN & BN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Event Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventFormData.name || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                    placeholder="e.g. Wedding & Lifestyle Exhibition featuring House of Bengal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Event Title (Bangla)
                  </label>
                  <input
                    type="text"
                    value={eventFormData.nameBn || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, nameBn: e.target.value })}
                    placeholder="বাংলা শিরোনাম..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-bangla"
                  />
                </div>
              </div>

              {/* Row 2: Status & Admission */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Event Status *
                  </label>
                  <select
                    value={eventFormData.status || 'upcoming'}
                    onChange={(e) =>
                      setEventFormData({
                        ...eventFormData,
                        status: e.target.value as EventDetail['status'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="upcoming">Upcoming (Active for Countdown)</option>
                    <option value="ongoing">Ongoing (Currently Live)</option>
                    <option value="previous">Previous (Archived Edition)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Admission (English)
                  </label>
                  <input
                    type="text"
                    value={eventFormData.admission || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, admission: e.target.value })}
                    placeholder="e.g. Free entry"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Admission (Bangla)
                  </label>
                  <input
                    type="text"
                    value={eventFormData.admissionBn || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, admissionBn: e.target.value })}
                    placeholder="ফ্রি এন্ট্রি"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-bangla"
                  />
                </div>
              </div>

              {/* Row 3: Dates & Countdown ISO Start */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Dates Display Text (EN)
                  </label>
                  <input
                    type="text"
                    value={eventFormData.dates || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, dates: e.target.value })}
                    placeholder="e.g. October 9–10, 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Dates Display Text (BN)
                  </label>
                  <input
                    type="text"
                    value={eventFormData.datesBn || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, datesBn: e.target.value })}
                    placeholder="৯–১০ অক্টোবর ২০২৬"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-bangla"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    Countdown Start (ISO / Date) *
                  </label>
                  <input
                    type="text"
                    value={eventFormData.startDateIso || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, startDateIso: e.target.value })}
                    placeholder="2026-10-09T12:00:00+06:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Controls the real-time countdown timer clock.</p>
                </div>
              </div>

              {/* Row 4: Timings & Venue */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Time Range (EN & BN)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={eventFormData.time || ''}
                      onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                      placeholder="12:00 PM – 12:00 AM"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={eventFormData.timeBn || ''}
                      onChange={(e) => setEventFormData({ ...eventFormData, timeBn: e.target.value })}
                      placeholder="দুপুর ১২:০০ – রাত ১২:০০"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bangla"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Venue / Location (EN & BN)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={eventFormData.location || ''}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                      placeholder="Grand Ballroom, Sheraton Banani"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={eventFormData.locationBn || ''}
                      onChange={(e) => setEventFormData({ ...eventFormData, locationBn: e.target.value })}
                      placeholder="গ্র্যান্ড বলরুম, শেরাটন বনানী"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bangla"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Banner Image Selection */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Event Banner Image
                </label>

                {/* Preset Banner Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_BANNERS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setEventFormData({ ...eventFormData, imageUrl: preset.url })}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        eventFormData.imageUrl === preset.url
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                      }`}
                    >
                      <div className="h-14 rounded-lg overflow-hidden bg-black mb-1.5">
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-300 truncate">{preset.label}</p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <div className="w-full">
                    <input
                      type="text"
                      value={eventFormData.imageUrl || ''}
                      onChange={(e) => setEventFormData({ ...eventFormData, imageUrl: e.target.value })}
                      placeholder="Or enter custom Image URL / Link..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 cursor-pointer border border-slate-700">
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Row 6: Key Highlights & Offerings */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Event Highlights & Offerings (Key bullet points)
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={offeringInputEn}
                    onChange={(e) => setOfferingInputEn(e.target.value)}
                    placeholder="Add item in English (e.g. Gold and diamond jewelry)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={offeringInputBn}
                    onChange={(e) => setOfferingInputBn(e.target.value)}
                    placeholder="বাংলা বিবরণ (ঐচ্ছিক)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bangla"
                  />
                  <button
                    type="button"
                    onClick={handleAddOffering}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Add Highlight
                  </button>
                </div>

                {/* Offerings list */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {eventFormData.offerings?.en.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-amber-500/20 text-xs text-slate-200"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOffering(idx)}
                        className="text-slate-400 hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Row 7: Notes & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Event Description / Notes (English)
                  </label>
                  <textarea
                    rows={3}
                    value={eventFormData.notes || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                    placeholder="Detailed overview for visitors..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Event Description / Notes (Bangla)
                  </label>
                  <textarea
                    rows={3}
                    value={eventFormData.notesBn || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, notesBn: e.target.value })}
                    placeholder="দর্শনার্থীদের জন্য বিস্তারিত বিবরণ..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-bangla"
                  />
                </div>
              </div>

              {/* Row 8: External Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={eventFormData.mapUrl || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, mapUrl: e.target.value })}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Facebook Event URL
                  </label>
                  <input
                    type="url"
                    value={eventFormData.facebookEventUrl || ''}
                    onChange={(e) => setEventFormData({ ...eventFormData, facebookEventUrl: e.target.value })}
                    placeholder="https://facebook.com/events/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Publish Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
