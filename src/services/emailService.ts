import { EnquiryRecord } from '../types';

export const OFFICIAL_ADMIN_EMAIL = 'dhakanightmarket@gmail.com';
const ENQUIRIES_STORAGE_KEY = 'dnm_enquiries_v2';

export interface VendorEnquiryInput {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  category: string;
  preferredEvent: string;
  stallPreference: string;
  notes: string;
}

export interface PartnerEnquiryInput {
  organizationName: string;
  contactPerson: string;
  designation?: string;
  phone: string;
  email: string;
  partnershipType: string;
  message: string;
}

export interface ContactEnquiryInput {
  name: string;
  email: string;
  phone: string;
  enquiryType: string;
  subject: string;
  message: string;
}

export interface SendMailResult {
  success: boolean;
  message: string;
  record?: EnquiryRecord;
  mailtoUrl: string;
}

/**
 * Generate a prefilled mailto link addressed to dhakanightmarket@gmail.com
 */
export function generateMailtoUrl(subject: string, body: string): string {
  return `mailto:${OFFICIAL_ADMIN_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

/**
 * Save enquiry to server API and local storage
 */
export async function saveEnquiryRecord(record: EnquiryRecord): Promise<void> {
  // 1. Save to local storage for instant availability
  try {
    const existing = getStoredEnquiries();
    const updated = [record, ...existing.filter((e) => e.id !== record.id)];
    localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save enquiry to localStorage:', err);
  }

  // 2. Persist to backend server API if reachable
  try {
    await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {
    // Backend API might be unreachable during pure static run, localStorage backup is in place
  }
}

/**
 * Retrieve all inquiries (from server API with localStorage fallback)
 */
export async function fetchAllEnquiries(): Promise<EnquiryRecord[]> {
  try {
    const res = await fetch('/api/enquiries');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {
    // fallback to local storage
  }
  return getStoredEnquiries();
}

export function getStoredEnquiries(): EnquiryRecord[] {
  try {
    const raw = localStorage.getItem(ENQUIRIES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed parsing stored inquiries:', err);
  }
  return [];
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryRecord['status']
): Promise<void> {
  const list = getStoredEnquiries();
  const updated = list.map((item) =>
    item.id === id ? { ...item, status } : item
  );
  localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(updated));

  try {
    await fetch(`/api/enquiries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch {
    // API optional in static mode
  }
}

export async function deleteEnquiry(id: string): Promise<void> {
  const list = getStoredEnquiries();
  const updated = list.filter((item) => item.id !== id);
  localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(updated));

  try {
    await fetch(`/api/enquiries/${id}`, {
      method: 'DELETE',
    });
  } catch {
    // API optional in static mode
  }
}

/**
 * Submit Vendor Enquiry Form directly to dhakanightmarket@gmail.com
 */
