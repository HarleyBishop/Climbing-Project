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

  // State for each api call object
  const [climb, setClimb] = useState();
  const [gradeVote, setGradeVote] = useState([]);
  const [sends, setSends] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reviews, setReviews] = useState([]);

  // modal visibility
  const [showSendModal, setShowSendModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  // send form state
  const [attempts, setAttempts] = useState("")

  // review form state used mostly for models
  const [comment, setComment] = useState("")
  const [stars, setStars] = useState(0)
  const [reviewAttempts, setReviewAttempts] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  //all ids from url
  const { gymId, wallId, climbId } = useParams();
  const navigate = useNavigate();

  // array for grade scale 
  const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Decode the current users token for user info and find if they have already set a send or grade vote
  const token = localStorage.getItem("access");
  const currentUserId = jwtDecode(token).user_id;
  const myVote = gradeVote.find((vote) => vote.user === currentUserId);
  const mySend = sends.find((send) => send.user === currentUserId);

  // When page first renders or different climb/gym/wall is picked re render and update all data 
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

  // On vote post the grade voted on then refresh the votes data for accurate reral time grade
  const handleVote = async (grade) => {
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`, { grade });
      const res = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`);
      setGradeVote(res.data);
    } catch (err) {
      console.log(err.response?.data);
    }
  };

  // Send a post request for send and attempts number then update the data again
  const handleLogSend = async () => {
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`, {
        attempts: parseInt(attempts),
      })
      const res = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`)
      setSends(res.data)
      setAttempts("")
      // Closde the modal after uploading
      setShowSendModal(false)
    } catch (err) {
      console.log(err.response?.data)
    }
  }

  // Handle posting a review and optionally a video
  const handleReview = async () => {
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`, {
        comment,
        stars,
        attempts: parseInt(reviewAttempts),
      })

      if (videoUrl) {
        await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`, {
          video_url: videoUrl,
        })
        const vidRes = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`)
        setVideos(vidRes.data)
      }

      // Update the review data and set state back to defaults so new review can be made
      const revRes = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`)
      setReviews(revRes.data)
      setComment("")
      setStars(0)
      setReviewAttempts("")
      setVideoUrl("")
      setShowReviewModal(false)
    } catch (err) {
      console.log(err.response?.data)
    }
  }

  // Load until data is recieved
  if (!climb) return (
    <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center text-amber-800 italic">
      Loading...
    </div>
  );

// Map the climbs colour to a colour in the array
  const colour = COLOUR_MAP[climb.colour] || "#c9a98a"


  return (
    <div className="min-h-screen bg-orange-50 font-serif">

      {/* navbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200">
        <div onClick={() => navigate(`/gym/${gymId}`)} className="text-amber-700 italic text-sm cursor-pointer">
          ‹ Slab wall
        </div>
        <div className="w-9 h-9 rounded-full bg-stone-300 flex items-center justify-center text-sm font-bold text-stone-600">
          JS
        </div>
      </div>

      {/* colour hero */}
      <div className="w-full h-44 flex items-end p-4 gap-2" style={{ background: colour }}>
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">{climb.colour}</span>
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">
          {new Date(climb.set_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-black/30 text-white italic">{climb.wall_name}</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">

        <h1 className="text-3xl font-bold italic text-amber-900 mb-1">{climb.name}</h1>
        <p className="text-sm italic text-amber-600 mb-6">Set by @{climb.added_by}</p>

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

        {/* send strip — shows logged state if user has already sent */}
        {mySend ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm italic text-green-800">
              You sent this! <span className="font-bold">{mySend.attempts} attempts</span>
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
            <p className="text-sm italic text-amber-800">Logged your send yet?</p>
            <button
              onClick={() => setShowSendModal(true)}
              className="text-xs italic px-4 py-2 rounded-full bg-amber-900 text-amber-50"
            >
              Log send
            </button>
          </div>
        )}

        <div className="h-px bg-amber-200 mb-6" />

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

        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">VIDEOS ({videos.length})</p>
        <div className="flex gap-3 flex-wrap mb-8">
          {videos.map((video) => (
            <video key={video.id} width="200" height="150" controls className="rounded-lg border border-amber-200">
              <source src={video.video_url} type="video/mp4" />
            </video>
          ))}
          {videos.length === 0 && <p className="text-sm italic text-amber-500">No videos yet.</p>}
        </div>

        <div className="h-px bg-amber-200 mb-6" />

        <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">REVIEWS ({reviews.length})</p>
        <div className="flex flex-col gap-4 mb-8">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-amber-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-900">
                    {review.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold italic text-amber-900">@{review.username}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.stars ? "text-amber-600" : "text-amber-200"}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-sm italic text-amber-800 mb-1">"{review.comment}"</p>
              <p className="text-xs italic text-amber-500">{review.attempts} attempts</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm italic text-amber-500">No reviews yet.</p>}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setShowReviewModal(true)}
            className="py-3 rounded-xl border border-amber-300 text-amber-700 italic text-sm"
          >
            + Write review
          </button>
        </div>
      </div>

      {/* send modal */}
      {showSendModal && (
        <div
        /* fixed inset covers the entire screen and z-50 puts the modal above the rest of the screen */
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSendModal(false)}
        >
          <div
            className="bg-amber-50 rounded-xl border border-amber-200 p-6 w-80 font-serif"
            /* Stop Propogation stops clicks inside the modal from interacting with the overlay and closing the modal when clicking inside it */
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold italic text-amber-900 mb-1">Log your send</h2>
            <p className="text-xs italic text-amber-600 mb-4">How many attempts did it take?</p>
            <label className="text-xs italic text-amber-800 block mb-1">Attempts</label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={attempts}
              onChange={(e) => setAttempts(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleLogSend} className="flex-1 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm">
                Log send
              </button>
              <button onClick={() => setShowSendModal(false)} className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-700 italic text-sm">
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
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="bg-amber-50 rounded-xl border border-amber-200 p-6 w-80 font-serif"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold italic text-amber-900 mb-1">Write a review</h2>
            <p className="text-xs italic text-amber-600 mb-4">Share your thoughts on this climb</p>

            <label className="text-xs italic text-amber-800 block mb-1">Comment</label>
            <textarea
              placeholder="What did you think?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-3 h-20 resize-none"
            />

            <label className="text-xs italic text-amber-800 block mb-2">Stars</label>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setStars(star)}
                  className={`text-2xl cursor-pointer ${star <= stars ? "text-amber-600" : "text-amber-200"}`}
                >★</span>
              ))}
            </div>

            <label className="text-xs italic text-amber-800 block mb-1">Attempts</label>
            <input
              type="number"
              placeholder="e.g. 3"
              value={reviewAttempts}
              onChange={(e) => setReviewAttempts(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-3"
            />

            <label className="text-xs italic text-amber-800 block mb-1">Video URL (optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 font-serif mb-4"
            />

            <div className="flex gap-3">
              <button onClick={handleReview} className="flex-1 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm">
                Submit
              </button>
              <button onClick={() => setShowReviewModal(false)} className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-700 italic text-sm">
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