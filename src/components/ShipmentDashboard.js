import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Providers } from '@microsoft/mgt-element';

const ShipmentDashboard = ({ viewType, selectedDay }) => {
  const [data, setData] = useState([]);

  const fetchShipments = useCallback(async () => {
    try {
      const graphClient = Providers.globalProvider.graph.client;
      const siteId = "eskimoknit.sharepoint.com,121c53f7-d617-4ff3-87b3-ffa698e29c90,2e40c08e-a753-4f79-b9d0-769f6e984bb1";
      // Range C3:P500 captures Date(C) through Packed Qty(O) and Short(P)
      const endpoint = `/sites/${siteId}/drive/root:/Shipping/Shippment.xlsx:/workbook/worksheets('Sheet1')/range(address='C3:P500')`;
      
      const res = await graphClient.api(endpoint).get();
      if (res.values) setData(res.values);
    } catch (e) { 
      console.error("Shipment Data Sync Error:", e); 
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const processedShipments = useMemo(() => {
    if (!data || data.length < 2) return [];
    
    const refDay = selectedDay ? new Date(selectedDay) : new Date();
    refDay.setHours(0, 0, 0, 0);

    const parseFlexibleDate = (val) => {
      if (!val || val === "" || val === "NaN") return null;
      // Support for Excel Serial Numbers and Text-based dates like "5-Feb-26"
      const d = !isNaN(val) && typeof val === 'number' 
        ? new Date((parseFloat(val) - 25569) * 86400 * 1000) 
        : new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    return data.slice(1).map(row => {
      const originalDate = parseFlexibleDate(row[0]); // Column C
      const ext1 = parseFlexibleDate(row[9]);        // Column L
      const ext2 = parseFlexibleDate(row[10]);       // Column M
      const ext3 = parseFlexibleDate(row[11]);       // Column N
      
      // Use the latest extension available, otherwise original
      const activeDate = ext3 || ext2 || ext1 || originalDate;
      if (!activeDate) return null;

      const qty = parseFloat(row[3]?.toString().replace(/,/g, '')) || 0;       // Column F
      const packedQty = parseFloat(row[12]?.toString().replace(/,/g, '')) || 0; // Column O
      const isComplete = qty > 0 && packedQty >= qty;
      const shortAmount = Math.max(0, qty - packedQty);

      return {
        originalDate,
        activeDate,
        eskArticle: row[6], // Column I: ESK.ARTICLE
        orderNo: row[7],    // Column J: ORDER NO
        customer: row[2],   // Column E: Customer
        qty,
        isComplete,
        status: isComplete ? "Complete" : `Short: ${shortAmount.toLocaleString()}`
      };
    }).filter(item => {
      if (!item) return false;
      const d = new Date(item.activeDate);
      d.setHours(0,0,0,0);
      
      if (viewType === 'today') {
        return d.getTime() === refDay.getTime();
      } else {
        const endRange = new Date(refDay);
        endRange.setDate(refDay.getDate() + 7);
        return d >= refDay && d <= endRange;
      }
    }).sort((a, b) => a.activeDate - b.activeDate);
  }, [data, viewType, selectedDay]);

  return (
    <div className="shipment-view-wrapper animate-fade">
      <div className="sub-slide">
        <h2 className="pane-label">
          {viewType === 'today' ? "DAILY SHIPMENT TRACKER" : "7-DAY SHIPMENT FORECAST"}
        </h2>
        {/* The scroll box now contains a table with a frozen header */}
        <div className="shipment-scroll-box">
          <table className={`split-table ${processedShipments.length > 8 ? 'marquee-vertical' : ''}`}>
            <thead>
              <tr>
                {viewType === 'weekly' && <th>ORIGINAL</th>}
                <th>DELIVERY</th>
                <th>ORDER NUMBER</th>
                <th>CUSTOMER</th>
                <th>ARTICLE</th>
                <th>QTY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {processedShipments.length > 0 ? processedShipments.map((item, i) => (
                <tr key={i}>
                  {viewType === 'weekly' && (
                    <td className="tabular text-dim">{item.originalDate?.toLocaleDateString('en-GB')}</td>
                  )}
                  <td className="tabular">{item.activeDate.toLocaleDateString('en-GB')}</td>
                  <td className="tabular text-blue">{item.orderNo}</td>
                  <td>{item.customer}</td>
                  <td className="tabular">{item.eskArticle}</td>
                  <td className="tabular">{item.qty.toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${item.isComplete ? 'status-complete' : 'status-pending'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={viewType === 'weekly' ? "7" : "6"} className="empty-msg">
                    NO SHIPMENTS SCHEDULED
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDashboard;