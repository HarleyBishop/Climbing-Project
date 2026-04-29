import { useState, useEffect } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const COLOUR_MAP = {
    "Green":  "#4a8c5c",
    "Orange": "#c4622d",
    "Blue":   "#3a6fa8",
    "Pink":   "#a0416e",
    "Yellow": "#c9a020",
    "Black":  "#555050",
    "White":  "#f5f5f0",
}

function ClimbPage() {
  const [climb, setClimb] = useState();
  const [gradeVote, setGradeVote] = useState([]);
  const [sends, setSends] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reviews, setReviews] = useState([]);

  const { gymId, wallId, climbId } = useParams();
  const navigate = useNavigate();

  const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const token = localStorage.getItem("access");
  const currentUserId = jwtDecode(token).user_id;
  const myVote = gradeVote.find((vote) => vote.user === currentUserId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [climbRes, gradeVoteres, reviewres, videosres, sendsres] =
          await Promise.all([
            api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/`),
            api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`),
            api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`),
            api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`),
            api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`),
          ]);
        setClimb(climbRes.data);
        setGradeVote(gradeVoteres.data);
        setReviews(reviewres.data);
        setVideos(videosres.data);
        setSends(sendsres.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [gymId, wallId, climbId]);

  const handleVote = async (grade) => {
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`, { grade });
      const res = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`);
      setGradeVote(res.data);
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  if (!climb) return (
    <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center text-amber-800 italic">
      Loading...
    </div>
  );

  const colour = COLOUR_MAP[climb.colour] || "#c9a98a"

  return (
    <div className="min-h-screen bg-orange-50 font-serif">

      {/* navbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200">
        <div
          onClick={() => navigate(`/gym/${gymId}`)}
          className="text-amber-700 italic text-sm cursor-pointer"
        >
          ‹ Slab wall
        </div>
        <div className="w-9 h-9 rounded-full bg-stone-300 flex items-center justify-center text-sm font-bold text-stone-600">
          JS
        </div>
      </div>

      {/* colour hero */}
      <div
        className="w-full h-44 flex items-end p-4 gap-2"
        style={{ background: colour }}
      >
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">{climb.colour}</span>
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">
          {new Date(climb.set_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">{climb.wall_name}</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">

        {/* climb title */}
        <h1 className="text-3xl font-bold italic text-amber-900 mb-1">{climb.name}</h1>
        <p className="text-sm italic text-amber-600 mb-6">
          Set by @{climb.added_by}
        </p>

        {/* stat chips */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Setter grade", value: `V${climb.suggested_grade}` },
            { label: "Community",    value: climb.community_grade ? `V${climb.community_grade}` : "—" },
            { label: "Sends",        value: sends.length },
            { label: "Reviews",      value: reviews.length },
          ].map((stat) => (
            <div key={stat.label} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold italic text-amber-900">{stat.value}</p>
              <p className="text-xs italic text-amber-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* log send strip */}
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm italic text-amber-800">Logged your send yet?</p>
          <button className="text-xs italic px-4 py-2 rounded-full bg-amber-900 text-amber-50">
            Log send
          </button>
        </div>

        <div className="h-px bg-amber-200 mb-6" />

        {/* grade vote */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">VOTE ON GRADE</p>
        <div className="flex gap-2 flex-wrap mb-8">
          {GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => handleVote(grade)}
              className={`px-3 py-1 rounded-full text-sm italic border transition-colors
                ${myVote?.grade === grade
                  ? "bg-amber-900 text-amber-50 border-amber-900"
                  : "border-amber-300 text-amber-800 hover:border-amber-500"}`}
            >
              V{grade}
            </button>
          ))}
        </div>

        <div className="h-px bg-amber-200 mb-6" />

        {/* videos */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
          VIDEOS ({videos.length})
        </p>
        <div className="flex gap-3 flex-wrap mb-8">
          {videos.map((video) => (
            <video
              key={video.id}
              width="200"
              height="150"
              controls
              className="rounded-lg border border-amber-200"
            >
              <source src={video.video_url} type="video/mp4" />
            </video>
          ))}
          {videos.length === 0 && (
            <p className="text-sm italic text-amber-500">No videos yet.</p>
          )}
        </div>

        <div className="h-px bg-amber-200 mb-6" />

        {/* reviews */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
          REVIEWS ({reviews.length})
        </p>
        <div className="flex flex-col gap-4 mb-8">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-amber-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-900">
                    {review.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold italic text-amber-900">
                    @{review.username}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= review.stars ? "text-amber-600" : "text-amber-200"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm italic text-amber-800 mb-1">"{review.comment}"</p>
              <p className="text-xs italic text-amber-500">{review.attempts} attempts</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm italic text-amber-500">No reviews yet.</p>
          )}
        </div>

        {/* action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="py-3 rounded-xl border border-amber-300 text-amber-700 italic text-sm">
            + Write review
          </button>
          <button className="py-3 rounded-xl bg-amber-900 text-amber-50 italic text-sm">
            Upload video
          </button>
        </div>

      </div>
    </div>
  );
}

export default ClimbPage;