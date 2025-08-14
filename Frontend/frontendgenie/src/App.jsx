import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Home from './pages/Home';
import Login from './pages/Login';
import Plan from './pages/Plan';
import Profile from './pages/Profile';
import './App.css'; // or './main.css' if that's your file

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/plan" element={<Plan />} />
      <Route path="/profile" element={<Profile />} />

    </Routes>
  );
};

export default App;
