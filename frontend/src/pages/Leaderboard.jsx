import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import Navbar from "../components/Navbar";
import { getRank, RankBadge, RANKS, MAGNUS_RANK } from "../utils/rankUtils";
import { PageSkeleton } from "../components/Skeleton";

const GRADE_POINTS = [
  { label: "V0 – V2", min: 0, max: 2, points: 10 },
  { label: "V3 – V4", min: 3, max: 4, points: 20 },
  { label: "V5 – V6", min: 5, max: 6, points: 40 },
  { label: "V7 – V8", min: 7, max: 8, points: 70 },
  { label: "V9 – V10", min: 9, max: 10, points: 100 },
  { label: "V11 – V12+", min: 11, max: 99, points: 150 },
];

function Leaderboard() {
  const { gymId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("access");
  const currentUserId = jwtDecode(token).user_id;

  const [gym, setGym] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gymRes, rankRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/`),
          api.get(`/api/gyms/${gymId}/leaderboard/`),
        ]);
        setGym(gymRes.data);
        setRankings(rankRes.data);
      } catch (err) {
        setError("Failed to load leaderboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gymId]);

  if (loading) return <PageSkeleton />;

  if (error)
    return (
      <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-red-600 italic text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const myRank = rankings.find((r) => r.user_id === currentUserId);
  const maxPoints = rankings[0]?.points || 1;
  const totalPlayers = rankings.length;

  const rankColour = (rank) => {
    if (rank === 1) return "text-amber-600";
    if (rank === 2) return "text-stone-500";
    if (rank === 3) return "text-amber-800";
    return "text-amber-400";
  };

  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      <Navbar
        showBack
        backLabel={gym?.name || "Back"}
        backPath={`/gym/${gymId}`}
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold italic text-amber-900 mb-1">
          Leaderboard
        </h1>
        <p className="text-sm italic text-amber-600 mb-6">
          Points based on current active climbs only — resets when the gym
          resets.
        </p>

        {/* gym strip */}
        {gym && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold italic text-amber-900">
                {gym.name}
              </p>
              <p className="text-xs italic text-amber-500">
                {gym.climb_count} active climbs
              </p>
            </div>
          </div>
        )}

        {/* your ranking */}
        {myRank && (
          <>
            <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
              YOUR RANKING
            </p>
            <div className="flex items-center gap-4 bg-amber-50 border-2 border-amber-900 rounded-xl px-4 py-4 mb-6">
              <span
                className={`text-2xl font-bold italic ${rankColour(myRank.rank)} min-w-9 text-center`}
              >
                #{myRank.rank}
              </span>
              <div className="flex-1">
                <p className="font-bold italic text-amber-900">
                  @{myRank.username}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs italic px-2 py-0.5 rounded-full bg-orange-100 text-amber-800">
                    You
                  </span>
                  <RankBadge
                    rank={getRank(myRank.points, myRank.rank)}
                    iconSize={16}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold italic text-amber-900">
                  {myRank.points} pts
                </p>
                <p className="text-xs italic text-amber-500">
                  {myRank.send_count} sends
                </p>
              </div>
            </div>
          </>
        )}

        {/* top climbers */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
          TOP CLIMBERS
        </p>
        <div className="flex flex-col gap-2 mb-8">
          {rankings.map((entry) => {
            const isMe = entry.user_id === currentUserId;
            const barWidth = Math.round((entry.points / maxPoints) * 100);
            const rank = getRank(entry.points, entry.rank);

            return (
              <div
                key={entry.user_id}
                onClick={() => navigate(`/profile/${entry.user_id}`)}
                className={`flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3 cursor-pointer hover:border-amber-400 transition-colors
                                    ${
                                      isMe
                                        ? "border-2 border-amber-900"
                                        : "border border-amber-200"
                                    }`}
              >
                <span
                  className={`text-lg font-bold italic min-w-7 text-center ${rankColour(entry.rank)}`}
                >
                  {entry.rank}
                </span>

                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-900 shrink-0">
                  {entry.username?.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold italic text-amber-900 text-sm truncate">
                      @{entry.username}
                    </p>
                    {isMe && (
                      <span className="text-xs italic px-2 py-0.5 rounded-full bg-orange-100 text-amber-800 shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-900 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <RankBadge rank={rank} iconSize={14} />
                  <p className="text-sm font-bold italic text-amber-900">
                    {entry.points} pts
                  </p>
                  <p className="text-xs italic text-amber-500">
                    {entry.send_count} sends
                  </p>
                </div>
              </div>
            );
          })}

          {rankings.length === 0 && (
            <p className="text-sm italic text-amber-500 py-4">
              No sends logged yet — be the first!
            </p>
          )}
        </div>

        <div className="h-px bg-amber-200 mb-6" />

        {/* rank tiers */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
          RANK TIERS
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden mb-6">
          <div className="bg-orange-100 px-4 py-2 flex justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Rank</span>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Points required</span>
          </div>
          {RANKS.map((r, i) => (
            <div key={r.name} className="flex items-center gap-3 px-4 py-2 border-t border-amber-200">
              <RankBadge rank={r} iconSize={16} />
              <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((r.min / 4500) * 100)}%`,
                    backgroundColor: r.color,
                    minWidth: i === 0 ? '4px' : undefined,
                  }}
                />
              </div>
              <span className="text-xs italic text-amber-700 w-20 text-right shrink-0">
                {r.min === 0 ? '0 pts' : `${r.min.toLocaleString()}+ pts`}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-amber-200">
            <RankBadge rank={MAGNUS_RANK} iconSize={16} />
            <p className="flex-1 text-xs italic text-amber-600">Top 20 climbers at this gym</p>
          </div>
        </div>

        <div className="h-px bg-amber-200 mb-6" />

        {/* points scale */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
          POINTS PER GRADE
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
          <div className="bg-orange-100 px-4 py-2 flex justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Grade
            </span>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Points per send
            </span>
          </div>
          {GRADE_POINTS.map((tier, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-t border-amber-200"
            >
              <span className="text-sm italic text-amber-900 w-24 shrink-0">
                {tier.label}
              </span>
              <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-900 rounded-full"
                  style={{ width: `${Math.round((tier.points / 150) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold italic text-amber-900 w-16 text-right shrink-0">
                {tier.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
