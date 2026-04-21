import LoginRegisterForm from "../components/LoginRegisterComponents/LoginRegisterForm"

function Login() {
    return (
        <LoginRegisterForm route="/api/token/" method="login" />
    )
}

export default Login