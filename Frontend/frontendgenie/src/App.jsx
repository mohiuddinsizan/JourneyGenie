import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Home from './pages/Home';
import Login from './pages/Login';
import Plan from './pages/Plan';
import './App.css'; // or './main.css' if that's your file

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/plan" element={<Plan />} />

    </Routes>
  );
};

export default App;
