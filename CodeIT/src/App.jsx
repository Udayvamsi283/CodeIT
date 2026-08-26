import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Problems from './pages/Problems';
import Problem from './pages/Problem';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0d1117] flex flex-col text-[#e6edf3]">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/problems" replace />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problem/:id" element={<Problem />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
