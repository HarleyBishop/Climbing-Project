import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";

function CreateCompetition() {
  const { gymId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [compType, setCompType] = useState("qualifier");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [topX, setTopX] = useState("");
  const [linkedQualifier, setLinkedQualifier] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [newDivision, setNewDivision] = useState("");
  const [rounds, setRounds] = useState([]);
  const [newRound, setNewRound] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addDivision = () => {
    if (newDivision.trim()) {
      setDivisions([...divisions, newDivision.trim()]);
      setNewDivision("");
    }
  };

  const addRound = () => {
    if (newRound.trim()) {
      setRounds([...rounds, newRound.trim()]);
      setNewRound("");
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) return setError("Please enter a title.");
    if (!startDate) return setError("Please set a start date.");
    if (!endDate) return setError("Please set an end date.");
    if (new Date(endDate) <= new Date(startDate)) return setError("End date must be after start date.");

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        rules,
        comp_type: compType,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      };
      if (compType === "qualifier" && topX) payload.top_x_advance = parseInt(topX);
      if (compType === "finals" && linkedQualifier) payload.linked_qualifier = parseInt(linkedQualifier);

      const res = await api.post(`/api/gyms/${gymId}/competitions/`, payload);
      const compId = res.data.id;

      await Promise.all([
        ...divisions.map((name, i) =>
          api.post(`/api/competitions/${compId}/divisions/`, { name })
        ),
        ...rounds.map((name, i) =>
          api.post(`/api/competitions/${compId}/rounds/`, { name, order: i + 1 })
        ),
      ]);

      navigate(`/gym/${gymId}/competitions/${compId}`);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const key = Object.keys(data)[0];
        setError(data[key]?.[0] || "Failed to create competition.");
      } else {
        setError("Failed to create competition.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      <Navbar showBack backLabel="Competitions" backPath={`/gym/${gymId}/competitions`} />
      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold italic text-amber-900 mb-1">Create Competition</h1>
        <p className="text-sm italic text-amber-700 mb-8">Set up your comp details.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm italic px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Type selector */}
        <div className="mb-6">
          <p className="text-xs italic text-amber-800 mb-2">Competition type</p>
          <div className="flex gap-3">
            {["qualifier", "finals"].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setCompType(t)}
                className={`flex-1 py-2 rounded-lg text-sm italic border transition-colors
                  ${compType === t ? "bg-amber-900 text-amber-50 border-amber-900" : "border-amber-300 text-amber-800 hover:border-amber-500"}`}
              >
                {t === "qualifier" ? "Qualifier" : "Finals / World Cup"}
              </button>
            ))}
          </div>
        </div>

        <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Spring Open 2026" />
        <Field label="Description" value={description} onChange={setDescription} placeholder="Brief overview of the comp" textarea />
        <Field label="Rules (optional)" value={rules} onChange={setRules} placeholder="Competition rules, format, scoring notes..." textarea />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs italic text-amber-800 block mb-1">Start date & time</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif text-sm" />
          </div>
          <div>
            <label className="text-xs italic text-amber-800 block mb-1">End date & time</label>
            <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif text-sm" />
          </div>
        </div>

        {compType === "qualifier" && (
          <Field label="Top X advance to finals (optional)" value={topX} onChange={setTopX}
            placeholder="e.g. 8" type="number" />
        )}
        {compType === "finals" && (
          <Field label="Linked qualifier ID (optional)" value={linkedQualifier}
            onChange={setLinkedQualifier} placeholder="Competition ID of the qualifier" type="number" />
        )}

        {/* Divisions */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-2">DIVISIONS</p>
          {divisions.map((d, i) => (
            <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
              <span className="text-sm italic text-amber-900">{d}</span>
              <button type="button" onClick={() => setDivisions(divisions.filter((_, j) => j !== i))}
                className="text-xs italic text-red-500 hover:text-red-700">Remove</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input type="text" placeholder="e.g. Open, Women's, Novice" value={newDivision}
              onChange={e => setNewDivision(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addDivision()}
              className="flex-1 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif text-sm" />
            <button type="button" onClick={addDivision}
              className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800 italic text-sm hover:border-amber-500">
              Add
            </button>
          </div>
        </div>

        {/* Rounds */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-2">ROUNDS (optional)</p>
          {rounds.map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
              <span className="text-sm italic text-amber-900">{i + 1}. {r}</span>
              <button type="button" onClick={() => setRounds(rounds.filter((_, j) => j !== i))}
                className="text-xs italic text-red-500 hover:text-red-700">Remove</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input type="text" placeholder="e.g. Qualifier, Semi-final, Final" value={newRound}
              onChange={e => setNewRound(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addRound()}
              className="flex-1 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif text-sm" />
            <button type="button" onClick={addRound}
              className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800 italic text-sm hover:border-amber-500">
              Add
            </button>
          </div>
        </div>

        <button type="button" onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic mb-3 disabled:opacity-50">
          {loading ? "Creating…" : "Create Competition"}
        </button>
        <button type="button" onClick={() => navigate(`/gym/${gymId}/competitions`)}
          className="w-full py-3 rounded-xl border border-amber-300 text-amber-700 italic">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", textarea = false }) {
  const cls = "w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif text-sm";
  return (
    <div className="mb-4">
      <label className="text-xs italic text-amber-800 block mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`${cls} h-24 resize-none`} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={cls} />}
    </div>
  );
}

export default CreateCompetition;
