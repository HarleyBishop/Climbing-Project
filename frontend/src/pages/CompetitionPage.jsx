import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import Navbar from "../components/Navbar";
import { isSetter, getDecodedToken } from "../auth";
import { PageSkeleton } from "../components/Skeleton";
import toast from "react-hot-toast";

const STATUS_STYLE = {
  open:     "bg-green-100 text-green-800",
  upcoming: "bg-indigo-100 text-indigo-800",
  closed:   "bg-stone-100 text-stone-600",
};

const COLOUR_MAP = {
  Green: "#4a8c5c", Orange: "#c4622d", Blue: "#3a6fa8",
  Pink: "#a0416e",  Yellow: "#c9a020", Black: "#555050", White: "#f5f5f0",
};

// Date formatting helpers used throughout this file.
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────
// Generic tab bar component — the active tab gets a bottom border highlight
// using -mb-px to overlap the container's border-b, making it look connected.
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-amber-200 mb-6">
      {tabs.map(t => (
        <button key={t.key} type="button" onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm italic border-b-2 transition-colors -mb-px
            ${active === t.key
              ? "border-amber-900 text-amber-900 font-bold"
              : "border-transparent text-amber-600 hover:text-amber-800"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Info tab ────────────────────────────────────────────────────────────────
// Shows competition metadata, registration button, and status. onRegister is
// passed down from the parent so the parent can refetch comp data after
// registration (which updates the is_registered flag).
function InfoTab({ comp, isRegistered, onRegister, registering }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Opens", value: fmtDateTime(comp.start_date) },
          { label: "Closes", value: fmtDateTime(comp.end_date) },
          { label: "Registered", value: comp.registration_count },
          { label: "Type", value: comp.comp_type === "qualifier" ? "Qualifier" : "Finals" },
        ].map(s => (
          <div key={s.label} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-base font-bold italic text-amber-900">{s.value}</p>
            <p className="text-xs italic text-amber-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {comp.top_x_advance && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4 text-sm italic text-indigo-800">
          Top {comp.top_x_advance} climbers advance to finals
        </div>
      )}

      {comp.description && (
        <div className="mb-4">
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-2">ABOUT</p>
          <p className="text-sm italic text-amber-800 leading-relaxed">{comp.description}</p>
        </div>
      )}

      {comp.rules && (
        <div className="mb-4">
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-2">RULES</p>
          {/* whitespace-pre-line preserves line breaks the setter may have
              typed in the rules textarea. */}
          <p className="text-sm italic text-amber-800 whitespace-pre-line leading-relaxed">{comp.rules}</p>
        </div>
      )}

      {comp.divisions?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-2">DIVISIONS</p>
          <div className="flex flex-wrap gap-2">
            {comp.divisions.map(d => (
              <span key={d.id} className="text-xs italic px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {comp.rounds?.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-2">ROUNDS</p>
          <div className="flex flex-col gap-1">
            {comp.rounds.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 text-sm italic text-amber-800">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                {r.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-px bg-amber-200 mb-6" />

      {comp.status === "closed" ? (
        <p className="text-sm italic text-amber-500 text-center py-4">This competition has ended.</p>
      ) : isRegistered ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span className="text-green-700 text-lg">✓</span>
          <p className="text-sm italic text-green-800">You're registered — head to the Climbs tab to log your sends.</p>
        </div>
      ) : (
        <button onClick={onRegister} disabled={registering}
          className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic disabled:opacity-50">
          {registering ? "Registering…" : "Register for this competition"}
        </button>
      )}
    </div>
  );
}

// ─── Climbs tab ──────────────────────────────────────────────────────────────
// Handles two user flows:
// 1. Setter: can add/remove climbs from the competition.
// 2. Registered climber: can log sends against comp climbs while it's open.
// onSendLogged and onClimbRemoved are callbacks that trigger a refetch in the
// parent so the climbs list and send state stay in sync.
function ClimbsTab({ comp, compClimbs, mySends, gymId, canEdit, onSendLogged, onClimbRemoved }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [gymClimbs, setGymClimbs] = useState([]);
  const [addSearch, setAddSearch] = useState("");
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingPoints, setPendingPoints] = useState(100);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const [logModal, setLogModal] = useState(null);
  const [logAttempts, setLogAttempts] = useState("");
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState(null);

  // Set for fast O(1) lookups when filtering out already-added climbs.
  const alreadyInComp = new Set(compClimbs.map(cc => cc.climb));
  // Map comp_climb ID → send object so we can check "did I send this?" per row
  // without iterating the whole sends array on every render.
  const mySendMap = Object.fromEntries(mySends.map(s => [s.comp_climb, s]));
  const canLog = comp.status === "open" && comp.is_registered;

  const openAddModal = async () => {
    setAddError(null);
    setShowAddModal(true);
    // Only fetch the gym's climbs the first time the modal opens — cached in
    // state so subsequent openings don't hit the API again.
    if (gymClimbs.length === 0) {
      try {
        const res = await api.get(`/api/gyms/${gymId}/all-climbs/`);
        setGymClimbs(res.data);
      } catch {
        setAddError("Failed to load gym climbs.");
      }
    }
  };

  const handleAdd = async () => {
    if (!pendingAdd) return;
    setAdding(true);
    setAddError(null);
    try {
      await api.post(`/api/competitions/${comp.id}/climbs/`, {
        climb: pendingAdd.id,
        points_value: pendingPoints,
      });
      // Calling onClimbRemoved (which was named for removal but acts as a
      // general "refetch comp climbs" signal) updates the parent's list.
      onClimbRemoved();
      setShowAddModal(false);
      setPendingAdd(null);
      setPendingPoints(100);
    } catch (err) {
      setAddError(err.response?.data?.non_field_errors?.[0] || "Failed to add climb.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (compClimbId) => {
    try {
      await api.delete(`/api/competitions/${comp.id}/climbs/${compClimbId}/`);
      onClimbRemoved();
    } catch {}
  };

  const handleLogSend = async () => {
    setLogError(null);
    const att = parseInt(logAttempts);
    if (!att || att < 1) return setLogError("Enter a valid number of attempts.");
    setLogging(true);
    try {
      await api.post(`/api/competitions/${comp.id}/log-send/`, {
        comp_climb: logModal.id,
        attempts: att,
      });
      onSendLogged();
      setLogModal(null);
      setLogAttempts("");
    } catch (err) {
      setLogError(err.response?.data?.detail || "Failed to log send.");
    } finally {
      setLogging(false);
    }
  };

  // Filter out climbs already in the comp and apply the search query.
  const filtered = gymClimbs.filter(c =>
    !alreadyInComp.has(c.id) &&
    (c.name.toLowerCase().includes(addSearch.toLowerCase()) ||
     c.wall_name?.toLowerCase().includes(addSearch.toLowerCase()))
  );

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <button onClick={openAddModal}
            className="text-xs italic px-4 py-2 rounded-full bg-amber-900 text-amber-50 hover:bg-amber-800 transition-colors">
            + Add climb
          </button>
        </div>
      )}

      {compClimbs.length === 0 ? (
        <p className="text-sm italic text-amber-500 text-center py-12">
          No climbs added to this competition yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {compClimbs.map(cc => {
            const colour = COLOUR_MAP[cc.climb_colour] || "#c9a98a";
            const mySend = mySendMap[cc.id];
            return (
              <div key={cc.id} className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xs text-white font-bold italic"
                    style={{ background: colour }}>
                    V{cc.climb_grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold italic text-amber-900 text-sm truncate">{cc.climb_name}</p>
                    <p className="text-xs italic text-amber-500">{cc.wall_name} · {cc.points_value} pts</p>
                  </div>
                  {mySend ? (
                    <div className="text-right shrink-0">
                      <span className="text-xs italic px-2 py-1 rounded-full bg-green-100 text-green-800">
                        ✓ {mySend.attempts} att.
                      </span>
                    </div>
                  ) : canLog ? (
                    <button onClick={() => { setLogModal(cc); setLogAttempts(""); setLogError(null); }}
                      className="text-xs italic px-3 py-1.5 rounded-full bg-amber-900 text-amber-50 shrink-0">
                      Log send
                    </button>
                  ) : null}
                  {canEdit && (
                    <button onClick={() => handleRemove(cc.id)}
                      className="text-xs italic text-red-400 hover:text-red-600 shrink-0 ml-1">✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!comp.is_registered && comp.status === "open" && (
        <p className="text-xs italic text-amber-500 text-center mt-6">Register on the Info tab to log your sends.</p>
      )}

      {/* Log send modal */}
      {logModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setLogModal(null)}>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 w-80 font-serif"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold italic text-amber-900 mb-1">Log comp send</h2>
            <p className="text-xs italic text-amber-600 mb-4">{logModal.climb_name} · {logModal.points_value} pts</p>
            {logError && <p className="text-red-600 italic text-xs mb-3">{logError}</p>}
            <label className="text-xs italic text-amber-800 block mb-1">Attempts</label>
            <input type="number" placeholder="e.g. 3" value={logAttempts}
              onChange={e => setLogAttempts(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-4" />
            <div className="flex gap-3">
              <button onClick={handleLogSend} disabled={logging}
                className="flex-1 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm disabled:opacity-50">
                {logging ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setLogModal(null)}
                className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-700 italic text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add climb modal — two-step: pick a climb from search list, then
          set its points value before confirming. pendingAdd drives which step. */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 w-96 font-serif max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold italic text-amber-900 mb-4">Add climb to competition</h2>
            {addError && <p className="text-red-600 italic text-xs mb-3">{addError}</p>}

            {pendingAdd ? (
              // Step 2: confirm the climb and set points value
              <div>
                <p className="text-sm italic text-amber-800 mb-4">
                  Adding <strong>{pendingAdd.name}</strong> (V{pendingAdd.suggested_grade})
                </p>
                <label className="text-xs italic text-amber-800 block mb-1">Points value</label>
                <input type="number" value={pendingPoints} onChange={e => setPendingPoints(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-4" />
                <div className="flex gap-3">
                  <button onClick={handleAdd} disabled={adding}
                    className="flex-1 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm disabled:opacity-50">
                    {adding ? "Adding…" : "Confirm"}
                  </button>
                  <button onClick={() => setPendingAdd(null)}
                    className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-700 italic text-sm">Back</button>
                </div>
              </div>
            ) : (
              // Step 1: search and select a climb
              <>
                <input type="text" placeholder="Search climbs…" value={addSearch}
                  onChange={e => setAddSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-3 text-sm" />
                <div className="overflow-y-auto flex-1">
                  {filtered.length === 0 ? (
                    <p className="text-sm italic text-amber-500 py-4 text-center">No climbs available.</p>
                  ) : filtered.map(c => (
                    <div key={c.id} onClick={() => setPendingAdd(c)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-amber-100 cursor-pointer mb-1">
                      <div className="w-8 h-8 rounded shrink-0"
                        style={{ background: COLOUR_MAP[c.colour] || "#c9a98a" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm italic font-bold text-amber-900 truncate">{c.name}</p>
                        <p className="text-xs italic text-amber-500">{c.wall_name} · V{c.suggested_grade}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Qualifier leaderboard ────────────────────────────────────────────────────
// Live-updating leaderboard that polls every 30 seconds during an open comp.
// useCallback memoises fetch so it can be used as a setInterval callback
// without causing the interval to reset on every render.
function QualifierLeaderboard({ compId, currentUserId }) {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get(`/api/competitions/${compId}/leaderboard/`);
      setRankings(res.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [compId]);

  useEffect(() => {
    fetch();
    // Poll every 30 seconds so standings update without requiring a page refresh.
    // The cleanup function clears the interval when the tab is changed or the
    // component unmounts, preventing stale updates.
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [fetch]);

  const rankColour = r => r === 1 ? "text-amber-600" : r === 2 ? "text-stone-500" : r === 3 ? "text-amber-800" : "text-amber-400";
  const maxPts = rankings[0]?.points || 1;

  if (loading) return <p className="text-sm italic text-amber-500 py-8 text-center">Loading…</p>;
  if (rankings.length === 0) return <p className="text-sm italic text-amber-500 py-8 text-center">No sends logged yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {rankings.map(entry => {
        const isMe = entry.user_id === currentUserId;
        const bar = Math.round((entry.points / maxPts) * 100);
        return (
          <div key={entry.user_id}
            onClick={() => navigate(`/profile/${entry.user_id}`)}
            className={`flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3 cursor-pointer hover:border-amber-400 transition-colors
              ${isMe ? "border-2 border-amber-900" : "border border-amber-200"}`}>
            <span className={`text-lg font-bold italic min-w-6 text-center ${rankColour(entry.rank)}`}>{entry.rank}</span>
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-900 shrink-0">
              {entry.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold italic text-amber-900 text-sm truncate">@{entry.username}</p>
                {isMe && <span className="text-xs italic px-2 py-0.5 rounded-full bg-orange-100 text-amber-800 shrink-0">You</span>}
                {entry.advances && (
                  <span className="text-xs italic px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 shrink-0">Advances</span>
                )}
              </div>
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-900 rounded-full transition-all" style={{ width: `${bar}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold italic text-amber-900">{entry.points} pts</p>
              <p className="text-xs italic text-amber-500">{entry.climbs_completed} climbs · {entry.total_attempts} att.</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Finals tab ───────────────────────────────────────────────────────────────
// Combines the IFSC leaderboard display with the setter's judging panel.
// isSetterUser controls whether the judging panel is shown — it's always
// hidden from regular climbers.
function FinalsTab({ comp, compClimbs, registrations, isSetterUser, currentUserId }) {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  // judgingClimb = the CompClimb currently being judged in the panel.
  const [judgingClimb, setJudgingClimb] = useState(null);
  // judgeForm is keyed by user ID so each registrant has independent form state.
  const [judgeForm, setJudgeForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await api.get(`/api/competitions/${comp.id}/finals-results/`);
      setResults(res.data);
    } catch {} finally {
      setLoadingResults(false);
    }
  }, [comp.id]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await api.get(`/api/competitions/${comp.id}/finals-leaderboard/`);
      return res.data;
    } catch { return []; }
  }, [comp.id]);

  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    fetchResults();
    fetchLeaderboard().then(setLeaderboard);
    // Same 30-second poll as the qualifier leaderboard for live updates.
    const id = setInterval(() => {
      fetchResults();
      fetchLeaderboard().then(setLeaderboard);
    }, 30000);
    return () => clearInterval(id);
  }, [fetchResults, fetchLeaderboard]);

  const openJudging = (cc) => {
    // Pre-populate the form with any existing results so the judge can see
    // and edit what's already been recorded rather than starting from scratch.
    const existing = {};
    registrations.forEach(reg => {
      const result = results.find(r => r.comp_climb === cc.id && r.user === reg.user);
      existing[reg.user] = result || { topped: false, top_attempts: "", zoned: false, zone_attempts: "" };
    });
    setJudgeForm(existing);
    setJudgingClimb(cc);
    setSaveError(null);
  };

  const saveResult = async (userId) => {
    setSaving(true);
    setSaveError(null);
    const f = judgeForm[userId];
    try {
      await api.post(`/api/competitions/${comp.id}/finals-results/`, {
        comp_climb: judgingClimb.id,
        user: userId,
        topped: f.topped,
        // Only send attempt counts when the corresponding boolean is true —
        // the backend uses update_or_create so this overwrites previous values.
        top_attempts: f.topped ? (parseInt(f.top_attempts) || null) : null,
        zoned: f.zoned,
        zone_attempts: f.zoned ? (parseInt(f.zone_attempts) || null) : null,
      });
      await fetchResults();
      fetchLeaderboard().then(setLeaderboard);
    } catch (err) {
      setSaveError(err.response?.data?.detail || "Failed to save result.");
    } finally {
      setSaving(false);
    }
  };

  const rankColour = r => r === 1 ? "text-amber-600" : r === 2 ? "text-stone-500" : r === 3 ? "text-amber-800" : "text-amber-400";

  return (
    <div>
      {/* IFSC leaderboard — tops/zones with attempt counts displayed in the
          standard competition format: "2/4a" means 2 tops in 4 attempts. */}
      {leaderboard.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">RESULTS</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 bg-orange-100 px-4 py-2 text-xs font-bold text-amber-800 uppercase tracking-wide">
              <span>#</span>
              <span className="col-span-2">Climber</span>
              <span className="text-center">Tops</span>
              <span className="text-center">Zones</span>
              <span className="text-center">Att.</span>
            </div>
            {leaderboard.map(e => (
              <div key={e.user_id}
                onClick={() => navigate(`/profile/${e.user_id}`)}
                className={`grid grid-cols-6 px-4 py-3 border-t border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors
                  ${e.user_id === currentUserId ? "bg-orange-50" : ""}`}>
                <span className={`text-sm font-bold italic ${rankColour(e.rank)}`}>{e.rank}</span>
                <span className="col-span-2 text-sm italic text-amber-900 truncate">@{e.username}</span>
                <span className="text-center text-sm font-bold italic text-amber-900">
                  {e.tops}<span className="text-xs text-amber-500 font-normal">/{e.top_attempts}a</span>
                </span>
                <span className="text-center text-sm font-bold italic text-amber-700">
                  {e.zones}<span className="text-xs text-amber-500 font-normal">/{e.zone_attempts}a</span>
                </span>
                <span className="text-center text-xs italic text-amber-500">{e.top_attempts + e.zone_attempts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaderboard.length === 0 && !loadingResults && (
        <p className="text-sm italic text-amber-500 py-8 text-center">No results recorded yet.</p>
      )}

      {/* Judging panel — only visible to setters. The judge selects a climb,
          then enters topped/zoned and attempt counts per registered climber. */}
      {isSetterUser && (
        <div>
          <div className="h-px bg-amber-200 mb-6" />
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">JUDGING PANEL</p>
          {saveError && <p className="text-red-600 italic text-xs mb-3">{saveError}</p>}

          {compClimbs.length === 0 ? (
            <p className="text-sm italic text-amber-500">No climbs added yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {compClimbs.map(cc => (
                <button key={cc.id} type="button" onClick={() => openJudging(cc)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors
                    ${judgingClimb?.id === cc.id
                      ? "border-amber-900 bg-amber-100"
                      : "border-amber-200 bg-amber-50 hover:border-amber-400"}`}>
                  <div>
                    <p className="text-sm font-bold italic text-amber-900">{cc.climb_name}</p>
                    <p className="text-xs italic text-amber-500">{cc.wall_name} · V{cc.climb_grade}</p>
                  </div>
                  {/* Progress counter — "X/Y judged" shows how complete the panel is. */}
                  <span className="text-xs italic text-amber-600">
                    {results.filter(r => r.comp_climb === cc.id).length}/{registrations.length} judged
                  </span>
                </button>
              ))}
            </div>
          )}

          {judgingClimb && registrations.length > 0 && (
            <div className="border border-amber-300 rounded-xl p-4 bg-amber-50">
              <p className="text-sm font-bold italic text-amber-900 mb-4">
                {judgingClimb.climb_name} — enter results per climber
              </p>
              {registrations.map(reg => {
                const f = judgeForm[reg.user] || { topped: false, top_attempts: "", zoned: false, zone_attempts: "" };
                return (
                  <div key={reg.user} className="border-b border-amber-200 pb-4 mb-4 last:border-0 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold italic text-amber-900">@{reg.username}</p>
                      <button onClick={() => saveResult(reg.user)} disabled={saving}
                        className="text-xs italic px-3 py-1 rounded-lg bg-amber-900 text-amber-50 disabled:opacity-50">
                        {saving ? "…" : "Save"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ResultToggle label="Topped" checked={f.topped}
                        onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], topped: v } }))} />
                      {f.topped && (
                        <div>
                          <label className="text-xs italic text-amber-700 block mb-1">Top attempts</label>
                          <input type="number" value={f.top_attempts} min="1"
                            onChange={e => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], top_attempts: e.target.value } }))}
                            className="w-full px-2 py-1.5 rounded border border-amber-200 bg-white text-amber-900 text-sm font-serif" />
                        </div>
                      )}
                      <ResultToggle label="Zoned" checked={f.zoned}
                        onChange={v => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], zoned: v } }))} />
                      {f.zoned && (
                        <div>
                          <label className="text-xs italic text-amber-700 block mb-1">Zone attempts</label>
                          <input type="number" value={f.zone_attempts} min="1"
                            onChange={e => setJudgeForm(prev => ({ ...prev, [reg.user]: { ...prev[reg.user], zone_attempts: e.target.value } }))}
                            className="w-full px-2 py-1.5 rounded border border-amber-200 bg-white text-amber-900 text-sm font-serif" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Custom toggle switch component for the judging panel's topped/zoned inputs.
// translate-x-5 / translate-x-0 slides the knob left/right to match the
// checked state without needing a third-party component library.
function ResultToggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full cursor-pointer transition-colors flex items-center px-0.5
          ${checked ? "bg-amber-900" : "bg-stone-300"}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
      <span className="text-xs italic text-amber-800">{label}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
// Orchestrates data fetching for all sub-components and passes down callbacks
// so children can trigger refetches without prop-drilling state setters.
// useCallback on fetch functions prevents child useEffects from re-running
// when the parent re-renders for unrelated reasons.
function CompetitionPage() {
  const { gymId, compId } = useParams();
  const decoded = getDecodedToken();
  const currentUserId = decoded?.user_id;
  const isSetterUser = isSetter();

  const [comp, setComp] = useState(null);
  const [compClimbs, setCompClimbs] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [mySends, setMySends] = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);

  const fetchComp = useCallback(async () => {
    try {
      const res = await api.get(`/api/competitions/${compId}/`);
      setComp(res.data);
    } catch { setError("Failed to load competition."); }
  }, [compId]);

  const fetchClimbs = useCallback(async () => {
    // Fetches comp climbs and the current user's sends together — they're
    // always needed at the same time and kept in sync by using this as one callback.
    const [climbsRes, sendsRes] = await Promise.all([
      api.get(`/api/competitions/${compId}/climbs/`),
      api.get(`/api/competitions/${compId}/sends/`),
    ]);
    setCompClimbs(climbsRes.data);
    setMySends(sendsRes.data);
  }, [compId]);

  const fetchRegistrations = useCallback(async () => {
    const res = await api.get(`/api/competitions/${compId}/registrations/`);
    setRegistrations(res.data);
  }, [compId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchComp(), fetchClimbs(), fetchRegistrations()]);
      } catch { setError("Failed to load competition."); }
      finally { setLoading(false); }
    };
    init();
  }, [compId]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await api.post(`/api/competitions/${compId}/register/`, {});
      // Refetch both comp (updates is_registered + registration_count) and
      // registrations list so the judging panel shows the new registrant.
      await fetchComp();
      await fetchRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error || !comp)
    return (
      <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-red-600 italic text-sm mb-4">{error || "Competition not found."}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm">Retry</button>
        </div>
      </div>
    );

  const isQualifier = comp.comp_type === "qualifier";
  const tabs = [
    { key: "info", label: "Info" },
    { key: "climbs", label: `Climbs (${compClimbs.length})` },
    // Label changes between qualifier and finals: qualifier shows rankings
    // during the event; finals shows judged IFSC results.
    { key: "leaderboard", label: isQualifier ? "Leaderboard" : "Results" },
  ];

  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      <Navbar showBack backLabel="Competitions" backPath={`/gym/${gymId}/competitions`} />
      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="mb-6">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full italic font-bold
              ${comp.comp_type === "qualifier" ? "bg-amber-100 text-amber-800" : "bg-orange-100 text-orange-800"}`}>
              {comp.comp_type === "qualifier" ? "Qualifier" : "Finals"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full italic font-bold ${STATUS_STYLE[comp.status]}`}>
              {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
            </span>
          </div>
          <h1 className="text-3xl font-bold italic text-amber-900 leading-tight mb-1">{comp.title}</h1>
          <p className="text-xs italic text-amber-500">{fmtDate(comp.start_date)} → {fmtDate(comp.end_date)}</p>
        </div>

        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "info" && (
          <InfoTab comp={comp} isRegistered={comp.is_registered}
            onRegister={handleRegister} registering={registering} />
        )}
        {activeTab === "climbs" && (
          <ClimbsTab comp={comp} compClimbs={compClimbs} mySends={mySends}
            gymId={gymId} canEdit={isSetterUser}
            onSendLogged={fetchClimbs}
            onClimbRemoved={fetchClimbs} />
        )}
        {activeTab === "leaderboard" && isQualifier && (
          <QualifierLeaderboard compId={compId} currentUserId={currentUserId} />
        )}
        {activeTab === "leaderboard" && !isQualifier && (
          <FinalsTab comp={comp} compClimbs={compClimbs} registrations={registrations}
            isSetterUser={isSetterUser} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}

export default CompetitionPage;
