import { useState } from "react"
import api from "../api"

// temporary to add gyms to db for frontend testing DELETE 

 
function CreateGym() {
    const [name, setName] = useState("")
    const [location, setLocation] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await api.post("/api/gyms/", { name, location })
            setSuccess(true)
            setName("")
            setLocation("")
        } catch (err) {
            setError("Failed to create gym. Are you logged in?")
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px" }}>
            <h2>Create a gym</h2>

            {success && <p style={{ color: "green" }}>Gym created successfully!</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "12px" }}>
                    <label>Gym name</label><br />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                    />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label>Location</label><br />
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create gym"}
                </button>
            </form>
        </div>
    )
}

export default CreateGym