# Firebase Realtime Database Integration Plan

**Project:** St Paul's ACK Cathedral Youths Website
**Date:** 2026-07-04
**Stack:** React 19 + Vite 8 + Firebase Realtime Database

---

## Table of Contents

1. [Overview](#1-overview)
2. [Scope Audit](#2-scope-audit)
3. [Firebase Project Setup](#3-firebase-project-setup)
4. [Database Schema Design](#4-database-schema-design)
5. [Implementation Phases](#5-implementation-phases)
6. [Phase 1 — Firebase Setup & Config](#phase-1--firebase-setup--config)
7. [Phase 2 — Form Submissions (Write-Only)](#phase-2--form-submissions-write-only)
8. [Phase 3 — Dynamic Content (Read + Display)](#phase-3--dynamic-content-read--display)
9. [Phase 4 — Admin Panel](#phase-4--admin-panel)
10. [Phase 5 — Authentication & Security Rules](#phase-5--authentication--security-rules)
11. [Security Rules Reference](#6-security-rules-reference)
12. [File Structure](#7-file-structure)
13. [Migration Checklist](#8-migration-checklist)
14. [Cost Estimation](#9-cost-estimation)
15. [Risks & Mitigations](#10-risks--mitigations)

---

## 1. Overview

The website currently has **9 forms** and **6 content areas** that are entirely static — forms submit nowhere, and content is hard-coded in `src/App.jsx`. This plan adds Firebase Realtime Database to:

- **Capture form submissions** (prayer requests, contact messages, event registrations, etc.)
- **Serve dynamic content** (events, sermons, blog posts, team members) so staff can update without code changes
- **Provide a lightweight admin panel** for church staff to manage submissions and content

Firebase Realtime Database is chosen over Firestore for simplicity and cost-effectiveness at this scale (< 1,000 users, low write volume).

---

## 2. Scope Audit

### 2.1 Forms That Need Database Writes

| # | Form | Location | Fields | Priority |
|---|------|----------|--------|----------|
| 1 | **Prayer Request Widget** | Floating widget (all pages) | name, request | High |
| 2 | **Contact Form** | Connect page | firstName, lastName, email, phone, helpType, message | High |
| 3 | **Prayer Request Form** | Connect page | name (optional), request | High |
| 4 | **Event Registration** | Events page | fullName, phone, event, email, specialRequirements | High |
| 5 | **Newsletter Signup** | Home page | email | High |
| 6 | **Small Group Signup** | Connect page | name, preferredGroup | Medium |
| 7 | **Giving/Donations** | Give page | category, amount, frequency, firstName, lastName, email | Medium |
| 8 | **Testimony Submission** | Blog page | name, category, title, story | Medium |
| 9 | **Daily Devotional Subscribe** | Blog page | email | Medium |

### 2.2 Content That Should Be Database-Driven

| # | Content | Current Source | Record Count | Priority |
|---|---------|---------------|--------------|----------|
| 1 | **Events** | `EVENTS` array in App.jsx | 4 | High |
| 2 | **Sermons** | `SERMONS` array in App.jsx | 3 | High |
| 3 | **Blog Posts** | `BLOG_POSTS` array in App.jsx | 3 | Medium |
| 4 | **Team Members** | `TEAM` array in App.jsx | 4 | Low |
| 5 | **Ministries** | `MINISTRIES` array in App.jsx | 6 | Low |
| 6 | **Service Times** | Hard-coded in hero + footer | 5 | Low |

---

## 3. Firebase Project Setup

### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project: **st-pauls-youths**
3. Disable Google Analytics (not needed for this scope)
4. Enable **Realtime Database** (choose region: `europe-west1` for proximity to Nairobi)
5. Start in **locked mode** (we will write security rules)

### 3.2 Register Web App

1. In Project Settings > General > Your Apps, click "Web" (`</>`)
2. Register app name: **st-pauls-youths-web**
3. Copy the Firebase config object (apiKey, authDomain, databaseURL, etc.)

### 3.3 Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable **Email/Password** (for admin access only)
3. Create one admin account manually: `admin@stpaulsackyouths.org`

---

## 4. Database Schema Design

```
st-pauls-youths-db/
|
|-- submissions/
|   |-- prayerRequests/
|   |   |-- {pushId}/
|   |       |-- name: string
|   |       |-- request: string
|   |       |-- source: "widget" | "connect-page"
|   |       |-- anonymous: boolean
|   |       |-- createdAt: number (timestamp)
|   |       |-- status: "new" | "prayed" | "archived"
|   |
|   |-- contactMessages/
|   |   |-- {pushId}/
|   |       |-- firstName: string
|   |       |-- lastName: string
|   |       |-- email: string
|   |       |-- phone: string
|   |       |-- helpType: string
|   |       |-- message: string
|   |       |-- createdAt: number
|   |       |-- status: "new" | "responded" | "archived"
|   |
|   |-- eventRegistrations/
|   |   |-- {pushId}/
|   |       |-- fullName: string
|   |       |-- phone: string
|   |       |-- email: string
|   |       |-- eventId: string
|   |       |-- eventTitle: string
|   |       |-- specialRequirements: string
|   |       |-- createdAt: number
|   |       |-- status: "registered" | "confirmed" | "cancelled"
|   |
|   |-- newsletterSignups/
|   |   |-- {pushId}/
|   |       |-- email: string
|   |       |-- source: "home" | "blog"
|   |       |-- createdAt: number
|   |
|   |-- smallGroupSignups/
|   |   |-- {pushId}/
|   |       |-- name: string
|   |       |-- preferredGroup: string
|   |       |-- createdAt: number
|   |       |-- status: "new" | "assigned"
|   |
|   |-- givingRecords/
|   |   |-- {pushId}/
|   |       |-- firstName: string
|   |       |-- lastName: string
|   |       |-- email: string
|   |       |-- category: string
|   |       |-- amount: number
|   |       |-- frequency: string
|   |       |-- createdAt: number
|   |       |-- note: string
|   |       (NOTE: This records intent only, NOT payment.
|   |        Actual payment goes through M-Pesa/bank.
|   |        No financial credentials are stored.)
|   |
|   |-- testimonies/
|       |-- {pushId}/
|           |-- name: string
|           |-- category: string
|           |-- title: string
|           |-- story: string
|           |-- createdAt: number
|           |-- status: "pending" | "approved" | "rejected"
|
|-- content/
|   |-- events/
|   |   |-- {pushId}/
|   |       |-- day: string
|   |       |-- month: string
|   |       |-- title: string
|   |       |-- time: string
|   |       |-- desc: string
|   |       |-- active: boolean
|   |       |-- order: number
|   |
|   |-- sermons/
|   |   |-- {pushId}/
|   |       |-- tag: string
|   |       |-- title: string
|   |       |-- pastor: string
|   |       |-- date: string
|   |       |-- icon: string
|   |       |-- videoUrl: string (optional)
|   |       |-- podcastUrl: string (optional)
|   |       |-- active: boolean
|   |       |-- order: number
|   |
|   |-- blogPosts/
|   |   |-- {pushId}/
|   |       |-- emoji: string
|   |       |-- cat: string
|   |       |-- title: string
|   |       |-- excerpt: string
|   |       |-- author: string
|   |       |-- date: string
|   |       |-- active: boolean
|   |       |-- order: number
|   |
|   |-- team/
|   |   |-- {pushId}/
|   |       |-- initials: string
|   |       |-- name: string
|   |       |-- role: string
|   |       |-- bio: string
|   |       |-- order: number
|   |
|   |-- ministries/
|   |   |-- {pushId}/
|   |       |-- icon: string
|   |       |-- color: string
|   |       |-- title: string
|   |       |-- desc: string
|   |       |-- order: number
|   |
|   |-- serviceTimes/
|       |-- {pushId}/
|           |-- name: string
|           |-- time: string
|           |-- order: number
|
|-- config/
    |-- hero/
    |   |-- sermonTitle: string
    |   |-- sermonVerse: string
    |   |-- sermonPastor: string
    |   |-- countdownTarget: string (ISO date)
    |   |-- countdownLabel: string
    |
    |-- dailyVerse/
        |-- text: string
        |-- reference: string
```

---

## 5. Implementation Phases

| Phase | Scope | Effort | Depends On |
|-------|-------|--------|------------|
| **Phase 1** | Firebase setup, config, utility module | 1-2 hours | Nothing |
| **Phase 2** | Wire all 9 forms to write to database | 3-4 hours | Phase 1 |
| **Phase 3** | Replace hard-coded arrays with database reads | 2-3 hours | Phase 1 |
| **Phase 4** | Admin panel for staff to manage content/submissions | 4-6 hours | Phases 2 & 3 |
| **Phase 5** | Auth for admin, security rules, input validation | 2-3 hours | Phase 4 |

**Total estimated effort: 12-18 hours**

---

## Phase 1 — Firebase Setup & Config

### 1.1 Install Dependencies

```bash
npm install firebase
```

### 1.2 Create Firebase Config Module

**File: `src/firebase.js`**

```js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue, query, orderByChild, equalTo } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

export { ref, push, set, onValue, query, orderByChild, equalTo };
```

### 1.3 Environment Variables

**File: `.env.local`** (git-ignored)

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=st-pauls-youths.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://st-pauls-youths-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=st-pauls-youths
VITE_FIREBASE_STORAGE_BUCKET=st-pauls-youths.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxx
```

Add `.env.local` to `.gitignore` (already covered by the default Vite .gitignore).

### 1.4 Create Submission Helper

**File: `src/db.js`**

```js
import { db, ref, push } from "./firebase";

export async function submitForm(collection, data) {
  const submissionRef = ref(db, `submissions/${collection}`);
  const entry = { ...data, createdAt: Date.now(), status: "new" };
  await push(submissionRef, entry);
  return true;
}
```

### 1.5 Create a `useFirebaseCollection` Hook

**File: `src/hooks/useFirebaseCollection.js`**

```js
import { useState, useEffect } from "react";
import { db, ref, onValue, query, orderByChild } from "../firebase";

export function useFirebaseCollection(path, orderField = "order") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = query(ref(db, path), orderByChild(orderField));
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((child) => {
          items.push({ id: child.key, ...child.val() });
        });
        setData(items);
      } else {
        setData([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [path, orderField]);

  return { data, loading };
}
```

---

## Phase 2 — Form Submissions (Write-Only)

For each form: add controlled state, a submit handler, validation, loading/success states, and write to Firebase.

### 2.1 Shared Form State Pattern

Every form follows this pattern:

```jsx
const [formData, setFormData] = useState({ /* fields */ });
const [submitting, setSubmitting] = useState(false);
const [submitted, setSubmitted] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async () => {
  // Basic validation
  if (!formData.email) { setError("Email is required"); return; }

  setSubmitting(true);
  setError(null);
  try {
    await submitForm("collectionName", formData);
    setSubmitted(true);
    setFormData({ /* reset */ });
  } catch (err) {
    setError("Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
};
```

### 2.2 Form-by-Form Implementation

#### Form 1: Prayer Request Widget (Floating)

**Collection:** `submissions/prayerRequests`

```
Fields:
  - name: string (required)
  - request: string (required)
  - source: "widget" (auto-set)
  - anonymous: false
```

**Validation:** name and request must be non-empty.
**Success state:** Show "Prayer request sent. Our team is praying for you." for 3 seconds, then reset.

#### Form 2: Contact Form (Connect Page)

**Collection:** `submissions/contactMessages`

```
Fields:
  - firstName: string (required)
  - lastName: string (required)
  - email: string (required, email format)
  - phone: string (optional)
  - helpType: string (from select)
  - message: string (required)
```

**Validation:** firstName, lastName, email, and message are required. Email must contain `@`.
**Success state:** Replace form with a confirmation message.

#### Form 3: Prayer Request (Connect Page)

**Collection:** `submissions/prayerRequests`

```
Fields:
  - name: string (optional)
  - request: string (required)
  - source: "connect-page" (auto-set)
  - anonymous: boolean (toggled via "Keep Anonymous" button)
```

**Validation:** request must be non-empty.

#### Form 4: Event Registration (Events Page)

**Collection:** `submissions/eventRegistrations`

```
Fields:
  - fullName: string (required)
  - phone: string (required)
  - email: string (required, email format)
  - eventId: string (from selected event)
  - eventTitle: string (from selected event)
  - specialRequirements: string (optional)
```

**Validation:** fullName, phone, and email required.
**Success state:** Show confirmation with event name.

#### Form 5: Newsletter Signup (Home Page)

**Collection:** `submissions/newsletterSignups`

```
Fields:
  - email: string (required, email format)
  - source: "home" (auto-set)
```

**Validation:** email required, must contain `@`.
**Success state:** Replace input with "Subscribed!" message.

#### Form 6: Small Group Signup (Connect Page)

**Collection:** `submissions/smallGroupSignups`

```
Fields:
  - name: string (required)
  - preferredGroup: string (from select)
```

**Validation:** name required.

#### Form 7: Giving Record (Give Page)

**Collection:** `submissions/givingRecords`

```
Fields:
  - firstName: string (required)
  - lastName: string (required)
  - email: string (required, email format)
  - category: string (from select)
  - amount: number (required, > 0)
  - frequency: string (from select)
```

**Important:** This records the GIVING INTENT, not an actual payment. No payment processing occurs. The form tells staff someone wants to give. Actual payment happens via M-Pesa/bank separately. No financial credentials, card numbers, or payment tokens are ever stored.

**Validation:** firstName, lastName, email, and amount required.

#### Form 8: Testimony Submission (Blog Page)

**Collection:** `submissions/testimonies`

```
Fields:
  - name: string (required)
  - category: string (from select)
  - title: string (required)
  - story: string (required, min 50 chars)
```

**Validation:** name, title, and story required. Story minimum 50 characters.
**Success state:** Show "Your testimony has been submitted for review."

#### Form 9: Daily Devotional Subscribe (Blog Page)

**Collection:** `submissions/newsletterSignups`

```
Fields:
  - email: string (required, email format)
  - source: "blog-devotional" (auto-set)
```

Same collection as newsletter but different `source` tag.

### 2.3 Client-Side Validation Utility

**File: `src/validation.js`**

```js
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequired(fields, data) {
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
      return field;
    }
  }
  return null;
}

export function validatePhone(phone) {
  return /^\+?[\d\s-]{7,15}$/.test(phone);
}
```

### 2.4 Toast/Notification Component

**File: `src/components/Toast.jsx`**

A simple toast component for success/error feedback that auto-dismisses after 4 seconds. Positioned above the prayer widget to avoid overlap.

---

## Phase 3 — Dynamic Content (Read + Display)

Replace hard-coded const arrays with Firebase reads using the `useFirebaseCollection` hook.

### 3.1 Seed Initial Data

Before switching to database reads, seed the current hard-coded data into Firebase using a one-time script.

**File: `scripts/seed.js`**

```js
// Run once: node scripts/seed.js
// Writes the current EVENTS, SERMONS, BLOG_POSTS, TEAM,
// MINISTRIES, and serviceTimes data into the Realtime Database
// under content/
```

This script takes the existing arrays from App.jsx and pushes them to `content/events`, `content/sermons`, etc. with `order` fields for sorting.

### 3.2 Replace Each Content Area

#### Events (`EVENTS` array)

```jsx
// Before:
const events = EVENTS;

// After:
const { data: events, loading: eventsLoading } = useFirebaseCollection("content/events");
```

- Show a skeleton/spinner while `loading` is true
- Filter by `active === true` on the client
- Fall back to the hard-coded `EVENTS` array if Firebase is unreachable

#### Sermons (`SERMONS` array)

```jsx
const { data: sermons, loading } = useFirebaseCollection("content/sermons");
```

#### Blog Posts (`BLOG_POSTS` array)

```jsx
const { data: blogPosts, loading } = useFirebaseCollection("content/blogPosts");
```

#### Team (`TEAM` array)

```jsx
const { data: team, loading } = useFirebaseCollection("content/team");
```

#### Ministries (`MINISTRIES` array)

```jsx
const { data: ministries, loading } = useFirebaseCollection("content/ministries");
```

#### Hero Config (sermon title, countdown target)

```jsx
const { data: heroConfig, loading } = useFirebaseCollection("config/hero");
```

### 3.3 Fallback Strategy

Each `useFirebaseCollection` consumer should fall back to the original hard-coded array if `data` is null (Firebase unreachable or empty). This ensures the site never shows a blank page.

```jsx
const displayEvents = events ?? EVENTS_FALLBACK;
```

### 3.4 Loading States

Use a simple skeleton pattern — show the section structure with muted placeholder blocks while loading. Keep it lightweight; no external skeleton library needed.

```jsx
{loading ? (
  <div className="card" style={{ height: 120, background: "var(--gray-100)", animation: "pulse 1.5s infinite" }} />
) : (
  /* actual content */
)}
```

---

## Phase 4 — Admin Panel

A simple, protected admin interface for church staff to manage content and view submissions.

### 4.1 Route: `/admin`

Since there's no router yet, add a simple admin mode:

- Navigate to `/admin` or click a hidden link in the footer
- Show login form (Firebase Auth email/password)
- After auth, render the admin dashboard instead of the public site

### 4.2 Admin Dashboard Layout

```
Admin Dashboard
|
|-- Sidebar
|   |-- Submissions
|   |   |-- Prayer Requests (with unread count badge)
|   |   |-- Contact Messages
|   |   |-- Event Registrations
|   |   |-- Newsletter Signups
|   |   |-- Small Group Signups
|   |   |-- Giving Records
|   |   |-- Testimonies
|   |
|   |-- Content
|   |   |-- Events (CRUD)
|   |   |-- Sermons (CRUD)
|   |   |-- Blog Posts (CRUD)
|   |   |-- Team Members (CRUD)
|   |   |-- Ministries (CRUD)
|   |
|   |-- Settings
|       |-- Hero Config (sermon title, countdown date)
|       |-- Service Times
|
|-- Main Area
    |-- Table/list view of selected section
    |-- Inline edit / modal for create/update
```

### 4.3 Admin Components

| Component | Purpose |
|-----------|---------|
| `AdminLogin.jsx` | Email/password auth form |
| `AdminLayout.jsx` | Sidebar + main content area |
| `SubmissionTable.jsx` | Reusable table for viewing submissions with status toggles |
| `ContentEditor.jsx` | Reusable form for creating/editing content items |
| `AdminDashboard.jsx` | Overview: counts of new submissions, quick stats |

### 4.4 Admin CRUD Operations

**File: `src/admin/adminDb.js`**

```js
import { db, ref, set, push, onValue } from "../firebase";
import { remove } from "firebase/database";

export async function createContent(collection, data) {
  const contentRef = ref(db, `content/${collection}`);
  await push(contentRef, { ...data, active: true });
}

export async function updateContent(collection, id, data) {
  await set(ref(db, `content/${collection}/${id}`), data);
}

export async function deleteContent(collection, id) {
  await remove(ref(db, `content/${collection}/${id}`));
}

export async function updateSubmissionStatus(collection, id, status) {
  await set(ref(db, `submissions/${collection}/${id}/status`), status);
}
```

### 4.5 Admin Access

- Only 1-2 admin accounts (created manually in Firebase Console)
- No self-registration
- Admin status verified via Firebase Auth `currentUser` + a simple allowlist in the database:

```
admins/
  |-- {uid}: true
```

---

## Phase 5 — Authentication & Security Rules

### 5.1 Firebase Auth Integration

**File: `src/hooks/useAuth.js`**

```js
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}
```

### 5.2 Admin Route Guard

```jsx
function AdminPage() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <AdminLogin onLogin={login} />;
  return <AdminLayout user={user} onLogout={logout} />;
}
```

### 5.3 Input Sanitization

All user inputs should be trimmed and length-limited before writing to the database:

```js
function sanitize(str, maxLength = 1000) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLength);
}
```

Apply field-specific limits:
- Name fields: 100 chars
- Email: 254 chars
- Phone: 20 chars
- Message/story: 5,000 chars
- Title: 200 chars

---

## 6. Security Rules Reference

**File: `database.rules.json`** (deploy via Firebase CLI)

```json
{
  "rules": {
    "submissions": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      "prayerRequests": {
        ".write": true,
        "$id": {
          ".validate": "newData.hasChildren(['request', 'createdAt', 'source'])"
        }
      },
      "contactMessages": {
        ".write": true,
        "$id": {
          ".validate": "newData.hasChildren(['firstName', 'lastName', 'email', 'message', 'createdAt'])"
        }
      },
      "eventRegistrations": {
        ".write": true,
        "$id": {
          ".validate": "newData.hasChildren(['fullName', 'phone', 'email', 'eventTitle', 'createdAt'])"
        }
      },
      "newsletterSignups": {
        ".write": true,
        "$id": {
          ".validate": "newData.hasChildren(['email', 'source', 'createdAt'])"
        }
      },
      "smallGroupSignups": {
        ".write": true,
        "$id": {
          ".validate": "newData.hasChildren(['name', 'preferredGroup', 'createdAt'])"
        }
      },
      "givingRecords": {
        ".write": true,
        "$id": {
          ".validate": "newData.hasChildren(['firstName', 'email', 'amount', 'createdAt'])"
        }
      },
      "testimonies": {
        ".write": true,
        "$id": {
          ".validate": "newData.hasChildren(['name', 'title', 'story', 'createdAt'])"
        }
      }
    },
    "content": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "config": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "admins": {
      ".read": "auth != null",
      ".write": false
    }
  }
}
```

**Key principles:**
- **Submissions:** anyone can write (public forms), only admins can read
- **Content & config:** anyone can read (public site), only admins can write
- **Admins list:** only readable by authenticated users, never writable from client (manage via Firebase Console only)
- **Validation:** each submission type requires its mandatory fields

---

## 7. File Structure

After implementation, the project structure will be:

```
src/
|-- firebase.js                  # Firebase init + exports
|-- db.js                        # submitForm helper
|-- validation.js                # Client-side validation utils
|
|-- hooks/
|   |-- useFirebaseCollection.js # Real-time data subscription
|   |-- useAuth.js               # Firebase auth hook
|
|-- components/
|   |-- Toast.jsx                # Success/error notifications
|
|-- admin/
|   |-- AdminLogin.jsx           # Admin login form
|   |-- AdminLayout.jsx          # Sidebar + content area
|   |-- AdminDashboard.jsx       # Overview stats
|   |-- SubmissionTable.jsx      # Reusable submission viewer
|   |-- ContentEditor.jsx        # Reusable content CRUD form
|   |-- adminDb.js               # Admin database operations
|
|-- App.jsx                      # Main app (modified)
|-- main.jsx
|-- index.css
|
scripts/
|-- seed.js                      # One-time data seed script
|
database.rules.json              # Firebase security rules
.env.local                       # Firebase credentials (git-ignored)
```

---

## 8. Migration Checklist

### Pre-launch

- [ ] Create Firebase project and register web app
- [ ] Add `.env.local` with credentials
- [ ] Install `firebase` npm package
- [ ] Create `src/firebase.js` config module
- [ ] Create `src/db.js` submit helper
- [ ] Create `src/validation.js`
- [ ] Create `useFirebaseCollection` hook

### Phase 2 — Forms

- [ ] Wire Prayer Request Widget with state + submit
- [ ] Wire Contact Form with state + validation + submit
- [ ] Wire Connect Page Prayer Request form
- [ ] Wire Event Registration form
- [ ] Wire Home Newsletter signup
- [ ] Wire Small Group signup
- [ ] Wire Giving form (intent only, no payment)
- [ ] Wire Testimony submission form
- [ ] Wire Blog Devotional subscribe
- [ ] Add Toast component for feedback
- [ ] Test all 9 forms end-to-end
- [ ] Verify submissions appear in Firebase Console

### Phase 3 — Dynamic Content

- [ ] Run seed script to populate initial content
- [ ] Replace EVENTS array with `useFirebaseCollection`
- [ ] Replace SERMONS array
- [ ] Replace BLOG_POSTS array
- [ ] Replace TEAM array
- [ ] Replace MINISTRIES array
- [ ] Add hero config read (countdown target, sermon info)
- [ ] Add loading skeletons
- [ ] Test fallback behavior (disable Firebase, verify fallback arrays)

### Phase 4 — Admin

- [ ] Create AdminLogin component
- [ ] Create AdminLayout with sidebar navigation
- [ ] Build SubmissionTable for each submission type
- [ ] Build ContentEditor for each content type
- [ ] Add status update functionality (mark prayer as "prayed", etc.)
- [ ] Test CRUD for all content types
- [ ] Test submission viewing and status changes

### Phase 5 — Security

- [ ] Deploy security rules via Firebase CLI
- [ ] Create admin account in Firebase Console
- [ ] Add admin UID to `admins/` node
- [ ] Add input sanitization to all form handlers
- [ ] Test that unauthenticated users cannot read submissions
- [ ] Test that unauthenticated users cannot write to content
- [ ] Test that public users CAN write to submissions
- [ ] Test that public users CAN read content

### Post-launch

- [ ] Monitor Firebase usage in console
- [ ] Set up daily database backups (Firebase Console > Realtime Database > Backups)
- [ ] Set budget alerts in Google Cloud Console

---

## 9. Cost Estimation

Firebase Realtime Database pricing (Spark free tier):

| Resource | Free Tier Limit | Expected Usage |
|----------|----------------|----------------|
| Storage | 1 GB | < 10 MB |
| Downloads | 10 GB/month | < 1 GB |
| Simultaneous connections | 100 | < 20 |
| Writes | Unlimited | ~50-200/week |

**At the expected scale (< 1,000 visitors/month, < 200 form submissions/week), the entire application fits comfortably within the Firebase free Spark plan. No costs expected.**

If the site grows beyond free tier limits, the Blaze (pay-as-you-go) plan costs:
- $5/GB stored per month
- $1/GB downloaded
- Estimated cost at 10x scale: ~$1-3/month

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Firebase API key exposed in client** | Low — Firebase API keys are designed to be public. Security comes from database rules, not key secrecy. | Enforce strict security rules. Restrict key via Google Cloud Console to specific domains. |
| **Spam form submissions** | Medium — bots could flood prayer requests or signups | Add rate limiting via security rules (`newData.child('createdAt').val() > now - 5000`). Add a honeypot hidden field. |
| **Firebase outage** | Low — site goes static temporarily | Fallback to hard-coded arrays for content reads. Forms show "temporarily unavailable" error. |
| **Data loss** | Medium | Enable daily backups in Firebase Console. |
| **Admin credentials compromised** | High — attacker could read prayer requests, modify content | Use strong passwords. Consider adding 2FA. Limit admin accounts to 2-3. |
| **GDPR / data privacy** | Medium — storing names, emails, prayer requests | Add a brief privacy notice on forms ("Your data is kept confidential and used only for ministry purposes"). Implement data deletion on request. Choose EU region for database. |
| **Giving form confusion** | Medium — users may think clicking "Give" processes a payment | Add clear disclaimer: "This form records your giving intent. Complete your payment via M-Pesa or bank transfer." No payment credentials are ever collected. |

---

## Appendix: Decision Log

**Why Firebase Realtime Database over Firestore?**
- Simpler API for this use case (flat key-value structure)
- Lower latency for real-time admin views
- Free tier is more than sufficient
- The data model is shallow and relational complexity is minimal

**Why not a custom backend (Express/Node)?**
- No server to maintain, deploy, or pay for
- Firebase handles auth, database, and hosting
- The team is small and non-technical; operational simplicity matters

**Why not Supabase?**
- Firebase has better documentation for beginners
- The team doesn't need SQL/relational queries
- Firebase Auth is simpler for email/password-only use case
