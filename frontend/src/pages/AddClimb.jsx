import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const COLOURS = [
  { name: "Green", bg: "#4a8c5c" },
  { name: "Orange", bg: "#c4622d" },
  { name: "Blue", bg: "#3a6fa8" },
  { name: "Pink", bg: "#a0416e" },
  { name: "Yellow", bg: "#c9a020" },
  { name: "Black", bg: "#555050" },
  { name: "White", bg: "#f5f5f0" },
];

function AddClimb() {
  const { gymId, wallId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [colour, setColour] = useState("Green");
  const [grade, setGrade] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (grade === null) {
      setError("Please select a grade");
      return;
    }

    setLoading(true);

    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/`, {
        name,
        colour,
        suggested_grade: grade,
        image_url: imageUrl,
      });
      navigate(`/gym/${gymId}`);
    } catch (err) {
      console.log(err.response?.data);
      setError("Failed to add climb. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200">
        <h3 className="text-amber-900 font-bold italic text-xl">Beta Board</h3>
        <div className="w-9 h-9 rounded-full bg-stone-300 flex items-center justify-center text-sm font-bold text-stone-600">
          JS
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <div
          onClick={() => navigate(`/gym/${gymId}`)}
          className="text-amber-700 italic text-sm mb-6 cursor-pointer"
        >
          ‹ Back to gym
        </div>

        <h1 className="text-3xl font-bold italic text-amber-900 mb-1">
          Add a new climb
        </h1>
        <p className="text-sm italic text-amber-700 mb-8">
          Set the details so members can find and review it.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm italic px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="text-xs italic text-amber-800 block mb-1">
              Climb name
            </label>
            <input
              type="text"
              placeholder="e.g. Crimpy arête"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif"
            />
          </div>

          <div>
            <label className="text-xs italic text-amber-800 block mb-2">
              Hold colour — <span className="text-amber-600">{colour}</span>
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLOURS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColour(c.name)}
                  style={{ background: c.bg }}
                  className={`w-8 h-8 rounded-full border-2 transition-all
                                        ${
                                          colour === c.name
                                            ? "border-amber-900 scale-110"
                                            : "border-transparent"
                                        }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs italic text-amber-800 block mb-2">
              Setter grade {grade !== null && `— V${grade}`}
            </label>
            <div className="flex gap-2 flex-wrap">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`px-3 py-1 rounded-full text-sm italic border transition-colors
                                        ${
                                          grade === g
                                            ? "bg-amber-900 text-amber-50 border-amber-900"
                                            : "border-amber-300 text-amber-800 hover:border-amber-500"
                                        }`}
                >
                  V{g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs italic text-amber-800 block mb-1">
              Image URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="preview"
                className="mt-3 w-full h-36 object-cover rounded-lg border border-amber-200"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic font-serif disabled:opacity-50"
          >
            {loading ? "Adding climb..." : "Add climb"}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/gym/${gymId}`)}
            className="w-full py-3 rounded-xl border border-amber-300 text-amber-700 italic font-serif"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddClimb;
