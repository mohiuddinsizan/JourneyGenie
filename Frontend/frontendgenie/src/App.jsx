// App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import Register from './pages/Register';
import Home from './pages/Home';
import Login from './pages/Login';
import Plan from './pages/Plan';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';
import HowItWorks from './pages/HowItWorks';
import Navbar from './components/Navbar';
import './App.css';

const App = () => {
  const location = useLocation();

  // ❌ Routes where Navbar should NOT appear
  const noNavbarRoutes = ["/", "/login", "/register", "/idle"];

  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}

      {/* Wrap routes in main and add margin only if navbar is present */}
      <main style={{ marginTop: shouldShowNavbar ? "100px" : "0" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/idle" element={<Home />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/howitworks" element={<HowItWorks />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
