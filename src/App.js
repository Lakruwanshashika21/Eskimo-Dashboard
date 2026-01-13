import React, { useState, useEffect, useCallback } from 'react';
import { Login, useIsSignedIn } from '@microsoft/mgt-react';
import { AppProvider } from './context/AppContext'; 
import ExcelDashboard from './components/ExcelDashboard';
import MachineDashboard from './components/MachineDashboard';
import SettingsPanel from './components/SettingsPanel';
import NewsTicker from './components/NewsTicker'; // Real-time Newsline component
import './App.css';

function App() {
  const [isSignedIn] = useIsSignedIn();
  
  // HUD & Visibility States
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Defaults to current month YYYY-MM
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [delay, setDelay] = useState(10); // Default set to 10s as requested
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Playlist Configuration (Weather Removed)
  const [playlist, setPlaylist] = useState([
    { id: 'clk', type: 'url', title: 'SYSTEM CLOCK', url: 'https://vclock.com/embed/clock/#theme=0&color=1&show_seconds=1' },
    { id: 'ex0', type: 'excel', title: 'P2P PERFORMANCE', slideIndex: 0 },
    { id: 'ex1', type: 'excel', title: 'MONTHLY P2P', slideIndex: 1 },
    { id: 'ex2', type: 'excel', title: 'HEADCOUNT', slideIndex: 2 },
    { id: 'ex3', type: 'excel', title: 'QUALITY REJECTION', slideIndex: 3 },
    { id: 'ex4', type: 'excel', title: 'INSPECTION PASS', slideIndex: 4 },
    { id: 'ex5', type: 'excel', title: 'FOB SUMMARY', slideIndex: 5 },
    { id: 'ex6', type: 'excel', title: 'FOB GRAPH', slideIndex: 6 },
    { id: 'ex7', type: 'excel', title: 'PRODUCTION SUMMARY', slideIndex: 7 },
    { id: 'mach', type: 'native', title: 'MACHINE LIVE' }, 
  ]);

  // Full-Screen Detection Logic
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const rotate = useCallback((dir = 1) => {
    setActiveIndex((prev) => (prev + dir + playlist.length) % playlist.length);
  }, [playlist.length]);

  // Main Rotation Timer
  useEffect(() => {
    if (isPaused || !isSignedIn) return;
    const timer = setInterval(() => rotate(1), delay * 1000);
    return () => clearInterval(timer);
  }, [rotate, delay, isPaused, isSignedIn]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeys = (e) => {
      if (e.key === "ArrowRight") rotate(1);
      if (e.key === "ArrowLeft") rotate(-1);
      if (e.key === " ") { e.preventDefault(); setIsPaused(p => !p); }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [rotate]);

  if (!isSignedIn) return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-massive">ESKIMO<span>COMMAND</span></div>
        <Login />
      </div>
    </div>
  );

  const currentPage = playlist[activeIndex];

  return (
    <AppProvider>
      <div className="app-orchestrator">
        {/* TOP HUD NAVIGATION */}
        <nav className="top-nav-glass">
          <div className="nav-section-left">
            <div className="brand-box">
              <div className="live-indicator"><div className="pulse"></div></div>
              <span className="brand-text">ESKIMO <strong>LIVE</strong></span>
            </div>
            <div className="divider-v" />
            <div className="tab-pills-scroll">
              {playlist.map((tab, idx) => (
                <button 
                  key={tab.id} 
                  className={`pill-modern ${idx === activeIndex ? 'active' : ''}`} 
                  onClick={() => { setActiveIndex(idx); setIsPaused(true); }}
                >
                  {tab.title}
                </button>
              ))}
            </div>
          </div>

          <div className="nav-section-right">
            <div className="playback-cluster">
               <button className="nav-icon-btn" onClick={() => rotate(-1)}>❮</button>
               <button className={`play-toggle ${isPaused ? 'is-paused' : 'is-playing'}`} onClick={() => setIsPaused(!isPaused)}>
                 {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
               </button>
               <button className="nav-icon-btn" onClick={() => rotate(1)}>❯</button>
            </div>
            
            <div className="divider-v" />
            
            {/* SETTINGS PANEL (Hidden in full-screen for clear TV view) */}
            {!isFullScreen && (
                <SettingsPanel 
                    playlist={playlist}
                    setPlaylist={setPlaylist}
                    delay={delay} 
                    setDelay={setDelay} 
                    selectedMonth={selectedMonth} 
                    setSelectedMonth={setSelectedMonth} 
                    selectedDay={selectedDay}
                    setSelectedDay={setSelectedDay}
                />
            )}
            
            <button className="fs-toggle" onClick={() => document.documentElement.requestFullscreen()}>⛶</button>
          </div>
        </nav>

        {/* MAIN DISPLAY AREA */}
        <main className="main-viewport">
          {currentPage.id === 'mach' ? (
            <MachineDashboard selectedDay={selectedDay} /> 
          ) : currentPage.type === 'excel' ? (
            <ExcelDashboard selectedMonth={selectedMonth} forcedSlide={currentPage.slideIndex} />
          ) : (
            <div className="iframe-wrapper-force">
              <iframe 
                src={currentPage.url} 
                title={currentPage.title || "External Content"} 
                className="external-frame-full" 
                allow="autoplay; fullscreen" 
              />
            </div>
          )}
        </main>

        {/* INTEGRATED REAL-TIME NEWSLINE (MARKET PULSE) */}
        <NewsTicker />

        {/* INDUSTRIAL SYSTEM FOOTER */}
        <footer className="industrial-footer">
          <div className="footer-status">CLUSTER: <span className="online">OPERATIONAL</span></div>
          <div className="footer-center">
               <span className="page-count">VIEW {activeIndex + 1} / {playlist.length}</span>
               <span className="divider-dot">•</span>
               <span className="view-title">{currentPage.title}</span>
          </div>
          <div className="footer-right">AUTO-CYCLE: {delay}s</div>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;