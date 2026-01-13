import React, { useState, useEffect } from 'react';
import './NewsTicker.css';

const FINANCIAL_FEEDS = [
  // Your working CBSL Links
  { name: 'CBSL/WEEKLY', url: 'https://www.cbsl.gov.lk/en/statistics/economic-indicators/weirss' },
  { name: 'CBSL/MONETARY', url: 'https://www.cbsl.gov.lk/en/press/press-releases/mprrss' },
  { name: 'CBSL/MONTHLY', url: 'https://www.cbsl.gov.lk/en/statistics/economic-indicators/meirss' },
  // Stock Market
  { name: 'CSE/STOCKS', url: 'https://www.cse.lk/corporate-disclosures-feed' }
];

const GENERAL_FEEDS = [
  { name: 'BOI/TRADE', url: 'https://investsrilanka.com/category/news/feed/' },
  { name: 'INDUSTRY', url: 'https://www.just-style.com/feed/' }
];

const NewsTicker = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      let items = [];
      
      // 1. Fetch Working Financial Data
      for (const source of FINANCIAL_FEEDS) {
        try {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}&t=${Date.now()}`);
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            items.push(...data.items.slice(0, 3).map(i => ({ source: source.name, title: i.title })));
          }
        } catch (e) { console.error(`Sync Error (${source.name}):`, e); }
      }

      // 2. Fetch General Industry Data
      for (const source of GENERAL_FEEDS) {
        try {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`);
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            items.push(...data.items.slice(0, 2).map(i => ({ source: source.name, title: i.title })));
          }
        } catch (e) { console.error(`Sync Error (${source.name}):`, e); }
      }
      setNews(items);
    };

    fetchNews();
    const timer = setInterval(fetchNews, 1800000); // 30-min refresh
    return () => clearInterval(timer);
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="newsline-container">
      <div className="newsline-label"><span className="live-dot"></span> MARKET PULSE</div>
      <div className="newsline-scroll">
        <div className="newsline-track">
          {[...news, ...news].map((n, idx) => (
            <div key={idx} className="newsline-item">
              <span className="newsline-source">[{n.source}]</span>
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