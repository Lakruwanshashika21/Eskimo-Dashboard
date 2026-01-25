import React, { useState, useEffect, useCallback } from 'react';
import { Login, useIsSignedIn } from '@microsoft/mgt-react';
import { AppProvider } from './context/AppContext'; 
import ExcelDashboard from './components/ExcelDashboard';
import MachineDashboard from './components/MachineDashboard';
import SettingsPanel from './components/SettingsPanel';
import NewsTicker from './components/NewsTicker'; 
import { Menu, X } from 'lucide-react'; 
import './App.css';

function App() {
  const [isSignedIn] = useIsSignedIn();
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [delay, setDelay] = useState(10); 
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [playlist, setPlaylist] = useState([
    { id: 'clk', type: 'url', title: 'SYSTEM CLOCK', url: 'https://vclock.com/embed/clock/#theme=0&color=1&show_seconds=1' },
    { id: 'pbi-perf', type: 'url', title: 'POWER BI LIVE' },
    { id: 'ex0', type: 'excel', title: 'P2P PERFORMANCE', slideIndex: 0 },
    { id: 'ex1', type: 'excel', title: 'MONTHLY P2P', slideIndex: 1 },
    { id: 'ex2', type: 'excel', title: 'HEADCOUNT', slideIndex: 2 },
    { id: 'ex3', type: 'excel', title: 'QUALITY REJECTION', slideIndex: 3 },
    { id: 'ex4', type: 'excel', title: 'INSPECTION PASS', slideIndex: 4 },
    { id: 'ex7', type: 'excel', title: 'PRODUCTION SUMMARY', slideIndex: 7 },
    { id: 'mach', type: 'native', title: 'MACHINE LIVE' }, 
  ]);

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const rotate = useCallback((dir = 1) => {
    setActiveIndex((prev) => (prev + dir + playlist.length) % playlist.length);
  }, [playlist.length]);

  useEffect(() => {
    if (isPaused || !isSignedIn) return;
    const timer = setInterval(() => rotate(1), delay * 1000);
    return () => clearInterval(timer);
  }, [rotate, delay, isPaused, isSignedIn]);

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
        <nav className="top-nav-glass">
          <div className="nav-brand-area">
            <div className="brand-box">
              <div className="live-indicator"><div className="pulse"></div></div>
              <span className="brand-text">ESKIMO <strong>LIVE</strong></span>
            </div>
            <div className="divider-v" />
          </div>

          <div className="nav-middle-scroll">
            <button className="mobile-nav-toggle" onClick={() => setIsMenuOpen(true)}>
              <Menu size={18} />
              <span>VIEWS</span>
            </button>

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
               <button className={`play-toggle ${isPaused ? 'is-paused' : ''}`} onClick={() => setIsPaused(!isPaused)}>
                 {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
               </button>
               <button className="nav-icon-btn" onClick={() => rotate(1)}>❯</button>
            </div>
            
            <div className="divider-v" />
            
            {!isFullScreen && (
                <SettingsPanel 
                    playlist={playlist} setPlaylist={setPlaylist}
                    delay={delay} setDelay={setDelay} 
                    selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} 
                    selectedDay={selectedDay} setSelectedDay={setSelectedDay}
                />
            )}
            
            <button className="fs-toggle" onClick={() => document.documentElement.requestFullscreen()}>⛶</button>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="mobile-nav-overlay" onClick={() => setIsMenuOpen(false)}>
            <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h3>DASHBOARD VIEWS</h3>
                <button className="close-drawer" onClick={() => setIsMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="mobile-nav-list">
                {playlist.map((tab, idx) => (
                  <button 
                    key={tab.id}
                    className={`mobile-nav-item ${idx === activeIndex ? 'active' : ''}`}
                    onClick={() => {
                      setActiveIndex(idx);
                      setIsMenuOpen(false);
                      setIsPaused(true);
                    }}
                  >
                    <span className="nav-index">{idx + 1}</span>
                    <span className="nav-title">{tab.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="main-viewport">
          {/* PERSISTENT POWER BI IFRAME */}
          <div 
            className="iframe-wrapper-force" 
            style={{ display: currentPage.id === 'pbi-perf' ? 'flex' : 'none' }}
          >
            <iframe 
              src="https://app.powerbi.com/reportEmbed?reportId=397b3261-7326-4641-b518-a49b5523400b&autoAuth=true&navContentPaneEnabled=false&filterPaneEnabled=false" 
              title="Power BI Permanent"
              className="external-frame-full" 
              allow="autoplay; fullscreen" 
            />
          </div>

          {/* DYNAMIC CONTENT */}
          {currentPage.id === 'mach' ? (
            <MachineDashboard selectedDay={selectedDay} /> 
          ) : currentPage.type === 'excel' ? (
            <ExcelDashboard 
              selectedMonth={selectedMonth} 
              selectedDay={selectedDay} 
              forcedSlide={currentPage.slideIndex} 
            />
          ) : (
            currentPage.id !== 'pbi-perf' && (
              <div className="iframe-wrapper-force">
                <iframe 
                  src={currentPage.url} 
                  title={currentPage.title} 
                  className="external-frame-full" 
                  allow="autoplay; fullscreen" 
                />
              </div>
            )
          )}
        </main>

        <NewsTicker 
           status={`CLUSTER: OPERATIONAL | VIEW ${activeIndex + 1}/${playlist.length} | ${currentPage.title} | AUTO-CYCLE: ${delay}s`} 
        />
      </div>
    </AppProvider>
  );
}

export default App;