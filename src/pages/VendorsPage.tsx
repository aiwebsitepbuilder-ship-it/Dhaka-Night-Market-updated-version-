import React, { useState } from 'react';
import {
  Sparkles,
  Store,
  CheckCircle,
  AlertCircle,
  Send,
  HelpCircle,
  FileText,
  Clock,
  DollarSign,
  Shield,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { Language, FormSubmissionState } from '../types';
import { OFFICIAL_INFO } from '../data/content';
import { PlaceholderNotice } from '../components/PlaceholderNotice';
import { submitVendorEnquiry, OFFICIAL_ADMIN_EMAIL } from '../services/emailService';

interface VendorsPageProps {
  lang: Language;
}

export const VendorsPage: React.FC<VendorsPageProps> = ({ lang }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    category: 'jewelry',
    preferredEvent: 'wedding-oct-2026',
    stallPreference: 'standard',
    notes: '',
  });

  const [formState, setFormState] = useState<FormSubmissionState>({
    status: 'idle',
  });
  const [lastMailtoUrl, setLastMailtoUrl] = useState<string>('');

  // Letters only regex (supports English and Bengali letters, spaces, dots, apostrophes, hyphens)
  const lettersOnlyRegex = /^[\p{L}\s.'-]+$/u;
  const numbersOnlyRegex = /^[0-9]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedBusiness = formData.businessName.trim();
    const trimmedContact = formData.contactName.trim();
    const trimmedPhone = formData.phone.trim();

    // 1. Validation for Company / Business Name (letters only)
    if (!trimmedBusiness) {
      setFormState({
        status: 'error',
        message: lang === 'en' ? 'Please provide the company name.' : 'দয়া করে কোম্পানির নাম প্রদান করুন।',
      });
      return;
    }

    if (!lettersOnlyRegex.test(trimmedBusiness) || /\d/.test(trimmedBusiness)) {
      setFormState({
        status: 'error',
        message:
          lang === 'en'
            ? 'Company name must contain letters only (no numbers).'
            : 'কোম্পানির নাম শুধুমাত্র অক্ষর হতে হবে (কোন সংখ্যা নয়)।',
      });
      return;
    }

    // 2. Validation for Contact Person Name (letters only)
    if (!trimmedContact) {
      setFormState({
        status: 'error',
        message: lang === 'en' ? 'Please provide the contact person name.' : 'দয়া করে যোগাযোগকারীর নাম পূরণ করুন।',
      });
      return;
    }

    if (!lettersOnlyRegex.test(trimmedContact) || /\d/.test(trimmedContact)) {
      setFormState({
        status: 'error',
        message:
          lang === 'en'
            ? 'Contact person name must contain letters only (no numbers).'
            : 'যোগাযোগকারীর নাম শুধুমাত্র অক্ষর হতে হবে (কোন সংখ্যা নয়)।',
      });
      return;
    }

    // 3. Validation for Phone Number (numbers only)
    if (!trimmedPhone || !numbersOnlyRegex.test(trimmedPhone) || trimmedPhone.length < 8) {
      setFormState({
        status: 'error',
        message:
          lang === 'en'
            ? 'Phone number must contain numbers only (minimum 8 digits).'
            : 'ফোন নম্বর শুধুমাত্র সংখ্যা হতে হবে (কমপক্ষে ৮ ডিজিট)।',
      });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormState({
        status: 'error',
        message: lang === 'en' ? 'Please provide a valid email address.' : 'দয়া করে একটি সঠিক ইমেইল ঠিকানা লিখুন।',
      });
      return;
    }

    setFormState({ status: 'submitting' });

    try {
      const result = await submitVendorEnquiry({
        businessName: trimmedBusiness,
        contactName: trimmedContact,
        phone: trimmedPhone,
        email: formData.email.trim(),
        category: formData.category,
        preferredEvent: formData.preferredEvent,
        stallPreference: formData.stallPreference,
        notes: formData.notes,
      });

      setLastMailtoUrl(result.mailtoUrl);
      setFormState({
        status: 'success',
        message:
          lang === 'en'
            ? `Vendor application sent directly to ${OFFICIAL_ADMIN_EMAIL}! Our curation team will review your application and reach out shortly.`
            : `ভেন্ডর আবেদন সরাসরি ${OFFICIAL_ADMIN_EMAIL}-এ পৌঁছে গেছে! আমাদের টিম দ্রুত যোগাযোগ করবে।`,
      });
      setFormData({
        businessName: '',
        contactName: '',
        phone: '',
        email: '',
        category: 'jewelry',
        preferredEvent: 'wedding-oct-2026',
        stallPreference: 'standard',
        notes: '',
      });
    } catch {
      setFormState({
        status: 'error',
        message:
          lang === 'en'
            ? 'There was an issue sending your application. Please email us directly at dhakanightmarket@gmail.com.'
            : 'আবেদন পাঠাতে সমস্যা হয়েছে। সরাসরি dhakanightmarket@gmail.com-এ যোগাযোগ করুন।',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 font-display">
          {lang === 'en' ? 'Exhibition & Retail Space' : 'প্রদর্শনী ও স্টল বুকিং'}
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display">
          {lang === 'en' ? 'Become a Dhaka Night Market Vendor' : 'ঢাকা নাইট মার্কেটের ভেন্ডর হোন'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {lang === 'en'
            ? 'Position your brand in front of thousands of curated evening visitors, bridal shoppers, and lifestyle enthusiasts in Bangladesh.'
            : 'হাজারো সান্ধ্যকালীন ক্রেতা, ব্রাইডাল ফ্যাশন অনুরাগী ও লাইফস্টাইল সংগ্রাহকদের সামনে আপনার ব্র্যান্ডকে উপস্থাপন করুন।'}
        </p>
      </div>

      {/* Why Become a Vendor Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0D152D] border border-amber-500/20 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Store className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            {lang === 'en' ? 'Why Become a Vendor?' : 'কেন ভেন্ডর হবেন?'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'en'
              ? 'Dhaka Night Market curates an elevated festive retail environment specifically designed for high sales volume, direct client interaction, and evening visibility.'
              : 'ঢাকা নাইট মার্কেট সরাসরি ক্রেতাদের কাছে পৌঁছানো, ব্র্যান্ড পরিচয় বৃদ্ধি এবং সান্ধ্যকালীন উৎসবমুখর বিক্রির জন্য একটি অনন্য মঞ্চ।'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D152D] border border-amber-500/20 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            {lang === 'en' ? 'Vendor Opportunities' : 'ভেন্ডর সুযোগসমূহ'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'en'
              ? 'Opportunities for gold and diamond jewelry ateliers, bridal designers, bespoke lifestyle makers, artisan cuisine providers, and local crafts.'
              : 'স্বর্ণ ও হিরের অলঙ্কার প্রস্তুতকারক, ব্রাইডাল ডিজাইনার, দেশীয় কারুশিল্প ও আর্টিসান ফুড ব্র্যান্ডের জন্য বিশেষ প্রদর্শনী সুযোগ।'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D152D] border border-amber-500/20 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            {lang === 'en' ? 'Curated Environment' : 'কিউরেটেড পরিবেশ'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'en'
              ? 'Hosted in premier five-star venues such as Sheraton Banani (Grand Ballroom), offering safe, elegant hospitality and high-footfall engagement.'
              : 'শেরাটন বনানীর গ্র্যান্ড বলরুমের মতো অভিজাত ৫-তারকা ভেন্যুতে নিরাপদ, পরিচ্ছন্ন ও প্রিমিয়াম প্রদর্শনী অভিজ্ঞতা।'}
          </p>
        </div>
      </div>

      {/* Official Placeholders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlaceholderNotice
          label="[Add Vendor Benefits]"
          subtext={
            lang === 'en'
              ? 'Detailed breakdown of stall specifications, footfall averages, marketing collateral inclusion, and VIP access passes.'
              : 'স্টলের আয়তন, প্রমোশনাল সাপোর্ট ও বিশেষ সুবিধার বিস্তারিত বিবরণ শীঘ্রই অফিশিয়ালি প্রকাশ করা হবে।'
          }
        />

        <PlaceholderNotice
          label="[Add Vendor Requirements]"
          subtext={
            lang === 'en'
              ? 'Official product authentication standards, booth setup guidelines, trade licensing criteria, and payment acceptance policies.'
              : 'পণ্যের গুণগত মান, বুথ সেটআপের নীতিমালা ও প্রয়োজনীয় শর্তাবলী প্রকাশের অপেক্ষায় রয়েছে।'
          }
        />

        <PlaceholderNotice
          label="[Add Application Process]"
          subtext={
            lang === 'en'
              ? 'Step-by-step screening schedule, curation review timeline, and confirmation onboarding protocol.'
              : 'আবেদন বাছাই প্রক্রিয়া, টাইমলাইন এবং বুথ বরাদ্দ সংক্রান্ত নির্দেশিকা।'
          }
        />

        <PlaceholderNotice
          label="[Add Vendor Fee Information if applicable]"
          subtext={
            lang === 'en'
              ? 'Official stall allocation rates, payment schedules, and package options will be provided directly by the management committee.'
              : 'স্টল ভাড়ার অফিসিয়াল রেট কার্ড ও পেমেন্ট শিডিউল কমিটি কর্তৃক সরাসরি প্রদান করা হবে।'
          }
        />
      </div>

      {/* Previous Participating Brands Placeholder Section */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            {lang === 'en' ? 'Previous Participating Brands' : 'পূর্ববর্তী অংশগ্রহণকারী ব্র্যান্ড'}
          </h2>
        </div>
        <PlaceholderNotice
          label="[Add Previous Participating Brands]"
          subtext={
            lang === 'en'
              ? 'Brand directory and logos from past editions (such as House of Bengal and past exhibitors) will be populated here.'
              : 'পূর্ববর্তী আসরে অংশগ্রহণকারী স্বনামধন্য ব্র্যান্ডসমূহের লোগো ও পরিচিতি এখানে যুক্ত হবে।'
          }
        />
      </div>

      {/* VENDOR ENQUIRY / APPLICATION FORM */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#0B132B] to-[#070B19] border border-amber-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="max-w-2xl mb-8 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/15 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Official Application' : 'অফিসিয়াল আবেদন'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct to: {OFFICIAL_ADMIN_EMAIL}</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
            {lang === 'en' ? 'Vendor Enquiry / Application Form' : 'ভেন্ডর এনকোয়ারি / আবেদন ফরম'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {lang === 'en'
              ? 'Complete the form below to register your brand’s interest. Applications are delivered directly to dhakanightmarket@gmail.com and reviewed promptly.'
              : 'আপনার ব্র্যান্ডের আগ্রহ জানাতে নিচের ফরমটি পূরণ করুন। আবেদন সরাসরি dhakanightmarket@gmail.com-এ জমা হবে।'}
          </p>
        </div>

        {formState.status === 'success' ? (
          <div className="p-8 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {lang === 'en' ? 'Application Delivered to Email' : 'আবেদন ইমেইলে পৌঁছেছে'}
            </h3>
            <p className="text-sm text-emerald-200 max-w-md mx-auto">
              {formState.message}
            </p>
            <div className="pt-2 text-xs text-slate-400 font-mono">
              Receiver Email: <span className="text-amber-300 font-bold">{OFFICIAL_ADMIN_EMAIL}</span> • Hotlines: {OFFICIAL_INFO.phone}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              {lastMailtoUrl && (
                <a
                  href={lastMailtoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Open Copy in Mail App' : 'মেইল অ্যাপে কপি খুলুন'}</span>
                </a>
              )}
              <button
                onClick={() => setFormState({ status: 'idle' })}
                className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
              >
                {lang === 'en' ? 'Submit Another Enquiry' : 'আরেকটি আবেদন জমা দিন'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {formState.status === 'error' && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{formState.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Business Name (Letters only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {lang === 'en' ? 'Brand / Business Name *' : 'ব্র্যান্ড / প্রতিষ্ঠানের নাম *'}
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {lang === 'en' ? 'Letters only' : 'শুধুমাত্র অক্ষর'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => {
                    // Strip out digits and prohibited symbols in real-time
                    const cleaned = e.target.value.replace(/[\d]/g, '');
                    setFormData({ ...formData, businessName: cleaned });
                  }}
                  placeholder={lang === 'en' ? 'e.g. Dhaka Artisan House' : 'যেমন: ঢাকা ক্রাফটস'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              {/* Contact Person (Letters only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {lang === 'en' ? 'Contact Person Name *' : 'যোগাযোগকারীর নাম *'}
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {lang === 'en' ? 'Letters only' : 'শুধুমাত্র অক্ষর'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[\d]/g, '');
                    setFormData({ ...formData, contactName: cleaned });
                  }}
                  placeholder={lang === 'en' ? 'Full name' : 'পূর্ণ নাম'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              {/* Phone (Numbers only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {lang === 'en' ? 'Phone Number *' : 'ফোন নম্বর *'}
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {lang === 'en' ? 'Numbers only' : 'শুধুমাত্র সংখ্যা'}
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.phone}
                  onChange={(e) => {
                    // Allow only digits
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: cleaned });
                  }}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {lang === 'en' ? 'Email Address *' : 'ইমেইল ঠিকানা *'}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="brand@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              {/* Product Category */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {lang === 'en' ? 'Product Category *' : 'পণ্যের ক্যাটাগরি *'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                >
                  <option value="jewelry">Gold & Diamond Jewelry</option>
                  <option value="bridal">Bridal Wear & Designer Apparel</option>
                  <option value="lifestyle">Lifestyle Products & Accessories</option>
                  <option value="food">Food & Gourmet Beverages</option>
                  <option value="crafts">Handmade Crafts & Art</option>
                  <option value="other">Other Commercial Products</option>
                </select>
              </div>

              {/* Preferred Event */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {lang === 'en' ? 'Target Exhibition *' : 'আগ্রহী ইভেন্ট *'}
                </label>
                <select
                  value={formData.preferredEvent}
                  onChange={(e) => setFormData({ ...formData, preferredEvent: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                >
                  <option value="wedding-oct-2026">
                    Wedding & Lifestyle Exhibition (Oct 9–10, 2026 @ Sheraton Banani)
                  </option>
                  <option value="future-seasons">
                    Future Dhaka Night Market Seasons
                  </option>
                </select>
              </div>
            </div>

            {/* Brand details / Message */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {lang === 'en'
                  ? 'Brand Profile & Stall Requirements'
                  : 'ব্র্যান্ডের সংক্ষিপ্ত বিবরণ ও স্টল সম্পর্কিত তথ্য'}
              </label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={
                  lang === 'en'
                    ? 'Tell us about your brand, social media handles, products you intend to showcase, and any specific booth preferences.'
                    : 'আপনার ব্র্যান্ডের বিস্তারিত, সোশ্যাল পেজ লিংক ও প্রদর্শনীর পরিকল্পনা লিখুন।'
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>

            {/* Backend Integration Note */}
            <p className="text-[11px] text-slate-500 font-mono">
              Note: Frontend application handler active. Submissions will be synced with the official Dhaka Night Market vendor review pipeline.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formState.status === 'submitting'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold uppercase tracking-wider text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>
                {formState.status === 'submitting'
                  ? (lang === 'en' ? 'Submitting Application...' : 'জমা হচ্ছে...')
                  : (lang === 'en' ? 'Submit Vendor Application' : 'ভেন্ডর আবেদন জমা দিন')}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
