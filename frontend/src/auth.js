import { jwtDecode } from "jwt-decode"
import { ACCESS_TOKEN } from "./constants"

export function getDecodedToken() {
  const token = localStorage.getItem(ACCESS_TOKEN)
  if (!token) return null
  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}

export function isSetter() {
  return getDecodedToken()?.is_setter ?? false
}
