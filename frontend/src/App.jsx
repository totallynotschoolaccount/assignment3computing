import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import CheckPage from './pages/CheckPage.jsx';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="PhishFight home">
          <span className="brand-mark">
            <ShieldCheck size={23} strokeWidth={2.3} />
          </span>
          <span>
            Phish<span>Fight</span>
            <small>URL RISK CHECK</small>
          </span>
        </a>
        <div className="topbar-right">
          <span className="privacy-pill">
            <LockKeyhole size={14} /> URL text only
          </span>
          <a className="header-link" href="#how-it-works">
            How it works <ArrowRight size={14} />
          </a>
        </div>
      </header>

      <main id="home">
        <CheckPage />
      </main>

      <footer className="footer">
        <a className="footer-brand" href="/">
          <ShieldCheck size={18} /> PhishFight
        </a>
        <span>COS30049 Assignment 3, Session 12 Group 4</span>
      </footer>
    </div>
  );
}

export default App;