import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Lessons from './pages/Lessons.jsx';
import Exam from './pages/Exam.jsx';
import Result from './pages/Result.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/lessons" element={<Lessons />} />
      <Route path="/exam/:examId" element={<Exam />} />
      <Route path="/result/:attemptId" element={<Result />} />
    </Routes>
  );
}
