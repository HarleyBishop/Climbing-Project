import { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";

function LoginRegisterForm({route, method}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState("")
    const navigate = useNavigate()

    const name = method === "login" ? "Login" : "Register"

    const handleSubmit = async (e) =>
    {
        setLoading(true);
        e.preventDefault()

        try{const res = await api.post(route, {username, password})
        if(method === "login") {
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
            navigate("/")
        }
        else{
            navigate("/login")
        }
    }
        catch(error){
            alert(error)
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
        
        <button className=" w-2/3 form-button outline-1 outline-amber-900 rounded-sm mb-3" type="submit">
            {name}
        </button>

        {name === "Login" && (
                <p className="text-sm text-amber-800 italic text-center">
                    Don't have an account?{" "}
                    <span onClick={() => navigate("/register")} className="text-amber-900 font-bold underline">
                        Register
                    </span>
                </p>
            )}
        
    
    </form>
    </div>
}

export default LoginRegisterForm