import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import Dashboard from "./Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}