import { useState, useEffect } from "react";
import api from "../api";
import { useParams } from "react-router-dom";

function ClimbPage() {
  const [climb, setClimb] = useState(); // Climb Data
  const [gradeVote, setGradeVote] = useState([]); // holds gradevote object which should be an accumulkative value of votes on the gfrade
  const [sends, setSends] = useState(); // holds the accumulative number of sends on the climb
  const [videos, setVideos] = useState([]); // holds an array of the videos ONLY URLS RIGHT NOW NO FILE UPLOAD
  const [reviews, setReviews] = useState([]); // Holdss and array of reviews on the climb

  const { gymId, wallId, climbId } = useParams();

  // collect all data from api for page
  useEffect(() => {
    const fetchData = async () => {
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
        console.log(err);
      }
    };
    fetchData();
  }, [gymId, wallId, climbId]);

  if (!climb) return <div>Loading...</div>

  return (
    <div>

      <h1>{climb.suggested_grade}</h1>


      <h1>{gradeVote.grade}</h1>

      

      <h1>{sends.length}</h1>

      <h1>{climb.community_grade}</h1>
    </div>
  );
}

export default ClimbPage;
