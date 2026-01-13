import React, { useState, useEffect, useCallback } from 'react';
import { Providers } from '@microsoft/mgt-element';
import './ExcelDashboard.css';

// --- ROBUST FORMATTING HELPERS ---
const formatPct = (val) => {
  if (val === undefined || val === null || val === "" || val === "#DIV/0!") return "0%";
  let str = val.toString(); 
  const num = parseFloat(str.replace(/,/g, '').replace(/%/g, ''));
  if (isNaN(num)) return "0%";
  return num <= 1 && num > 0 ? `${(num * 100).toFixed(1)}%` : `${num.toFixed(1)}%`;
};

const formatNum = (val) => {
  if (val === undefined || val === null || val === "") return "0";
  let str = val.toString().replace(/,/g, '').replace(/\((.*)\)/, '-$1').trim();
  const num = parseFloat(str);
  return isNaN(num) ? "0" : num.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const ExcelDashboard = ({ selectedMonth, forcedSlide }) => {
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const graphClient = Providers.globalProvider.graph.client;
      const [year, month] = selectedMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
      const folder = month.padStart(2, '0'); 
      const fileName = `Eskimo-Flash Report-${monthName} ${year}.xlsx`;
      
      const apiEndpoint = `/sites/eskimoknit.sharepoint.com,121c53f7-d617-4ff3-87b3-ffa698e29c90,2e40c08e-a753-4f79-b9d0-769f6e984bb1/drive/root:/${folder}/${encodeURIComponent(fileName)}:/workbook/worksheets('Flash Report')/range(address='A1:R45')`;
      
      const res = await graphClient.api(apiEndpoint).get();
      if (res.values) setData(res.values);
    } catch (e) { 
      console.error("Sync Error:", e); 
    }
  }, [selectedMonth]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  if (!data) return <div className="loading-screen-inner">SYNCING COMMAND DATA...</div>;

  return (
    <div className="excel-view-container split-mode">
      <div className="pane left-pane">
        <h2 className="pane-label">FACTORY EFFICIENCY %</h2>
        <div className="kpi-vertical-stack">
          <KPIMini title="NEGOMBO" value={data[7][3]} isPercent color="#00f2ff" />
          <KPIMini title="PALLEKELE" value={data[8][3]} isPercent color="#00f2ff" />
          <KPIMini title="PUNANAI" value={data[9][3]} isPercent color="#00f2ff" />
          <div className="divider-neon"></div>
          <KPIMini title="FACTORY TOTAL" value={data[11][3]} isPercent color="#fff" highlight />
        </div>
      </div>

      <div className="pane right-pane">
        {forcedSlide === 0 && <TableSAH data={data} />}
        {forcedSlide === 1 && <TableMonthlyP2P data={data} />}
        {forcedSlide === 2 && <TableHeadcount data={data} />}
        {forcedSlide === 3 && <TableRejection data={data} />}
        {forcedSlide === 4 && <TableInspection data={data} />}
        {forcedSlide === 5 && <TableFOB data={data} />}
        {forcedSlide === 6 && <GraphFOB data={data} />}
        {forcedSlide === 7 && <SummaryPieces data={data} />}
      </div>
    </div>
  );
};

// --- HELPERS ---
const KPIMini = ({ title, value, color, highlight, isPercent }) => (
  <div className={`kpi-mini-row ${highlight ? 'gold' : ''}`}>
    <span className="mini-lbl">{title}</span>
    <span className="mini-val" style={{color}}>{isPercent ? formatPct(value) : formatNum(value)}</span>
  </div>
);

const BarMini = ({ label, plan, actual }) => {
  const p = parseFloat(plan?.toString().replace(/,/g,'')) || 1;
  const a = parseFloat(actual?.toString().replace(/,/g,'')) || 0;
  const pct = Math.min((a / p) * 100, 100);
  return (
    <div className="bar-item-split">
      <div className="bar-info"><span>{label}</span><strong>{formatNum(actual)}</strong></div>
      <div className="bar-track"><div className="bar-fill" style={{width: `${pct}%`}}></div></div>
    </div>
  );
};

