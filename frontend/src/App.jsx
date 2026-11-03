import { NavLink, Route, Routes } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import CheckPage from './pages/CheckPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="PhishFight home">
          <span className="brand-mark">
            <ShieldCheck size={23} strokeWidth={2.3} />
          </span>
          <span>
            Phish<span>Fight</span>
            <small>URL RISK CHECK</small>
          </span>
        </NavLink>
        <nav className="topbar-right" aria-label="Main">
          <span className="privacy-pill">
            <LockKeyhole size={14} /> URL text only
          </span>
          <NavLink className="header-link" to="/" end>
            Check a link
          </NavLink>
          <NavLink className="header-link" to="/history">
            History
          </NavLink>
        </nav>
      </header>

      <main id="home">
        <Routes>
          <Route path="/" element={<CheckPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* any other address shows the 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <NavLink className="footer-brand" to="/">
          <ShieldCheck size={18} /> PhishFight
        </NavLink>
        <span>COS30049 Assignment 3, Session 12 Group 4</span>
      </footer>
    </div>
  );
}

export default App;