import { jwtDecode } from "jwt-decode"
import { ACCESS_TOKEN } from "./constants"

// Decodes the JWT stored in localStorage without making an API call.
// jwt-decode only parses the base64 payload — it doesn't verify the signature,
// so this is purely for reading claims (username, is_setter, exp, user_id).
// The try/catch handles the case where the stored token is malformed or expired.
export function getDecodedToken() {
  const token = localStorage.getItem(ACCESS_TOKEN)
  if (!token) return null
  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}

// Reads the is_setter claim injected by CustomTokenObtainPairSerializer.
// Used throughout the frontend to conditionally show setter-only UI (e.g.
// the "Create Gym" button, "Add climb" button, and competition judging panel).
export function isSetter() {
  return getDecodedToken()?.is_setter ?? false
}
