/**
 * auth.js — Craftora EDS Shared Auth Utilities
 * localStorage-based authentication (phone + password).
 * Matches legacy craftora/scripts/auth.js exactly.
 */

const AUTH_KEY = 'craftora_user';
const ACCOUNTS_KEY = 'craftora_accounts';

/* ── Phone Validation ── */

export function normalizePhone(raw) {
  return String(raw ?? '').replace(/\D/g, '').slice(-10);
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(normalizePhone(phone));
}

/* ── Password Validation ── */

const PASSWORD_RULES = [
  { id: 'length', label: 'Minimum 6 characters', test: (pw) => pw.length >= 6 },
];

export function validatePassword(password) {
  const results = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }));
  return { valid: results.every((r) => r.passed), results };
}

/* ── User CRUD ── */

export function getUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch { return []; }
}

export function saveAccount(user) {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.phone === user.phone);
  if (idx >= 0) accounts[idx] = user;
  else accounts.push(user);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = '/';
}

/* ── Login ── */

export function attemptLogin(phone, password) {
  const normalized = normalizePhone(phone);
  const accounts = getAccounts();
  const account = accounts.find((a) => a.phone === normalized);

  if (!account) return { ok: false, error: 'No account found with this phone number.' };
  if (account.password !== password) return { ok: false, error: 'Incorrect password.' };

  const { password: pw, ...session } = account;
  saveUser(session);
  return { ok: true };
}

/* ── Signup ── */

export function attemptSignup({ name, phone, email, address, addressObj, password }) {
  const normalized = normalizePhone(phone);
  const accounts = getAccounts();

  if (accounts.find((a) => a.phone === normalized)) {
    return { ok: false, error: 'An account with this phone number already exists.' };
  }

  const user = {
    name,
    phone: normalized,
    email: email || '',
    address: address || '',
    addressObj: addressObj || {},
    password,
    joinedAt: new Date().toISOString(),
  };
  saveAccount(user);

  // Auto-login
  const { password: pw, ...session } = user;
  saveUser(session);
  return { ok: true };
}
