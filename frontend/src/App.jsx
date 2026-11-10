import { NavLink, Route, Routes } from 'react-router-dom';
import Logo from './components/Logo.jsx';
import CheckPage from './pages/CheckPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="PhishFight home">
          <Logo size={30} />
          <span>
            Phish<span className="red">Fight</span>
          </span>
        </NavLink>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>
            Check a link
          </NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<CheckPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* any other address shows the 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="footer">
        PhishFight, COS30049 Assignment 3, Session 12 Group 4
      </footer>
    </div>
  );
}

export default App;