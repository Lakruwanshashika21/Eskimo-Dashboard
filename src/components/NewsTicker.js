import React, { useState, useEffect } from 'react';
import './NewsTicker.css';

// Combined Local and International News Feeds with Category Labels
const NEWS_FEEDS = [
  { name: 'BOI/TRADE', url: 'https://investsrilanka.com/category/news/feed/', category: 'LOCAL' },
  { name: 'BBC WORLD', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'GLOBAL' },
  { name: 'DAILY MIRROR', url: 'https://www.dailymirror.lk/rss/news', category: 'LOCAL' },
  { name: 'REUTERS GLOBAL', url: 'https://www.reutersagency.com/feed/?best-topics=world&post_type=best', category: 'GLOBAL' },
  { name: 'ADA DERANA', url: 'http://www.adaderana.lk/rss.php', category: 'LOCAL' },
];

const NewsTicker = () => {
  const [news, setNews] = useState([]);
  const [rates, setRates] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      let items = [];
      
      // 1. Fetch Local & International News
      for (const source of NEWS_FEEDS) {
        try {
          // Added &t=${Date.now()} to force a fresh fetch (Cache-Buster)
          // encodeURIComponent ensures the .php?nid= type URLs are passed correctly
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}&t=${Date.now()}`);
          
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          
          const data = await res.json();
          
          // Verify status and ensure items exist before mapping
          if (data.status === 'ok' && data.items) {
            items.push(...data.items.slice(0, 4).map(i => ({ 
              source: source.name,
              category: source.category,
              title: i.title.toUpperCase() 
            })));
          } else {
            console.warn(`Feed sync failed for ${source.name}: ${data.message || 'Unknown error'}`);
          }
        } catch (e) { 
          console.error(`Sync Error (${source.name}):`, e); 
        }
      }
      
      // Only update state if items were successfully fetched
      if (items.length > 0) setNews(items);

      // 2. Fetch Live Exchange Rates (LKR)
      try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateRes.json();
        if (rateData && rateData.rates) {
          setRates({
            USD: rateData.rates.LKR.toFixed(2),
            EUR: (rateData.rates.LKR / rateData.rates.EUR).toFixed(2),
            GBP: (rateData.rates.LKR / rateData.rates.GBP).toFixed(2)
          });
        }
      } catch (e) { 
        console.error("Exchange Rate Sync Error", e); 
      }
    };

    fetchData();
    const timer = setInterval(fetchData, 1800000); // 30-min refresh
    return () => clearInterval(timer);
  }, []);

  if (news.length === 0 && !rates) return null;

  return (
    <div className="newsline-container">
      <div className="newsline-label"><span className="live-dot"></span> MARKET PULSE</div>
      
      <div className="newsline-scroll">
        <div className="newsline-track">
          {/* SECTION: EXCHANGE RATES (GREEN/RED STYLING) */}
          {rates && (
            <div className="rate-group">
              <span className="rate-item">USD/LKR: <strong className="rate-up">{rates.USD} ▲</strong></span>
              <span className="rate-item">EUR/LKR: <strong className="rate-down">{rates.EUR} ▼</strong></span>
              <span className="rate-item">GBP/LKR: <strong className="rate-up">{rates.GBP} ▲</strong></span>
              <span className="newsline-divider">||</span>
            </div>
          )}

          {/* SECTION: NEWS ITEMS (LOCAL + GLOBAL LABELS) */}
          {news.map((n, idx) => (
            <div key={`news-${idx}`} className="newsline-item">
              <span className="newsline-category">[{n.category}]</span>
              <span className="newsline-source">{n.source}</span>
              <span className="newsline-title">{n.title}</span>
              <span className="newsline-divider">|</span>
            </div>
          ))}

          {/* DUPLICATE FOR SEAMLESS INFINITE LOOP */}
          {rates && (
            <div className="rate-group">
              <span className="rate-item">USD/LKR: <strong className="rate-up">{rates.USD} ▲</strong></span>
              <span className="newsline-divider">||</span>
            </div>
          )}
          {news.slice(0, 15).map((n, idx) => (
            <div key={`dup-${idx}`} className="newsline-item">
              <span className="newsline-category">[{n.category}]</span>
              <span className="newsline-source">{n.source}</span>
              <span className="newsline-title">{n.title}</span>
              <span className="newsline-divider">|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;