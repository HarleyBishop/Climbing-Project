import react from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateGym from "./pages/CreateGym";
import GymPage from "./pages/GymPage";
import AddClimb from "./pages/AddClimb";
import ClimbPage from "./pages/ClimbPage";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import ArchivedClimbs from "./pages/ArchivedClimbs";
import CompetitionList from "./pages/CompetitionList";
import CompetitionPage from "./pages/CompetitionPage";
import CreateCompetition from "./pages/CreateCompetition";
import Feed from "./pages/Feed";
import { isSetter } from "./auth";

// Inline route guard for setter-only pages. Reads the JWT claim rather than
// making an API call, so it's synchronous — no loading state needed.
// Redirects to "/" rather than "/login" because the user is already
// authenticated; they just lack the setter role.
function SetterRoute({ children }) {
  return isSetter() ? children : <Navigate to="/" />;
}

// Clears localStorage before rendering the Register page so any existing
// tokens from a previous session don't interfere with the new registration.
function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Every meaningful page is wrapped in ProtectedRoute which checks
            JWT validity and redirects to /login if the token is missing or
            expired. Public pages (login, register) are left unwrapped. */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />

        {/* Setter-only pages are double-wrapped: ProtectedRoute first (must
            be logged in), then SetterRoute (must have setter role). */}
        <Route
          path="/create-gym"
          element={
            <ProtectedRoute>
              <SetterRoute>
                <CreateGym />
              </SetterRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym/:id"
          element={
            <ProtectedRoute>
              <GymPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym/:gymId/wall/:wallId/add-climb"
          element={
            <ProtectedRoute>
              <SetterRoute>
                <AddClimb />
              </SetterRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym/:gymId/wall/:wallId/climb/:climbId"
          element={
            <ProtectedRoute>
              <ClimbPage />
            </ProtectedRoute>
          }
        />

        {/* /profile with no userId renders the current user's own profile.
            /profile/:userId renders someone else's profile (same component,
            different data) — the Profile component handles both cases by
            falling back to the JWT's user_id when no param is present. */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym/:gymId/wall/:wallId/archived"
          element={
            <ProtectedRoute>
              <ArchivedClimbs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym/:gymId/competitions"
          element={<ProtectedRoute><CompetitionList /></ProtectedRoute>}
        />
        <Route
          path="/gym/:gymId/competitions/create"
          element={<ProtectedRoute><SetterRoute><CreateCompetition /></SetterRoute></ProtectedRoute>}
        />
        <Route
          path="/gym/:gymId/competitions/:compId"
          element={<ProtectedRoute><CompetitionPage /></ProtectedRoute>}
        />
        <Route
          path="/gym/:gymId/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
