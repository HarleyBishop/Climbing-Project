import { useState, useEffect } from "react";
import api from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "../components/Navbar";

const COLOUR_MAP = {
  Green: "#4a8c5c",
  Orange: "#c4622d",
  Blue: "#3a6fa8",
  Pink: "#a0416e",
  Yellow: "#c9a020",
  Black: "#555050",
  White: "#f5f5f0",
};

function ClimbPage() {
  const [climb, setClimb] = useState();
  const [gradeVote, setGradeVote] = useState([]);
  const [sends, setSends] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal visibility
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // action-level errors shown inside modals
  const [sendError, setSendError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [voteError, setVoteError] = useState(null);

  // send form state
  const [attempts, setAttempts] = useState("");

  // review form state
  const [comment, setComment] = useState("");
  const [stars, setStars] = useState(0);
  const [reviewAttempts, setReviewAttempts] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const { gymId, wallId, climbId } = useParams();
  const navigate = useNavigate();

  const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const token = localStorage.getItem("access");
  const currentUserId = jwtDecode(token).user_id;
  const myVote = gradeVote.find((vote) => vote.user === currentUserId);
  const mySend = sends.find((send) => send.user === currentUserId);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [climbRes, gradeVoteres, reviewres, videosres, sendsres] =
          await Promise.all([
            api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/`),
            api.get(
              `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`,
            ),
            api.get(
              `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`,
            ),
            api.get(
              `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`,
            ),
            api.get(
              `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`,
            ),
          ]);
        setClimb(climbRes.data);
        setGradeVote(gradeVoteres.data);
        setReviews(reviewres.data);
        setVideos(videosres.data);
        setSends(sendsres.data);
      } catch (err) {
        setError("Failed to load climb. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gymId, wallId, climbId]);

  const handleVote = async (grade) => {
    setVoteError(null);
    try {
      await api.post(
        `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`,
        { grade },
      );
      const res = await api.get(
        `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`,
      );
      setGradeVote(res.data);
    } catch (err) {
      setVoteError("Couldn't save your vote. Please try again.");
    }
  };

  const handleLogSend = async () => {
    setSendError(null);
    if (!attempts || parseInt(attempts) < 1) {
      setSendError("Please enter a valid number of attempts.");
      return;
    }
    try {
      await api.post(
        `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`,
        {
          attempts: parseInt(attempts),
        },
      );
      const res = await api.get(
        `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`,
      );
      setSends(res.data);
      setAttempts("");
      setShowSendModal(false);
    } catch (err) {
      setSendError("Couldn't log your send. Please try again.");
    }
  };

  const handleReview = async () => {
    setReviewError(null);
    if (!comment.trim()) {
      setReviewError("Please write a comment.");
      return;
    }
    if (stars === 0) {
      setReviewError("Please select a star rating.");
      return;
    }
    if (!reviewAttempts || parseInt(reviewAttempts) < 1) {
      setReviewError("Please enter a valid number of attempts.");
      return;
    }
    try {
      await api.post(
        `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`,
        {
          comment,
          stars,
          attempts: parseInt(reviewAttempts),
        },
      );

      if (videoUrl) {
        await api.post(
          `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`,
          {
            video_url: videoUrl,
          },
        );
        const vidRes = await api.get(
          `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`,
        );
        setVideos(vidRes.data);
      }

      const revRes = await api.get(
        `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`,
      );
      setReviews(revRes.data);
      setComment("");
      setStars(0);
      setReviewAttempts("");
      setVideoUrl("");
      setShowReviewModal(false);
    } catch (err) {
      setReviewError("Couldn't submit your review. Please try again.");
    }
  };

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
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const colour = COLOUR_MAP[climb.colour] || "#c9a98a";

  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      <Navbar
        showBack
        backLabel={climb?.wall_name || "Back"}
        backPath={`/gym/${gymId}`}
      />

      {/* colour hero */}
      <div
        className="w-full h-44 flex items-end p-4 gap-2"
        style={{ background: colour }}
      >
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">
          {climb.colour}
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">
          {new Date(climb.set_at).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">
          {climb.wall_name}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <h1 className="text-3xl font-bold italic text-amber-900 mb-1">
          {climb.name}
        </h1>
        <p className="text-sm italic text-amber-600 mb-6">
          Set by @{climb.added_by}
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Setter grade", value: `V${climb.suggested_grade}` },
            {
              label: "Community",
              value: climb.community_grade ? `V${climb.community_grade}` : "—",
            },
            { label: "Sends", value: sends.length },
            { label: "Reviews", value: reviews.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"
            >
              <p className="text-lg font-bold italic text-amber-900">
                {stat.value}
              </p>
              <p className="text-xs italic text-amber-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* send strip */}
        {mySend ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm italic text-green-800">
              You sent this!{" "}
              <span className="font-bold">{mySend.attempts} attempts</span>
            </p>
            <button
              onClick={() => setShowSendModal(true)}
              className="text-xs italic px-4 py-2 rounded-full border border-green-400 text-green-700"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm italic text-amber-800">
              Logged your send yet?
            </p>
            <button
              onClick={() => setShowSendModal(true)}
              className="text-xs italic px-4 py-2 rounded-full bg-amber-900 text-amber-50"
            >
              Log send
            </button>
          </div>
        )}

        <div className="h-px bg-amber-200 mb-6" />

        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
          VOTE ON GRADE
        </p>
        {voteError && (
          <p className="text-red-600 italic text-xs mb-2">{voteError}</p>
        )}
        <div className="flex gap-2 flex-wrap mb-8">
          {GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => handleVote(grade)}
              className={`px-3 py-1 rounded-full text-sm italic border transition-colors
                ${
                  myVote?.grade === grade
                    ? "bg-amber-900 text-amber-50 border-amber-900"
                    : "border-amber-300 text-amber-800 hover:border-amber-500"
                }`}
            >
              V{grade}
            </button>
          ))}
        </div>

        <div className="h-px bg-amber-200 mb-6" />

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
                      className={
                        star <= review.stars
                          ? "text-amber-600"
                          : "text-amber-200"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm italic text-amber-800 mb-1">
                "{review.comment}"
              </p>
              <p className="text-xs italic text-amber-500">
                {review.attempts} attempts
              </p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm italic text-amber-500">No reviews yet.</p>
          )}
        </div>

        <button
          onClick={() => setShowReviewModal(true)}
          className="w-full py-3 rounded-xl border border-amber-300 text-amber-700 italic text-sm"
        >
          + Write review
        </button>
      </div>

      {/* send modal */}
      {showSendModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowSendModal(false);
            setSendError(null);
          }}
        >
          <div
            className="bg-amber-50 rounded-xl border border-amber-200 p-6 w-80 font-serif"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold italic text-amber-900 mb-1">
              Log your send
            </h2>
            <p className="text-xs italic text-amber-600 mb-4">
              How many attempts did it take?
            </p>
            {sendError && (
              <p className="text-red-600 italic text-xs mb-3">{sendError}</p>
            )}
            <label className="text-xs italic text-amber-800 block mb-1">
              Attempts
            </label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={attempts}
              onChange={(e) => setAttempts(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleLogSend}
                className="flex-1 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm"
              >
                Log send
              </button>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSendError(null);
                }}
                className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-700 italic text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* review modal */}
      {showReviewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowReviewModal(false);
            setReviewError(null);
          }}
        >
          <div
            className="bg-amber-50 rounded-xl border border-amber-200 p-6 w-80 font-serif"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold italic text-amber-900 mb-1">
              Write a review
            </h2>
            <p className="text-xs italic text-amber-600 mb-4">
              Share your thoughts on this climb
            </p>
            {reviewError && (
              <p className="text-red-600 italic text-xs mb-3">{reviewError}</p>
            )}

            <label className="text-xs italic text-amber-800 block mb-1">
              Comment
            </label>
            <textarea
              placeholder="What did you think?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-3 h-20 resize-none"
            />

            <label className="text-xs italic text-amber-800 block mb-2">
              Stars
            </label>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setStars(star)}
                  className={`text-2xl cursor-pointer ${star <= stars ? "text-amber-600" : "text-amber-200"}`}
                >
                  ★
                </span>
              ))}
            </div>

            <label className="text-xs italic text-amber-800 block mb-1">
              Attempts
            </label>
            <input
              type="number"
              placeholder="e.g. 3"
              value={reviewAttempts}
              onChange={(e) => setReviewAttempts(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-3"
            />

            <label className="text-xs italic text-amber-800 block mb-1">
              Video URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={handleReview}
                className="flex-1 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewError(null);
                }}
                className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-700 italic text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClimbPage;
