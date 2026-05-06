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
import Leaderboard from "./pages/Leaderboard"

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
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
        <Route path="Logout" element={<Logout />} />
        <Route path="/create-gym" element={<CreateGym />} />
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
              <AddClimb />
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
