/**
 * Tests for auth.js — JWT decoding utilities.
 *
 * auth.js reads a JWT from localStorage and decodes it client-side.
 * It does NOT verify the signature (that's the server's job) — it just parses
 * the base64 payload to read claims like username and is_setter.
 *
 * We use vi.mock() to replace jwt-decode with a controlled version so we
 * can test what happens with valid, expired, or malformed tokens without
 * needing a real JWT.
 *
 * Run with: npm test (inside frontend/)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock() is hoisted to the top of the file by Vitest — it runs before imports,
// so jwt-decode is replaced with our mock version everywhere it's used.
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

// Import the mocked version so we can configure what it returns in each test.
import { jwtDecode } from 'jwt-decode';
// Import the functions we're testing AFTER the mock is set up.
import { getDecodedToken, isSetter } from '../src/auth.js';

// ACCESS_TOKEN is the localStorage key name — 'access'.
const TOKEN_KEY = 'access';


// ─── getDecodedToken ──────────────────────────────────────────────────────────
// getDecodedToken() reads localStorage, calls jwtDecode(), and returns the
// payload object. If anything goes wrong (no token, bad token), it returns null.

describe('getDecodedToken', () => {

  beforeEach(() => {
    // Start each test with a clean localStorage and no mock return value.
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns null when no token is stored', () => {
    // localStorage.getItem('access') returns null by default.
    expect(getDecodedToken()).toBeNull();
  });

  it('returns the decoded payload when a valid token is stored', () => {
    const fakePayload = { user_id: 1, username: 'harley', is_setter: false, exp: 9999999999 };
    localStorage.setItem(TOKEN_KEY, 'header.payload.signature');
    jwtDecode.mockReturnValue(fakePayload);

    const result = getDecodedToken();
    expect(result).toEqual(fakePayload);
  });

  it('calls jwtDecode with the stored token string', () => {
    const tokenStr = 'my.fake.token';
    localStorage.setItem(TOKEN_KEY, tokenStr);
    jwtDecode.mockReturnValue({ user_id: 1 });

    getDecodedToken();

    // Verify jwtDecode was actually called with the right string — not a stale
    // or wrong value.
    expect(jwtDecode).toHaveBeenCalledWith(tokenStr);
  });

  it('returns null when jwtDecode throws (malformed token)', () => {
    // A tampered or truncated token will cause jwtDecode to throw.
    // getDecodedToken() must catch this and return null rather than crashing.
    localStorage.setItem(TOKEN_KEY, 'not-a-valid-jwt');
    jwtDecode.mockImplementation(() => { throw new Error('Invalid token'); });

    expect(getDecodedToken()).toBeNull();
  });
});


// ─── isSetter ─────────────────────────────────────────────────────────────────
// isSetter() reads the is_setter claim from the decoded JWT.
// This claim is injected by CustomTokenObtainPairSerializer on the backend.
// The frontend uses it to conditionally show setter-only UI without an API call.

describe('isSetter', () => {

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns false when no token is stored', () => {
    // If the user isn't logged in, they're definitely not a setter.
    expect(isSetter()).toBe(false);
  });

  it('returns false for a regular climber token (is_setter: false)', () => {
    localStorage.setItem(TOKEN_KEY, 'header.payload.sig');
    jwtDecode.mockReturnValue({ user_id: 2, username: 'climber', is_setter: false });

    expect(isSetter()).toBe(false);
  });

  it('returns true for a setter token (is_setter: true)', () => {
    localStorage.setItem(TOKEN_KEY, 'header.payload.sig');
    jwtDecode.mockReturnValue({ user_id: 3, username: 'setter', is_setter: true });

    expect(isSetter()).toBe(true);
  });

  it('returns false when the token is malformed (jwtDecode throws)', () => {
    localStorage.setItem(TOKEN_KEY, 'garbage');
    jwtDecode.mockImplementation(() => { throw new Error('Bad token'); });

    // Should not throw — must safely return false.
    expect(isSetter()).toBe(false);
  });

  it('returns false when is_setter claim is missing from the payload', () => {
    // An older token or a token from a different system might not have is_setter.
    // The ?. operator and ?? false default handle this gracefully.
    localStorage.setItem(TOKEN_KEY, 'header.payload.sig');
    jwtDecode.mockReturnValue({ user_id: 4, username: 'mystery_user' });

    expect(isSetter()).toBe(false);
  });
});
