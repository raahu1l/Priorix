import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import FeedbackPage from './pages/FeedbackPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-background" />

        <nav className="nav-container">
          <div className="nav-bar glass-solid">
            <div className="nav-brand">
              <div className="nav-brand-icon">P</div>
              <h1>Priorix
              </h1>
            </div>

            <div className="nav-links">
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                Prioritization
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Analytics
              </NavLink>
              <NavLink
                to="/import"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Data Import
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Settings
              </NavLink>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<FeedbackPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
