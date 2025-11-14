import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ChannelCreatePage from "./pages/ChannelCreatePage.jsx";
import RoomList from "./pages/RoomList.jsx";
import RoomsDiscoverPage from "./pages/RoomsDiscoverPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import "./index.css";
import "./App.css";

function App() {
  return (
    <div className="app-background">
      <div className="app-aurora app-aurora--one" aria-hidden="true" />
      <div className="app-aurora app-aurora--two" aria-hidden="true" />
      <div className="app-aurora app-aurora--three" aria-hidden="true" />
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/chat/:roomId?"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/channels/new"
              element={
                <ProtectedRoute>
                  <ChannelCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/manage"
              element={
                <ProtectedRoute>
                  <RoomList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms/discover"
              element={
                <ProtectedRoute>
                  <RoomsDiscoverPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