// --- TABLE COMPONENTS (Production Stats) ---
const TableSAH = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">P2P PRODUCTION (SAH)</h2>
    <table className="split-table">
      <thead><tr><th>SITE</th><th>DAY ACT</th><th>CUM ACT</th><th>VAR</th></tr></thead>
      <tbody>
        {[7, 8, 9, 11].map(r => (
          <tr key={r} className={r === 11 ? "row-total" : ""}>
            <td>{data[r][7]}</td>
            <td>{formatNum(data[r][8])}</td>
            <td>{formatNum(data[r][9])}</td>
            <td className={parseFloat(data[r][11]) < 0 ? "neg" : "pos"}>{formatNum(data[r][11])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TableMonthlyP2P = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">MONTHLY P2P STATUS</h2>
    <table className="split-table">
      <thead><tr><th>SITE</th><th>PLAN</th><th>ACTUAL</th><th>BALANCE</th></tr></thead>
      <tbody>
        {[7, 8, 9, 11].map(r => (
          <tr key={r} className={r === 11 ? "row-total" : ""}>
            <td>{data[r][13]}</td>
            <td>{formatNum(data[r][14])}</td>
            <td>{formatNum(data[r][15])}</td>
            <td className="neg">{formatNum(data[r][16])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TableHeadcount = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">MO HEADCOUNT</h2>
    <table className="split-table">
      <thead><tr><th>SITE</th><th>ACTUAL</th><th>CUM</th><th>TARGET</th></tr></thead>
      <tbody>
        {[16, 17, 18, 20].map(r => (
          <tr key={r} className={r === 20 ? "row-total" : ""}>
            <td>{data[r][2]}</td>
            <td>{formatNum(data[r][3])}</td>
            <td>{formatNum(data[r][4])}</td>
            <td>{formatNum(data[r][5])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TableRejection = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">REJECTION %</h2>
    <table className="split-table">
      <thead><tr><th>SITE</th><th>DAY QTY</th><th>CUM QTY</th><th>CUM %</th></tr></thead>
      <tbody>
        {[16, 17, 18, 20].map(r => (
          <tr key={r} className={r === 20 ? "row-total" : ""}>
            <td>{data[r][7]}</td>
            <td>{formatNum(data[r][8])}</td>
            <td>{formatNum(data[r][9])}</td>
            <td className="neg">{formatPct(data[r][11])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TableInspection = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">FINAL INSPECTION PASS RATE</h2>
    <table className="split-table">
      <thead><tr><th>METRIC</th><th>DAY</th><th>CUM</th></tr></thead>
      <tbody>
        {[16, 17, 18].map(r => (
          <tr key={r} className={r === 18 ? "row-total" : ""}>
            <td>{data[r][13]}</td>
            <td>{r === 18 ? formatPct(data[r][14]) : formatNum(data[r][14])}</td>
            <td>{r === 18 ? formatPct(data[r][15]) : formatNum(data[r][15])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TableFOB = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">FOB EX-FACTORY SUMMARY</h2>
    <table className="split-table">
      <thead><tr><th>PERIOD</th><th>PLAN</th><th>ACTUAL</th><th>VAR</th></tr></thead>
      <tbody>
        {[25, 27, 29].map(r => (
          <tr key={r} className={r === 29 ? "row-total" : ""}>
            <td>{data[r][2]}</td>
            <td>{formatNum(data[r][3])}</td>
            <td>{formatNum(data[r][4])}</td>
            <td className="neg">{formatNum(data[r][5])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const GraphFOB = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">FOB PERFORMANCE GRAPH</h2>
    <div className="summary-stack">
      <BarMini label="DAY PERFORMANCE" plan={data[25][3]} actual={data[25][4]} />
      <BarMini label="CUM PERFORMANCE" plan={data[27][3]} actual={data[27][4]} />
    </div>
  </div>
);

const SummaryPieces = ({ data }) => (
  <div className="sub-slide animate-fade">
    <h2 className="pane-label">PRODUCTION PIECES SUMMARY</h2>
    <div className="summary-stack">
      <div className="sum-card"><span>MONTHLY PLAN</span><strong>{formatNum(data[23][16])}</strong></div>
      <div className="sum-card"><span>CUM PRODUCTION</span><strong>{formatNum(data[25][16])}</strong></div>
      <div className="sum-card alert"><span>BALANCE</span><strong className="red">{formatNum(data[27][16])}</strong></div>
    </div>
  </div>
);

export default ExcelDashboard;