import LoginRegisterForm from "../components/LoginRegisterComponents/LoginRegisterForm"

function Register() {
    return (
        <LoginRegisterForm route="/api/user/register/" method="register" />
    )
}

export default Register