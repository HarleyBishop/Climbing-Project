import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

function Navbar({ showBack, backLabel, backPath }) {
    const navigate = useNavigate()
    const token = localStorage.getItem("access")
    
    const username = token ? jwtDecode(token).username : ""
    const initials = username?.slice(0, 2).toUpperCase()

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

            <div
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-900 cursor-pointer hover:bg-amber-300 transition-colors"
            >
                {initials}
            </div>
        </div>
    )
}

export default Navbar