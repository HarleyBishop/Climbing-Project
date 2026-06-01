import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useEffect, useState } from "react";

// Guards any route that requires authentication. On mount it checks whether
// the stored access token is still valid. If it's expired it tries to silently
// refresh using the refresh token. Only if both fail does it redirect to /login.
// isAuthorized=null is the "not yet checked" state — renders a loading screen
// so child components never briefly render before the auth check finishes.
function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    auth().catch(() => setIsAuthorized(false))
  }, [])

  const refresh_token = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
      const res = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });
      if (res.status === 200) {
        // Store the new access token — subsequent requests from api.js will
        // pick it up via the request interceptor.
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      setIsAuthorized(false);
    }
  };

  const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    // jwt-decode reads the exp claim without verifying the signature.
    // We compare against Date.now() / 1000 because JWT exp is in seconds,
    // not milliseconds.
    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if (tokenExpiration < now) {
      // Token expired — attempt a silent refresh rather than forcing re-login.
      await refresh_token();
    } else {
      setIsAuthorized(true);
    }
  };

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
