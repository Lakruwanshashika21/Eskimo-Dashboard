import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react'; // Added Wrench
import './MachineDashboard.css';

// Added MAINTAIN color
const STATUS_COLORS = { 
  RUNNING: '#22c55e', 
  IDLE: '#ef4444', 
  MAINTAIN: '#f59e0b' 
};

const MachineDashboard = ({ selectedDay }) => {
  const { machines = [], sections = [], machineTypes = [] } = useApp();
  const [expandedSections, setExpandedSections] = useState([]);
  const [expandedTypes, setExpandedTypes] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredData = useMemo(() => {
    const targetDay = selectedDay || new Date().toISOString().split('T')[0];
    
    return machines.map(m => {
      const s1Valid = m.scans?.scan1?.time?.startsWith(targetDay);
      const s2Valid = m.scans?.scan2?.time?.startsWith(targetDay);
      const s3Valid = m.scans?.scan3?.time?.startsWith(targetDay);

      const s1 = s1Valid ? m.scans.scan1.status : 'OFF';
      const s2 = s2Valid ? m.scans.scan2.status : 'OFF';
      const s3 = s3Valid ? m.scans.scan3.status : 'OFF';

      const isRunningToday = [s1, s2, s3].includes('RUNNING');
      
      // Determine if machine is in Maintenance status
      const isMaintain = m.operationalStatus === 'BREAKDOWN' || m.operationalStatus === 'REMOVED';

      return {
        ...m,
        todayStatus: isMaintain ? 'MAINTAIN' : (isRunningToday ? 'RUNNING' : 'IDLE'),
        todayScans: { s1, s2, s3 },
        isMaintain
      };
    });
  }, [machines, selectedDay]);

  // Updated Grid Stats for 5 KPIs
  const stats = useMemo(() => {
    const total = filteredData.length || 0;
    const maintain = filteredData.filter(m => m.isMaintain).length;
    const activeMachines = filteredData.filter(m => !m.isMaintain);
    
    const running = activeMachines.filter(m => m.todayStatus === 'RUNNING').length;
    const idle = activeMachines.length - running;
    
    // Utilization ignores maintenance units
    const utilization = activeMachines.length > 0 ? Math.round((running / activeMachines.length) * 100) : 0;
    
    return { running, idle, maintain, total, utilization };
  }, [filteredData]);

  const pieData = useMemo(() => [
    { name: 'RUNNING', value: stats.running, color: STATUS_COLORS.RUNNING },
    { name: 'IDLE', value: stats.idle, color: STATUS_COLORS.IDLE },
    { name: 'MAINTAIN', value: stats.maintain, color: STATUS_COLORS.MAINTAIN },
  ], [stats]);

  return (
    <div className="machine-container-native animate-fade">
      {/* 1. TOP KPI GRID - NOW 5 COLUMNS */}
      <div className="dashboard-summary-grid five-cols">
        <div className="kpi-card-machine">
          <p className="kpi-label">TOTAL UNITS</p>
          <p className="kpi-value">{stats.total}</p>
        </div>
        <div className="kpi-card-machine">
          <p className="kpi-label">RUNNING</p>
          <p className="kpi-value text-green">{stats.running}</p>
        </div>
        <div className="kpi-card-machine">
          <p className="kpi-label">IDLE</p>
          <p className="kpi-value text-red">{stats.idle}</p>
        </div>
        <div className="kpi-card-machine">
          <p className="kpi-label">MAINTAIN</p>
          <p className="kpi-value text-amber">{stats.maintain}</p>
        </div>
        <div className="kpi-card-machine">
          <p className="kpi-label">UTILIZATION</p>
          <p className="kpi-value text-blue">{stats.utilization}%</p>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-panel kpi-card-machine">
          <p className="panel-title">Asset Health & Activity</p>
          <div className="pie-container" style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" 
                  innerRadius="60%" outerRadius="85%" 
                  paddingAngle={5} dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hierarchy-panel hierarchy-container">
          <div className="hierarchy-header-row">
            <span>ACTIVITY HIERARCHY</span>
            <div className="header-stats five-stats">
              <span>TOTAL</span>
              <span className="text-green">RUN</span>
              <span className="text-red">IDLE</span>
              <span className="text-amber">MTN</span>
              <span className="text-blue">%</span>
            </div>
          </div>

          <div className="hierarchy-scroll">
            {sections.map(sec => {
              const secMachines = filteredData.filter(m => m.section === sec.id);
              const isExpanded = expandedSections.includes(sec.id);
              
              const secMaintain = secMachines.filter(m => m.isMaintain).length;
              const secActive = secMachines.filter(m => !m.isMaintain);
              const secRunning = secActive.filter(m => m.todayStatus === 'RUNNING').length;
              const secUtil = secActive.length > 0 ? Math.round((secRunning / secActive.length) * 100) : 0;

              return (
                <div key={sec.id} className="section-group">
                  <div className="section-row" onClick={() => setExpandedSections(prev => isExpanded ? prev.filter(i => i !== sec.id) : [...prev, sec.id])}>
                    <div className="flex-center gap-10">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <span className="section-name">{sec.name}</span>
                    </div>
                    <div className="header-stats tabular five-stats">
                      <span>{secMachines.length}</span>
                      <span className="text-green">{secRunning}</span>
                      <span className="text-red">{secActive.length - secRunning}</span>
                      <span className="text-amber">{secMaintain}</span>
                      <span className="text-blue">{secUtil}%</span>
                    </div>
                  </div>

                  {isExpanded && machineTypes.filter(t => t.sectionId === sec.id).map(type => {
                    const typeMachines = secMachines.filter(m => m.type === type.name);
                    const isTypeExpanded = expandedTypes.includes(type.id);
                    
                    const typeMaintain = typeMachines.filter(m => m.isMaintain).length;
                    const typeActive = typeMachines.filter(m => !m.isMaintain);
                    const typeRunning = typeActive.filter(m => m.todayStatus === 'RUNNING').length;
                    const typeUtil = typeActive.length > 0 ? Math.round((typeRunning / typeActive.length) * 100) : 0;

                    return (
                      <div key={type.id} className="type-group">
                        <div className="type-row" onClick={() => setExpandedTypes(prev => isTypeExpanded ? prev.filter(i => i !== type.id) : [...prev, type.id])}>
                          <div className="flex-center gap-10 pl-30">
                            {isTypeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <span className="type-name">{type.name}</span>
                          </div>
                          <div className="header-stats type-stats five-stats">
                            <span>{typeMachines.length}</span>
                            <span className="text-green">{typeRunning}</span>
                            <span className="text-red">{typeActive.length - typeRunning}</span>
                            <span className="text-amber">{typeMaintain}</span>
                            <span>{typeUtil}%</span>
                          </div>
                        </div>

                        {isTypeExpanded && (
                          <div className="machine-list pl-60">
                            {typeMachines.map(m => (
                              <div key={m.id} className="machine-item">
                                <div className="flex-center gap-20">
                                  <span className="machine-id">{m.id}</span>
                                  <span className={`status-text ${m.todayStatus === 'RUNNING' ? 'text-green' : m.todayStatus === 'MAINTAIN' ? 'text-amber' : 'text-red'}`}>
                                    {m.todayStatus}
                                  </span>
                                </div>
                                <div className="scan-group">
                                  {['s1', 's2', 's3'].map(s => (
                                    <div key={s} className={`scan-pill ${m.todayScans[s] === 'RUNNING' ? 'run' : m.todayScans[s] === 'IDLE' ? 'idle' : 'off'}`}>
                                      {s.toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineDashboard;