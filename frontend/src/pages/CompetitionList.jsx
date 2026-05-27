import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import { isSetter } from "../auth";

const STATUS_STYLE = {
  open: "bg-green-100 text-green-800",
  upcoming: "bg-indigo-100 text-indigo-800",
  closed: "bg-stone-100 text-stone-600",
};

const TYPE_STYLE = {
  qualifier: "bg-amber-100 text-amber-800",
  finals: "bg-orange-100 text-orange-800",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function CompCard({ comp, gymId }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/gym/${gymId}/competitions/${comp.id}`)}
      className="cursor-pointer bg-amber-50 border border-amber-200 rounded-xl p-4 hover:border-amber-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold italic text-amber-900 leading-tight">{comp.title}</h3>
        <div className="flex gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full italic font-bold ${TYPE_STYLE[comp.comp_type]}`}>
            {comp.comp_type === "qualifier" ? "Qualifier" : "Finals"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full italic font-bold ${STATUS_STYLE[comp.status]}`}>
            {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
          </span>
        </div>
      </div>
      {comp.description && (
        <p className="text-xs italic text-amber-700 mb-3 line-clamp-2">{comp.description}</p>
      )}
      <div className="flex items-center justify-between text-xs italic text-amber-500">
        <span>{formatDate(comp.start_date)} → {formatDate(comp.end_date)}</span>
        <span>{comp.registration_count} registered</span>
      </div>
    </div>
  );
}

function CompetitionList() {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const canCreate = isSetter();

  const [gym, setGym] = useState(null);
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gymRes, compsRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/`),
          api.get(`/api/gyms/${gymId}/competitions/`),
        ]);
        setGym(gymRes.data);
        setComps(compsRes.data);
      } catch {
        setError("Failed to load competitions.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gymId]);

  if (loading)
    return (
      <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center text-amber-800 italic">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-red-600 italic text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm">Retry</button>
        </div>
      </div>
    );

  const open = comps.filter(c => c.status === "open");
  const upcoming = comps.filter(c => c.status === "upcoming");
  const closed = comps.filter(c => c.status === "closed");

  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      <Navbar showBack backLabel={gym?.name || "Back"} backPath={`/gym/${gymId}`} />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold italic text-amber-900 mb-1">Competitions</h1>
        <p className="text-sm italic text-amber-700 mb-8">{gym?.name}</p>

        {open.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">LIVE NOW</p>
            <div className="flex flex-col gap-3">
              {open.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">UPCOMING</p>
            <div className="flex flex-col gap-3">
              {upcoming.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
            </div>
          </section>
        )}

        {closed.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">PAST</p>
            <div className="flex flex-col gap-3">
              {closed.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
            </div>
          </section>
        )}

        {comps.length === 0 && (
          <div className="text-center py-16 text-amber-700 italic text-sm">
            No competitions yet{canCreate ? " — create one below." : "."}
          </div>
        )}

        {canCreate && (
          <button
            onClick={() => navigate(`/gym/${gymId}/competitions/create`)}
            className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic mt-4"
          >
            + Create Competition
          </button>
        )}
      </div>
    </div>
  );
}

export default CompetitionList;
