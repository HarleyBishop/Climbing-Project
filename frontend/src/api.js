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
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default api;
