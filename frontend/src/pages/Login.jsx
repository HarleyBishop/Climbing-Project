import LoginRegisterForm from "../components/LoginRegisterComponents/LoginRegisterForm"

function Login() {
    return (
    <div className="flex min-h-screen font-serif">

        {/* Form side */}
        <div className="w-full md:w-1/2 bg-amber-50 flex flex-col px-16 pt-40 items-center ">
            <div className="w-full max-w-sm">
            <h1 className="text-amber-900 text-4xl font-bold italic leading-tight mb-6 ">
                Ready to climb<br />above the haters?
            </h1>

            <p className="text-amber-800 italic text-base mb-12 leading-relaxed">
                Login and let's prove those 'V2 in my Gym',<br />
                climbers wrong, one climb at a time!
            </p>

            <LoginRegisterForm route="/api/token/" method="login" />
            </div>
        </div>

        {/* Image side */}
        <div className="hidden md:block md:w-1/2 h-screen sticky top-0">
            <img
                src="/LoginRegisterImage.jpg"
                alt="climbing"
                className="w-full h-full object-cover"
            />
        </div>

    </div>
)
}

export default Login