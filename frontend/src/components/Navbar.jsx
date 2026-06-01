import { useNavigate } from "react-router-dom"
import { getDecodedToken } from "../auth"
import api from "../api"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"

// Shared top bar used across all protected pages.
// showBack / backLabel / backPath control whether to show a back arrow (deep
// pages like ClimbPage) or the "Beta Board" logo (top-level pages like Home).
function Navbar({ showBack, backLabel, backPath }) {
    const navigate = useNavigate()
    // Reading claims from the JWT avoids a round-trip to /me on every page render.
    const decoded = getDecodedToken()
    const username = decoded?.username ?? ""
    const isSetterUser = decoded?.is_setter ?? false
    const initials = username?.slice(0, 2).toUpperCase()

    const handleLogout = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN)
        try {
            // Blacklisting the refresh token server-side prevents it from being
            // used to obtain new access tokens even if someone intercepts it.
            // If this fails (token already expired, network error etc.) we still
            // clear localStorage and navigate away — a failed blacklist shouldn't
            // block the user from logging out.
            await api.post("/api/token/blacklist/", { refresh })
        } catch {
            // intentionally swallowed
        }
        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)
        navigate("/login")
    }

    return (
        <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200 bg-orange-50">
            {showBack ? (
                // backPath navigates to a specific page (e.g. back to gym).
                // Falling back to navigate(-1) mimics the browser back button
                // for cases where no explicit path is needed.
                <div
                    onClick={() => backPath ? navigate(backPath) : navigate(-1)}
                    className="text-amber-700 italic text-sm cursor-pointer"
                >
                    ‹ {backLabel || "Back"}
                </div>
            ) : (
                <h3 className="text-amber-900 font-bold italic text-xl">Beta Board</h3>
            )}

            <div className="flex items-center gap-3">
                {/* Setter badge only visible when the JWT contains is_setter=true */}
                {isSetterUser && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900 text-amber-50 italic font-bold">
                        Setter
                    </span>
                )}
                <div
                    onClick={() => navigate("/profile")}
                    className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-900 cursor-pointer hover:bg-amber-300 transition-colors"
                >
                    {initials}
                </div>
                <button
                    onClick={handleLogout}
                    className="text-xs italic text-amber-700 hover:text-amber-900 transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    )
}

export default Navbar
