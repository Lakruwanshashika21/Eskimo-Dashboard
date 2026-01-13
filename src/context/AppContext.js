import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [machines, setMachines] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [sections, setSections] = useState([]);
  const [productionSummary, setProductionSummary] = useState({ plan: 0, actual: 0, balance: 0 });

  useEffect(() => {
    // 1. Live Machines Listener
    const qM = query(collection(db, "machines"));
    const unsubM = onSnapshot(qM, (snap) => {
      setMachines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Machine Types Listener (Fixes the "filter" crash)
    const qT = query(collection(db, "machineTypes"));
    const unsubT = onSnapshot(qT, (snap) => {
      setMachineTypes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Sections Listener (Dynamic Factory Sections)
    const qSec = query(collection(db, "sections"));
    const unsubSec = onSnapshot(qSec, (snap) => {
      setSections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Production Summary Listener
    const unsubS = onSnapshot(doc(db, "factory_stats", "production_summary"), (doc) => {
      if (doc.exists()) {
        setProductionSummary(doc.data());
      }
    });

    // Clean up all listeners on unmount
    return () => { 
      unsubM(); 
      unsubT(); 
      unsubSec();
      unsubS(); 
    };
  }, []);

  return (
    <AppContext.Provider value={{ 
      machines: machines || [], 
      sections: sections || [], 
      machineTypes: machineTypes || [], 
      productionSummary 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);