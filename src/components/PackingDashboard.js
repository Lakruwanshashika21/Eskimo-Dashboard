import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Providers } from '@microsoft/mgt-element';

const PackingDashboard = ({ selectedDay, view }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPackingData = useCallback(async () => {
    setLoading(true);
    try {
      const graphClient = Providers.globalProvider.graph.client;
      
      // 1. Month calculation for folder (02, 03, etc.)
      const monthFolder = selectedDay ? selectedDay.split('-')[1] : "02";
      
      // 2. Verified Site Address
      const sitePath = "eskimoknit.sharepoint.com:/sites/corparateteam2";
      
      // 3. FIXED ENDPOINT STRUCTURE
      // We target the file by its path relative to the site root.
      // Note: "Shared Documents" in the URL is often just "root" or omitted in Graph paths
      const endpoint = `/sites/${sitePath}/drive/root:/Packing%20Daily%20Report/${monthFolder}/Packing%20Plan.xlsx:/workbook/worksheets('Summary')/range(address='A1:O100')`;

      const res = await graphClient.api(endpoint).get();
      if (res && res.values) {
        setData(res.values);
      }
    } catch (e) { 
      console.error("Packing Data Sync Error:", e); 
      // If the path above fails, it's likely the "Shared Documents" segment requirement.
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => { fetchPackingData(); }, [fetchPackingData]);

  // Extract date from Cell B2 (Row 2, Col 2)
  const excelSheetDate = useMemo(() => {
    if (!data || data.length < 2) return "";
    return data[1][1] || "NO DATE"; 
  }, [data]);

  const processedRows = useMemo(() => {
    if (!data || data.length < 5) return [];
    
    // Starting from row 5 (index 4 in 0-based), filter out "0" customers
    return data.slice(4).filter(row => {
      const customer = row[1]?.toString().trim();
      // Only return rows where customer is not "0", empty, or "Customer" header
      return customer && customer !== "0" && customer !== "Customer";
    });
  }, [data]);

  if (loading) return <div className="empty-msg">FETCHING {view?.toUpperCase()}...</div>;

  return (
    <div className="shipment-view-wrapper animate-fade">
      <div className="sub-slide">
        <div className="pane-header-container">
           <div className="sheet-date-display-top">FILE DATE: {excelSheetDate}</div>
           <h2 className="pane-label">
             {view === 'plan' ? 'DAILY PACKING PLAN' : 'PACKING CAPACITY'}
           </h2>
        </div>
        
        <div className="shipment-scroll-box">
          <table className="split-table">
            <thead>
              {view === 'plan' ? (
                <tr>
                  <th>CUSTOMER</th>
                  <th>ARTICLE</th>
                  <th>ORDER QTY</th>
                  <th>PACKED (ACTUAL)</th>
                  <th>ACHIEVEMENT</th>
                </tr>
              ) : (
                <tr>
                  <th>CUSTOMER</th>
                  <th>ARTICLE</th>
                  <th>INPUT</th>
                  <th>ONHAND</th>
                  <th>TOTAL AVAIL.</th>
                </tr>
              )}
            </thead>
            <tbody>
              {processedRows.length > 0 ? processedRows.map((row, i) => (
                <tr key={i}>
                  <td className="text-blue" style={{fontWeight: 800}}>{row[1]}</td> 
                  <td>{row[2]}</td> 
                  {view === 'plan' ? (
                    <>
                      <td className="tabular">{parseFloat(row[4] || 0).toLocaleString()}</td> 
                      <td className="tabular text-green">{parseFloat(row[9] || 0).toLocaleString()}</td> 
                      <td>
                        <span className={`status-pill ${parseFloat(row[14]) >= 1 ? 'status-complete' : 'status-pending'}`}>
                          {row[14] ? `${(parseFloat(row[14]) * 100).toFixed(0)}%` : '0%'}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="tabular">{parseFloat(row[11] || 0).toLocaleString()}</td> 
                      <td className="tabular">{parseFloat(row[12] || 0).toLocaleString()}</td> 
                      <td className="tabular text-cyan-neon">
                        {parseFloat(row[13] || 0).toLocaleString()}
                      </td>
                    </>
                  )}
                </tr>
              )) : (
                <tr><td colSpan="5" className="empty-msg">NO DATA IN SUMMARY</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PackingDashboard;