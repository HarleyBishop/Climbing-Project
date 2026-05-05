import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import Navbar from "../components/Navbar";


const COLOUR_MAP = {
    "Green":  "#4a8c5c",
    "Orange": "#c4622d",
    "Blue":   "#3a6fa8",
    "Pink":   "#a0416e",
    "Yellow": "#c9a020",
    "Black":  "#555050",
    "White":  "#f5f5f0",
}

function Profile() {
    const { userId } = useParams()
    const navigate = useNavigate()

    const token = localStorage.getItem("access")
    const currentUserId = jwtDecode(token).user_id

    // if no userId in URL default to logged in user
    const profileId = userId || currentUserId

    const [profile, setProfile] = useState(null)
    const [sends, setSends] = useState([])
    const [reviews, setReviews] = useState([])
    const [videos, setVideos] = useState([])

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const [profileRes, sendsRes, reviewsRes, videosRes] = await Promise.all([
                    api.get(`/api/users/${profileId}/`),
                    api.get(`/api/users/${profileId}/sends/`),
                    api.get(`/api/users/${profileId}/reviews/`),
                    api.get(`/api/users/${profileId}/videos/`),
                ])
                setProfile(profileRes.data)
                setSends(sendsRes.data)
                setReviews(reviewsRes.data)
                setVideos(videosRes.data)
            } catch (err) {
                console.log(err)
            }
        }
        fetchProfile()
    }, [profileId])

    const avgGrade = sends.length
        ? Math.round(sends.reduce((sum, s) => sum + s.climb_grade, 0) / sends.length)
        : null

    const homeGym = sends.length
        ? Object.entries(
            sends.reduce((acc, s) => {
                acc[s.gym_name] = (acc[s.gym_name] || 0) + 1
                return acc
            }, {})
          ).sort((a, b) => b[1] - a[1])[0]?.[0]
        : null

    if (!profile) return (
        <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center text-amber-800 italic">
            Loading...
        </div>
    )

    const initials = profile.username?.slice(0, 2).toUpperCase()
    const isOwnProfile = parseInt(profileId) === currentUserId

    return (
        <div className="min-h-screen bg-orange-50 font-serif">

            <Navbar showBack backLabel="Back" />

            <div className="max-w-2xl mx-auto px-6 py-8">

                {/* back */}
                <div
                    onClick={() => navigate(-1)}
                    className="text-amber-700 italic text-sm mb-6 cursor-pointer"
                >
                    ‹ Back
                </div>

                {/* profile header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-2xl font-bold text-amber-900 flex-shrink-0">
                        {initials}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold italic text-amber-900">@{profile.username}</h1>
                        <p className="text-xs italic text-amber-600 mt-1">
                            Member since {new Date(profile.date_joined).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
                        </p>
                        {isOwnProfile && (
                            <span className="text-xs italic px-2 py-1 rounded-full bg-amber-100 text-amber-700 mt-1 inline-block">
                                Your profile
                            </span>
                        )}
                    </div>
                </div>

                {/* home gym */}
                {homeGym && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                        <div className="w-3 h-3 rounded-full bg-emerald-600 flex-shrink-0" />
                        <div>
                            <p className="text-xs italic text-amber-500 uppercase tracking-widest">Home gym</p>
                            <p className="text-sm font-bold italic text-amber-900">{homeGym}</p>
                        </div>
                    </div>
                )}

                {/* stats */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    {[
                        { label: "Sends",    value: sends.length },
                        { label: "Reviews",  value: reviews.length },
                        { label: "Videos",   value: videos.length },
                        { label: "Avg grade", value: avgGrade !== null ? `V${avgGrade}` : "—" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold italic text-amber-900">{stat.value}</p>
                            <p className="text-xs italic text-amber-500 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="h-px bg-amber-200 mb-6" />

                {/* sends */}
                <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
                    SENDS ({sends.length})
                </p>
                <div className="flex flex-col gap-3 mb-8">
                    {sends.map(send => (
                        <div
                            key={send.id}
                            onClick={() => navigate(`/gym/${send.gym_id}/wall/${send.wall_id}/climb/${send.climb_id}`)}
                            className="flex overflow-hidden rounded-xl border border-amber-200 bg-amber-50 cursor-pointer hover:border-amber-400 transition-colors"
                        >
                            <div
                                className="w-2 flex-shrink-0"
                                style={{ background: COLOUR_MAP[send.climb_colour] || "#c9a98a" }}
                            />
                            <div className="flex-1 px-4 py-3">
                                <p className="font-bold italic text-amber-900 text-sm">{send.climb_name}</p>
                                <p className="text-xs italic text-amber-600 mt-1">{send.wall_name} · {send.gym_name}</p>
                            </div>
                            <div className="flex flex-col items-end justify-center px-4 py-3 gap-1">
                                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-amber-800 italic">
                                    V{send.climb_grade}
                                </span>
                                <span className="text-xs italic text-amber-500">
                                    {send.attempts} {send.attempts === 1 ? "attempt" : "attempts"}
                                </span>
                            </div>
                        </div>
                    ))}
                    {sends.length === 0 && (
                        <p className="text-sm italic text-amber-500">No sends logged yet.</p>
                    )}
                </div>

                <div className="h-px bg-amber-200 mb-6" />

                {/* reviews */}
                <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
                    REVIEWS ({reviews.length})
                </p>
                <div className="flex flex-col gap-3 mb-8">
                    {reviews.map(review => (
                        <div
                            key={review.id}
                            onClick={() => navigate(`/gym/${review.gym_id}/wall/${review.wall_id}/climb/${review.climb_id}`)}
                            className="bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer hover:border-amber-400 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-bold italic text-amber-900 text-sm">{review.climb_name}</p>
                                <div className="flex gap-1">
                                    {[1,2,3,4,5].map(star => (
                                        <span
                                            key={star}
                                            className={star <= review.stars ? "text-amber-600" : "text-amber-200"}
                                        >★</span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs italic text-amber-800 mb-2">"{review.comment}"</p>
                            <p className="text-xs italic text-amber-500">{review.wall_name} · {review.gym_name}</p>
                        </div>
                    ))}
                    {reviews.length === 0 && (
                        <p className="text-sm italic text-amber-500">No reviews yet.</p>
                    )}
                </div>

                <div className="h-px bg-amber-200 mb-6" />

                {/* videos */}
                <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
                    VIDEOS ({videos.length})
                </p>
                <div className="flex gap-3 flex-wrap mb-8">
                    {videos.map(video => (
                        <video
                            key={video.id}
                            width="180"
                            height="120"
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

            </div>
        </div>
    )
}

export default Profile