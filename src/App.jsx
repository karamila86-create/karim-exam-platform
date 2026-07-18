import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Lessons from './pages/Lessons.jsx';
import Exam from './pages/Exam.jsx';
import Result from './pages/Result.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lessons" element={<Lessons />} />
      <Route path="/exam/:examId" element={<Exam />} />
      <Route path="/result/:attemptId" element={<Result />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
