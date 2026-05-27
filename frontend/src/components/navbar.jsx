import { useNavigate } from "react-router-dom"
import { getDecodedToken } from "../auth"
import api from "../api"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"

function Navbar({ showBack, backLabel, backPath }) {
    const navigate = useNavigate()
    const decoded = getDecodedToken()
    const username = decoded?.username ?? ""
    const isSetterUser = decoded?.is_setter ?? false
    const initials = username?.slice(0, 2).toUpperCase()

    const handleLogout = async () => {
        const refresh = localStorage.getItem(REFRESH_TOKEN)
        try {
            await api.post("/api/token/blacklist/", { refresh })
        } catch {
            // blacklist failed (token already expired etc.) — still log out locally
        }
        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)
        navigate("/login")
    }

    return (
        <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200 bg-orange-50">
            {showBack ? (
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