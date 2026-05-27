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
import { isSetter } from "./auth";

function SetterRoute({ children }) {
  return isSetter() ? children : <Navigate to="/" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
