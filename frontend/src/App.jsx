import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Home from "./Components/Home";
import About from "./Components/About";
import { Login } from "./Auth/Login";
import { Register } from "./Auth/Register";
import { Leaderboard } from "./Components/Leaderboard";
import { FetchAllYourSubmissions } from "./Components/FetchAllYourSubmissions";
import { ShowSubmissionById } from "./Components/ShowSubmissionById";
import Problems from "./Components/Problems";
import ProblemDetails from "./Components/ProblemDetails";
import { ContestProvider } from "./context/ContestContext";
import Logout from "./Auth/Logout";
import "./App.css";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { AdminLogin } from "./Admin/AdminLogin";
import { AddContest } from "./Admin/AddContest";
import { AdminDashboard } from "./Admin/AdminDashboard";
import { DropProblemsFile } from "./Admin/DropProblemsFile";
import { AdminLeaderboard } from "./Admin/AdminLeaderboard";
import { TeamByIDLeaderboard } from "./Admin/TeamByIDLeaderboard";
import { GenerateTeams } from "./Admin/GenerateTeams";
import { AdminProtectedRoute } from "./Admin/AdminProtectedRoute";
import { AdminShowAllSubmission } from "./Admin/AdminShowAllSubmission";
import { AdminShowSubmissonById } from "./Admin/AdminShowSubmissonById";
import { ProtectedRoute } from "./Auth/ProtectedRoute";


function App() {
  return (
    <ThemeProvider>
      <ContestProvider>
        <AuthProvider>
          <Router>
            <Navbar />
            <Routes>
              {/* Landing */}
              <Route path="/" element={<Home />} />

              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/about" element={<About />} />
              <Route path="/leaderboard/:contestId" element={<Leaderboard />} />

              {/* Team protected */}
              <Route path="/problems" element={<ProtectedRoute><Problems /></ProtectedRoute>} />
              <Route path="/problems/:id" element={<ProtectedRoute><ProblemDetails /></ProtectedRoute>} />
              <Route path="/submissions/" element={<ProtectedRoute><FetchAllYourSubmissions /></ProtectedRoute>} />
              <Route path="/submissions/:id" element={<ProtectedRoute><ShowSubmissionById /></ProtectedRoute>} />

              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/admin/dashboard"element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>}/>
              <Route path="/admin/add-contest"element={<AdminProtectedRoute><AddContest /></AdminProtectedRoute>}/>
              <Route path="/admin/drop-problems/:contestId"element={<AdminProtectedRoute><DropProblemsFile /></AdminProtectedRoute>}/>
              <Route path="/admin/leaderboard/:contestId"element={<AdminProtectedRoute><AdminLeaderboard /></AdminProtectedRoute>}/>
              <Route path="/admin/leaderboard/:contestId/team/:teamId"element={<AdminProtectedRoute><TeamByIDLeaderboard /></AdminProtectedRoute>}/>
              <Route path="/admin/generate-teams"element={<AdminProtectedRoute><GenerateTeams /></AdminProtectedRoute>}/>
              <Route path="/admin/submissions"element={<AdminProtectedRoute><AdminShowAllSubmission /></AdminProtectedRoute>}/>
              <Route path="/admin/submissions/:id"element={<AdminProtectedRoute><AdminShowSubmissonById /></AdminProtectedRoute>}/>
            </Routes>
          </Router>
        </AuthProvider>
      </ContestProvider>
    </ThemeProvider>
  );
}

export default App;