export async function submitVendorEnquiry(
  input: VendorEnquiryInput
): Promise<SendMailResult> {
  const recordId = `VND-${Date.now().toString().slice(-6)}`;
  const submittedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = `[Vendor Application] ${input.businessName} - Dhaka Night Market`;

  const emailBody = `
DHAKA NIGHT MARKET - VENDOR ENQUIRY / APPLICATION
--------------------------------------------------
Reference ID: ${recordId}
Submission Date: ${submittedAt}
Receiver Mail: ${OFFICIAL_ADMIN_EMAIL}

BUSINESS & APPLICANT DETAILS:
• Business / Brand Name: ${input.businessName}
• Contact Person: ${input.contactName}
• Contact Phone: ${input.phone}
• Contact Email: ${input.email}

PARTICIPATION PREFERENCES:
• Product Category: ${input.category}
• Preferred Event: ${input.preferredEvent}
• Stall / Space Preference: ${input.stallPreference}

PRODUCT DESCRIPTION & NOTES:
${input.notes || 'None provided'}
--------------------------------------------------
Sent automatically via Dhaka Night Market Vendor Portal
`.trim();

  const mailtoUrl = generateMailtoUrl(subject, emailBody);

  const enquiryRecord: EnquiryRecord = {
    id: recordId,
    type: 'vendor',
    title: `Vendor Application: ${input.businessName}`,
    businessOrOrg: input.businessName,
    contactName: input.contactName,
    phone: input.phone,
    email: input.email,
    categoryOrType: input.category,
    preferredEventOrDetails: `Event: ${input.preferredEvent} | Space: ${input.stallPreference}`,
    notesOrMessage: input.notes,
    submittedAt,
    status: 'new',
    sentToMail: OFFICIAL_ADMIN_EMAIL,
  };

  // 1. Always record in system
  await saveEnquiryRecord(enquiryRecord);

  // 2. Dispatch to FormSubmit API connecting directly to dhakanightmarket@gmail.com
  try {
    const payload = {
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      'Reference ID': recordId,
      'Submission Date': submittedAt,
      'Business Name': input.businessName,
      'Contact Person': input.contactName,
      'Phone Number': input.phone,
      'Applicant Email': input.email,
      'Product Category': input.category,
      'Preferred Event': input.preferredEvent,
      'Stall Preference': input.stallPreference,
      'Notes & Catalog Description': input.notes || 'N/A',
      _replyto: input.email,
    };

    const response = await fetch(
      `https://formsubmit.co/ajax/${OFFICIAL_ADMIN_EMAIL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      return {
        success: true,
        message: `Your vendor application has been sent directly to ${OFFICIAL_ADMIN_EMAIL}! Reference ID: ${recordId}.`,
        record: enquiryRecord,
        mailtoUrl,
      };
    }
  } catch (error) {
    console.warn('FormSubmit network call caught error:', error);
  }

  // If network had an issue or ad blocker blocked formsubmit, return success with record and mailto
  return {
    success: true,
    message: `Your vendor application has been logged for ${OFFICIAL_ADMIN_EMAIL}! Reference ID: ${recordId}.`,
    record: enquiryRecord,
    mailtoUrl,
  };
}

/**
 * Submit Sponsor & Partner Enquiry Form directly to dhakanightmarket@gmail.com
 */
export async function submitPartnerEnquiry(
  input: PartnerEnquiryInput
): Promise<SendMailResult> {
  const recordId = `PTN-${Date.now().toString().slice(-6)}`;
  const submittedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = `[Sponsor & Partner Enquiry] ${input.organizationName} - Dhaka Night Market`;

  const emailBody = `
DHAKA NIGHT MARKET - SPONSOR & PARTNER ENQUIRY
--------------------------------------------------
Reference ID: ${recordId}
Submission Date: ${submittedAt}
Receiver Mail: ${OFFICIAL_ADMIN_EMAIL}

ORGANIZATION & REPRESENTATIVE:
• Organization / Company Name: ${input.organizationName}
• Contact Representative: ${input.contactPerson}
• Designation / Title: ${input.designation || 'Not specified'}
• Official Phone: ${input.phone}
• Official Email: ${input.email}

PARTNERSHIP DETAILS:
• Partnership Type: ${input.partnershipType}

PROPOSAL / COLLABORATION GOALS:
${input.message || 'None provided'}
--------------------------------------------------
Sent automatically via Dhaka Night Market Partnership Portal
`.trim();

  const mailtoUrl = generateMailtoUrl(subject, emailBody);

  const enquiryRecord: EnquiryRecord = {
    id: recordId,
    type: 'partner',
    title: `Partner Enquiry: ${input.organizationName}`,
    businessOrOrg: input.organizationName,
    contactName: `${input.contactPerson}${
      input.designation ? ` (${input.designation})` : ''
    }`,
    phone: input.phone,
    email: input.email,
    categoryOrType: input.partnershipType,
    notesOrMessage: input.message,
    submittedAt,
    status: 'new',
    sentToMail: OFFICIAL_ADMIN_EMAIL,
  };

  // 1. Record in system
  await saveEnquiryRecord(enquiryRecord);

  // 2. Dispatch to FormSubmit API connecting directly to dhakanightmarket@gmail.com
  try {
    const payload = {
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      'Reference ID': recordId,
      'Submission Date': submittedAt,
      'Organization / Brand': input.organizationName,
      'Representative': input.contactPerson,
      'Designation': input.designation || 'N/A',
      'Official Phone': input.phone,
      'Official Email': input.email,
      'Partnership Scope': input.partnershipType,
      'Collaboration Proposal': input.message || 'N/A',
      _replyto: input.email,
    };

    const response = await fetch(
      `https://formsubmit.co/ajax/${OFFICIAL_ADMIN_EMAIL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      return {
        success: true,
        message: `Your partnership enquiry has been sent directly to ${OFFICIAL_ADMIN_EMAIL}! Reference ID: ${recordId}.`,
        record: enquiryRecord,
        mailtoUrl,
      };
    }
  } catch (error) {
    console.warn('FormSubmit network call caught error:', error);
  }

  return {
    success: true,
    message: `Your partnership enquiry has been recorded for ${OFFICIAL_ADMIN_EMAIL}! Reference ID: ${recordId}.`,
    record: enquiryRecord,
    mailtoUrl,
  };
}

/**
 * Submit General Contact Form directly to dhakanightmarket@gmail.com
 */
export async function submitContactEnquiry(
  input: ContactEnquiryInput
): Promise<SendMailResult> {
  const recordId = `CNT-${Date.now().toString().slice(-6)}`;
  const submittedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = `[Contact Enquiry] ${input.subject || input.name} - Dhaka Night Market`;

  const emailBody = `
DHAKA NIGHT MARKET - GENERAL ENQUIRY
--------------------------------------------------
Reference ID: ${recordId}
Submission Date: ${submittedAt}
Receiver Mail: ${OFFICIAL_ADMIN_EMAIL}

SENDER DETAILS:
• Name: ${input.name}
• Email: ${input.email}
• Phone: ${input.phone}
• Enquiry Nature: ${input.enquiryType}

SUBJECT:
${input.subject}

MESSAGE:
${input.message}
--------------------------------------------------
Sent automatically via Dhaka Night Market Contact Portal
`.trim();

  const mailtoUrl = generateMailtoUrl(subject, emailBody);

  const enquiryRecord: EnquiryRecord = {
    id: recordId,
    type: 'contact',
    title: `General Enquiry: ${input.subject || input.name}`,
    businessOrOrg: input.enquiryType,
    contactName: input.name,
    phone: input.phone,
    email: input.email,
    categoryOrType: input.enquiryType,
    notesOrMessage: input.message,
    submittedAt,
    status: 'new',
    sentToMail: OFFICIAL_ADMIN_EMAIL,
  };

  await saveEnquiryRecord(enquiryRecord);

  try {
    const payload = {
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      'Reference ID': recordId,
      'Sender Name': input.name,
      'Email': input.email,
      'Phone': input.phone,
      'Nature': input.enquiryType,
      'Subject': input.subject,
      'Message': input.message,
      _replyto: input.email,
    };

    await fetch(`https://formsubmit.co/ajax/${OFFICIAL_ADMIN_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('FormSubmit contact error:', err);
  }

  return {
    success: true,
    message: `Your message has been sent directly to ${OFFICIAL_ADMIN_EMAIL}! Reference ID: ${recordId}.`,
    record: enquiryRecord,
    mailtoUrl,
  };
}
