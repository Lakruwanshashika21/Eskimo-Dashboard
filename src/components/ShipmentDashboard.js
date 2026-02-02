import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Providers } from '@microsoft/mgt-element';

const ShipmentDashboard = ({ viewType }) => {
  const [data, setData] = useState([]);

  const fetchShipments = useCallback(async () => {
    try {
      const graphClient = Providers.globalProvider.graph.client;
      // Using the GUID-based Site ID from your working system
      const siteId = "eskimoknit.sharepoint.com,121c53f7-d617-4ff3-87b3-ffa698e29c90,2e40c08e-a753-4f79-b9d0-769f6e984bb1";
      
      // Range C3:P100 captures Date through Packed Qty
      const endpoint = `/sites/${siteId}/drive/root:/Shipping/Shippment.xlsx:/workbook/worksheets('Sheet1')/range(address='C3:P100')`;
      
      const res = await graphClient.api(endpoint).get();
      if (res.values) setData(res.values);
    } catch (e) { 
      console.error("Critical Shipment Sync Error:", e); 
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const processedShipments = useMemo(() => {
    if (!data || data.length < 2) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = (val) => {
      if (!val) return null;
      const d = !isNaN(val) ? new Date((val - 25569) * 86400 * 1000) : new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    return data.slice(1).map(row => {
      const originalDate = parseDate(row[0]);
      const ext1 = parseDate(row[9]);  // Column L (Extended Date 1)
      const ext2 = parseDate(row[10]); // Column M (Extended Date 2)
      const ext3 = parseDate(row[11]); // Column N (Extended Date 3)
      
      // Prioritize Extended Dates over the Original Date
      const activeDate = ext3 || ext2 || ext1 || originalDate;
      if (!activeDate) return null;

      const qty = parseFloat(row[3]) || 0; // Column F (Qty)
      const packedQty = parseFloat(row[12]) || 0; // Column O (Packed Qty)
      const isComplete = qty === packedQty && qty > 0;
      const shortValue = qty - packedQty;

      return {
        originalDate,
        activeDate,
        orderNo: row[7], // Column J (Order No)
        customer: row[2], // Column E (Customer)
        qty,
        status: isComplete ? "Complete" : `Short: ${shortValue.toLocaleString()}`,
        isComplete
      };
    }).filter(item => {
      if (!item) return false;
      const d = new Date(item.activeDate);
      d.setHours(0,0,0,0);
      
      if (viewType === 'today') {
        return d.getTime() === today.getTime();
      } else {
        const endRange = new Date(today);
        endRange.setDate(today.getDate() + 7);
        return d >= today && d <= endRange;
      }
    }).sort((a, b) => a.activeDate - b.activeDate);
  }, [data, viewType]);

  return (
    <div className="shipment-view-wrapper animate-fade">
      <div className="sub-slide">
        <h2 className="pane-label">
          {viewType === 'today' ? "DAILY SHIPMENT TRACKER" : "7-DAY SHIPMENT FORECAST"}
        </h2>
        {/* Automatic Scroll if more than 8 rows */}
        <div className={`shipment-scroll-box ${processedShipments.length > 8 ? 'marquee-vertical' : ''}`}>
          <table className="split-table">
            <thead>
              <tr>
                {viewType === 'weekly' && <th>ORIGINAL</th>}
                <th>DELIVERY</th>
                <th>ORDER NUMBER</th>
                <th>CUSTOMER</th>
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
                  <td className="tabular">{item.qty.toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${item.isComplete ? 'status-complete' : 'status-pending'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="empty-msg">NO SHIPMENTS SCHEDULED</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDashboard;