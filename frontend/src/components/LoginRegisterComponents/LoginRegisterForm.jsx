import { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

function LoginRegisterForm({route, method}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isSetterRole, setIsSetterRole] = useState(false)
    const [loading, setLoading] = useState("")
    const navigate = useNavigate()

    const name = method === "login" ? "Login" : "Register"
    const isRegister = method === "register"

    const handleOAuthSuccess = (tokens) => {
        localStorage.setItem(ACCESS_TOKEN, tokens.access);
        localStorage.setItem(REFRESH_TOKEN, tokens.refresh);
        navigate("/");
    };

    const handleOAuthError = (err) => {
        if (err?.response?.status === 403) {
            toast.error("Setter accounts cannot use OAuth. Please log in with your username and password.");
        } else {
            toast.error("OAuth sign-in failed. Please try again.");
        }
    };

    // useGoogleLogin (implicit flow) gives us an access_token which we forward
    // to the backend's /api/auth/google/ endpoint. The backend then calls
    // Google's userinfo endpoint to verify the token and get the user's profile,
    // then issues our own JWT pair. This keeps Google credentials server-side.
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await api.post("/api/auth/google/", { access_token: tokenResponse.access_token });
                handleOAuthSuccess(res.data);
            } catch (err) {
                handleOAuthError(err);
            }
        },
        onError: () => {
            toast.error("Google sign-in failed. Please try again.");
        },
    });

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault()

        try {
            const payload = { username, password }
            if (isRegister) payload.is_verified_setter = isSetterRole

            const res = await api.post(route, payload)
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
                navigate("/")
            } else {
                navigate("/login")
            }
        } catch (error) {
            const data = error?.response?.data;
            const msg = data?.username?.[0] || data?.password?.[0] || data?.detail || "Something went wrong. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false)
        }
    }

    return <div>
        <form onSubmit={handleSubmit} className="form-container flex flex-col items-center">

        <input className="w-full h-10 pl-3 form-input outline-1 outline-amber-900 rounded-sm mb-12 focus:bg-amber-100"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        />

        <input className="w-full h-10 pl-3 form-input2 outline-1 outline-amber-900 rounded-sm mb-10 focus:bg-amber-100"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        />

        {isRegister && (
            <div className="w-full mb-8">
                <p className="text-xs italic text-amber-800 mb-2">I am registering as a…</p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setIsSetterRole(false)}
                        className={`flex-1 py-2 rounded-lg text-sm italic border transition-colors
                            ${!isSetterRole
                                ? "bg-amber-900 text-amber-50 border-amber-900"
                                : "border-amber-300 text-amber-800 hover:border-amber-500"}`}
                    >
                        Climber
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsSetterRole(true)}
                        className={`flex-1 py-2 rounded-lg text-sm italic border transition-colors
                            ${isSetterRole
                                ? "bg-amber-900 text-amber-50 border-amber-900"
                                : "border-amber-300 text-amber-800 hover:border-amber-500"}`}
                    >
                        Setter / Gym Owner
                    </button>
                </div>
            </div>
        )}

        <button className="w-2/3 form-button outline-1 outline-amber-900 rounded-sm mb-3" type="submit">
            {loading ? "..." : name}
        </button>

        {name === "Login" ? (
                <p className="text-sm text-amber-800 italic text-center">
                    Don't have an account?{" "}
                    <span onClick={() => navigate("/register")} className="text-amber-900 font-bold underline cursor-pointer">
                        Register
                    </span>
                </p>
            ) : (
                <p className="text-sm text-amber-800 italic text-center">
                    Already have an account?{" "}
                    <span onClick={() => navigate("/login")} className="text-amber-900 font-bold underline cursor-pointer">
                        Login
                    </span>
                </p>
            )}

        <div className="w-full flex items-center gap-3 my-5">
            <hr className="flex-1 border-amber-300" />
            <span className="text-xs text-amber-700 italic whitespace-nowrap">or continue with</span>
            <hr className="flex-1 border-amber-300" />
        </div>

        <div className="w-full flex flex-col gap-3">
            <button
                type="button"
                onClick={() => googleLogin()}
                className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-lg border border-amber-300 text-amber-900 text-sm hover:border-amber-500 hover:bg-amber-50 transition-colors"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
            </button>
        </div>

        {isRegister && (
            <p className="text-xs text-amber-600 italic text-center mt-4">
                OAuth always creates a Climber account. Setters / Gym owners must register above.
            </p>
        )}

    </form>
    </div>
}

export default LoginRegisterForm
