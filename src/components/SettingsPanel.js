import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Clock, Calendar, List, Trash2, Plus } from 'lucide-react';
import './SettingsPanel.css';

const SettingsPanel = ({ 
  playlist = [], 
  setPlaylist, 
  delay, 
  setDelay, 
  selectedMonth, 
  setSelectedMonth,
  selectedDay,
  setSelectedDay
}) => {
  const [show, setShow] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const wrapperRef = useRef(null);

  // Default speed setup: If no delay is set, default to 10
  useEffect(() => {
    if (!delay) setDelay(10);
  }, [delay, setDelay]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShow(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const addLink = () => {
    if (newTitle && newUrl) {
      setPlaylist([...playlist, { id: `url-${Date.now()}`, type: 'url', title: newTitle.toUpperCase(), url: newUrl }]);
      setNewTitle(''); 
      setNewUrl('');
    }
  };

  const remove = (id) => { 
    if (playlist.length > 1) {
      setPlaylist(playlist.filter(p => p.id !== id));
    }
  };

  return (
    <div className="settings-wrapper" ref={wrapperRef}>
      <button className="nav-icon-btn settings-trigger" onClick={() => setShow(!show)}>
        <Settings size={20} />
      </button>

      {show && (
        <div className="settings-drawer animate-slide-in">
          <div className="drawer-header">
            <div className="header-title">
                <Settings size={16} className="text-cyan-400" />
                <h3>DASHBOARD SETTINGS</h3>
            </div>
            <button className="close-btn" onClick={() => setShow(false)}><X size={20} /></button>
          </div>
          
          <div className="drawer-content">
            <div className="setting-section">
              <label><Calendar size={14} /> FACTORY DATA TIMELINE</label>
              <div className="input-group">
                <div className="sub-input">
                    <span>PRODUCTION DAY</span>
                    <input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} />
                </div> 
                <div className="sub-input">
                    <span>FINANCIAL MONTH</span>
                    {/* Fixed Month Selector */}
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="setting-section">
              <label><Clock size={14} /> SLIDE DELAY (SECONDS)</label>
              <input 
                type="number" 
                value={delay} 
                onChange={(e) => setDelay(e.target.value)} 
                min="5" 
                placeholder="10"
              />
            </div>

            <div className="setting-section">
              <label><List size={14} /> ACTIVE DISPLAY LOOP</label>
              <div className="playlist-edit-list">
                {playlist?.filter(item => item.type !== 'weather').map(item => (
                  <div key={item.id} className="edit-item">
                    <div className="item-info">
                        <span className={`type-tag ${item.type}`}>{item.type === 'excel' ? 'XLS' : item.type === 'native' ? 'DB' : 'URL'}</span>
                        <span className="item-title">{item.title}</span>
                    </div>
                    <button className="delete-item-btn" onClick={() => remove(item.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="setting-section add-box">
              <label><Plus size={14} /> ADD EXTERNAL RESOURCE</label>
              <div className="add-form">
                <input placeholder="Webpage Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                <button className="add-btn" onClick={addLink}>Add to Loop</button>
              </div>
            </div>
          </div>
          <div className="drawer-footer">
              <button className="apply-btn" onClick={() => setShow(false)}>APPLY CONFIGURATION</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;