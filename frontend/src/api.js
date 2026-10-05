import axios from "axios"
import { ACCESS_TOKEN } from "./constants"

// Create an Axios instance scoped to the backend base URL so every request
// automatically uses the right host without repeating it everywhere.
// VITE_API_URL is set in .env (locally) or the hosting platform's environment
// variables (production). Vite only exposes env vars prefixed with VITE_.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

// Request interceptor — runs before every outgoing request.
// Reads the JWT access token from localStorage and attaches it as a Bearer
// token. This is what authenticates every API call to the Django backend.
// If no token exists (e.g. on the login page) the header is simply omitted.
//
// Public auth endpoints never get the header: DRF's JWTAuthentication rejects
// an expired/invalid token with 401 *before* permission checks run, so a stale
// token left in localStorage would otherwise break register/login/refresh even
// though those views are AllowAny.
const PUBLIC_AUTH_PATHS = ["/api/user/register/", "/api/token/", "/api/token/refresh/", "/api/auth/"]

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => config.url?.startsWith(p))
        if (token && !isPublicAuth) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default api;
