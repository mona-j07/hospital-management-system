import React, { useState, useEffect } from 'react';
import { Activity, Users, Stethoscope, Download, AlertCircle, Clock, Plus, Edit2, Trash2, X, DollarSign, Search, User, Clipboard, Home } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const rawUrl = import.meta.env.VITE_API_URL || 'https://hospital-management-system-my4q.onrender.com/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

const App = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [searchPatientId, setSearchPatientId] = useState('');
  const [patientDetails, setPatientDetails] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    patient_id: '',
    required_nurses: '2',
    duration: '60',
    equipment: 'Standard',
    urgency: 'Major',
    date: '',
    startTime: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/data`);
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormData({ type: '', patient_id: '', required_nurses: '2', duration: '60', equipment: 'Standard', urgency: 'Major', date: '', startTime: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setFormData({
      type: s.type,
      patient_id: s.patient || s.patient_id || '',
      required_nurses: s.required_nurses || '2', 
      duration: s.duration,
      equipment: s.equipment || 'Standard',
      urgency: s.urgency || 'Major',
      date: s.date || '',
      startTime: s.startTime || (s.start_slot !== -1 ? formatTime(s.start_slot) : '')
    });
    setEditingId(s.id);
    setIsModalOpen(true);
  };

  const calculateEndTime = (startTime, duration) => {
    let [h, m] = startTime.split(":").map(Number);
    let totalMinutes = h * 60 + m + parseInt(duration);
    let endH = Math.floor(totalMinutes / 60);
    let endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const timeToSlot = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h * 2) + (m >= 30 ? 1 : 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDATION
    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(0,0,0,0);

    if (selectedDate < today) {
      alert("Cannot schedule surgery in the past");
      return;
    }

    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString()) {
      const [h, m] = formData.startTime.split(":").map(Number);
      if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) {
        alert("Select a future time for today's surgery");
        return;
      }
    }

    const endTime = calculateEndTime(formData.startTime, formData.duration);
    const startSlot = timeToSlot(formData.startTime);
    const endSlot = timeToSlot(endTime);

    // Overlap checks (Local check before API)
    const hasOverlap = data.surgeries.some(s => {
      if (s.id === editingId) return false;
      if (s.date === formData.date && s.ot !== -1) {
        // Simple slot overlap check
        return (startSlot < s.end_slot && endSlot > s.start_slot);
      }
      return false;
    });

    // Note: OT assignment is still handled by backend unless we want to manual override.
    // For now, let's pass the date and time to the backend.

    const payload = {
      type: formData.type,
      patient_id: parseInt(formData.patient_id),
      surgeon_id: -1, 
      required_nurses: parseInt(formData.required_nurses),
      duration: parseInt(formData.duration),
      equipment: formData.equipment,
      urgency: formData.urgency,
      priority: formData.urgency === 'Emergency' ? 1 : formData.urgency === 'Major' ? 2 : 3,
      date: formData.date,
      startTime: formData.startTime,
      endTime: endTime,
      start_slot: startSlot,
      end_slot: endSlot
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/surgeries/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/surgeries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      const newData = await res.json();
      setData(newData);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this surgery?")) return;
    try {
      const res = await fetch(`${API_URL}/surgeries/${id}`, { method: 'DELETE' });
      const newData = await res.json();
      setData(newData);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleOTMaintenance = async (id, currentStatus) => {
    try {
      const isCurrentlyAvail = currentStatus === 'true' || currentStatus === true;
      const res = await fetch(`${API_URL}/ots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !isCurrentlyAvail })
      });
      const newData = await res.json();
      setData(newData);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (slot) => {
    if (slot === -1) return 'N/A';
    const hours = Math.floor(slot / 2);
    const mins = (slot % 2) === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${mins}`;
  };

  const generateReport = () => {
    const formatDate = (dateStr) => {
      if (!dateStr) return 'Pending';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (!data || !data.surgeries) {
      alert("No data available for report generation.");
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // 1. HEADER SECTION
    // Add Branded Logo (Medium Size)
    try {
      doc.addImage('/logo.png', 'PNG', 14, 5, 40, 35);
    } catch (e) {
      console.warn("Logo not found");
    }

    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("Episkey HP", pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Hospital Management System", pageWidth / 2, 26, { align: 'center' });
    
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Hospital Operation Report", pageWidth / 2, 42, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 14, 48, { align: 'right' });

    let yPos = 55;

    // 2. SURGERY PRIORITY LIST (TABLE)
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("1. SURGERY PRIORITY LIST (AI BASED)", 14, yPos);
    yPos += 5;

    const surgeryData = (data.preference_order || []).map((pref, index) => {
      const fullSurgery = data.surgeries.find(s => s.patient === pref.patient || s.patient_id === pref.patient);
      return [
        index + 1,
        pref.patient || "Not Assigned",
        formatDate(fullSurgery?.date),
        fullSurgery ? `${fullSurgery.startTime || formatTime(fullSurgery.start_slot)} - ${fullSurgery.endTime || formatTime(fullSurgery.end_slot)}` : "Not Assigned",
        pref.ot !== -1 ? `OT-${pref.ot}` : "Not Assigned",
        pref.surgeon || "Not Assigned"
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Priority', 'Patient ID', 'Date', 'Time', 'OT', 'Surgeon']],
      body: surgeryData,
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc).lastAutoTable.finalY + 15;

    // 3. DOCTOR PAYROLL (TABLE)
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("2. DOCTOR PAYROLL REPORT", 14, yPos);
    yPos += 5;

    const doctorsWithWork = (data.surgeons || []).filter(s => s.worked_hours > 0 || s.surgeries_count > 0);
    const doctorData = doctorsWithWork.map(s => {
      const rate = 1000 + (s.experience * 50);
      const otBonus = s.overtime_hours * rate * 1.5;
      const surgeryBonus = (s.bonus_applied === "true" || s.bonus_applied === true ? 2000 : 0);
      const basePay = s.salary - otBonus - surgeryBonus;
      
      const reasons = s.payroll_reason ? s.payroll_reason.split(' | ') : [];
      const reasonSummary = reasons.map(r => `• ${r}`).join('\n');

      return [
        s.name || "Not Assigned",
        `${s.worked_hours}h`,
        s.surgeries_count,
        `₹${basePay.toFixed(0)}`,
        `₹${otBonus.toFixed(0)}`,
        `₹${surgeryBonus.toFixed(0)}`,
        `₹${s.salary.toFixed(0)}`,
        reasonSummary || "Not Assigned"
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Name', 'Hours', 'Surgeries', 'Base Pay', 'Overtime Pay', 'Bonus', 'Final Pay', 'Reason']],
      body: doctorData,
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 7: { cellWidth: 40 } },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc).lastAutoTable.finalY + 15;

    // 4. NURSE PAYROLL (TABLE)
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("3. NURSE PAYROLL REPORT", 14, yPos);
    yPos += 5;

    const nursesWithWork = (data.nurses || []).filter(n => n.worked_hours > 0 || n.surgeries_count > 0);
    const nurseData = nursesWithWork.map(n => {
      const rate = 200 + (n.experience * 20);
      const otBonus = n.overtime_hours * rate * 1.5;
      const surgeryBonus = (n.bonus_applied === "true" || n.bonus_applied === true ? 800 : 0);
      const basePay = n.salary - otBonus - surgeryBonus;
      
      const reasons = n.payroll_reason ? n.payroll_reason.split(' | ') : [];
      const reasonSummary = reasons.map(r => `• ${r}`).join('\n');

      return [
        n.name || "Not Assigned",
        `${n.worked_hours}h`,
        n.surgeries_count,
        `₹${basePay.toFixed(0)}`,
        `₹${otBonus.toFixed(0)}`,
        `₹${surgeryBonus.toFixed(0)}`,
        `₹${n.salary.toFixed(0)}`,
        reasonSummary || "Not Assigned"
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Name', 'Hours', 'Surgeries', 'Base Pay', 'Overtime Pay', 'Bonus', 'Final Pay', 'Reason']],
      body: nurseData,
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 7: { cellWidth: 40 } },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 }
    });

    // 5. FOOTER
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("-----------------------------------------------------------------------------------------------------------------------------------------------------------------", 14, pageHeight - 15);
      doc.text("Generated by Episkey HP System", 14, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    doc.save("Episkey_HP_Report.pdf");
  };

  const handlePatientSearch = (e) => {
    e.preventDefault();
    const pid = parseInt(searchPatientId);
    const surgery = data.surgeries.find(s => s.patient === pid || s.patient_id === pid);
    if (surgery) {
      const surgeon = data.surgeons.find(s => s.name === surgery.surgeon);
      const nurses = data.nurses.filter(n => surgery.assigned_nurses.includes(n.name));
      setPatientDetails({
        ...surgery,
        surgeonDetails: surgeon,
        nurseDetails: nurses
      });
    } else {
      setPatientDetails(null);
      alert("Patient ID not found");
    }
  };

  if (loading) {
    return <div className="loading" style={{textAlign: 'center', marginTop: '20vh', fontSize: '24px', color: '#0052cc'}}>Loading Episkey HP Data...</div>;
  }
  
  if (!data || data.error) {
    return (
      <div style={{textAlign: 'center', marginTop: '20vh', color: 'red'}}>
        <h2>Error Loading Data</h2>
        <p>{data?.error || "Failed to connect to the backend API."}</p>
        <button onClick={fetchData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  const renderAIList = () => (
    <div className="glass-panel fade-in">
      <h2 className="page-title">AI Preference List</h2>
      <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
        {data.preference_order?.map((pref, i) => (
          <div key={i} style={{padding: '16px', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', borderLeft: pref.type === 'Emergency' ? '4px solid red' : pref.type === 'Major' ? '4px solid orange' : '4px solid green'}}>
            <h3 style={{margin: '0 0 8px 0'}}>
              {i + 1}. Patient {pref.patient} ({pref.type})
            </h3>
            <p style={{margin: 0, color: '#555'}}><strong>Reasoning:</strong> {pref.reason}</p>
            <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#888'}}>Priority Score: {pref.score.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="fade-in">
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon"><Activity size={24} /></div>
          <div><div className="stat-value">{data.surgeries?.length || 0}</div><div className="stat-label">Total Surgeries</div></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon"><Stethoscope size={24} /></div>
          <div><div className="stat-value">{data.surgeons?.length || 0}</div><div className="stat-label">Active Surgeons</div></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div><div className="stat-value">{data.nurses?.length || 0}</div><div className="stat-label">Available Nurses</div></div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div><div className="stat-value">₹{[...data.surgeons, ...data.nurses].reduce((acc, s) => acc + s.salary, 0).toLocaleString()}</div><div className="stat-label">Total Payroll</div></div>
        </div>
      </div>

      <div className="glass-panel" style={{marginBottom: '32px'}}>
        <h2 className="page-title">
          OT Schedule
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Add Surgery
            </button>
            <button className="btn btn-danger" onClick={fetchData}>
              <AlertCircle size={18} /> Refresh
            </button>
          </div>
        </h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>OT</th>
                <th>Surgeon</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.surgeries?.map(s => {
                const isToday = s.date === new Date().toISOString().split('T')[0];
                return (
                  <tr key={s.id} style={{background: isToday ? 'rgba(0, 82, 204, 0.05)' : 'inherit'}}>
                    <td>
                      <div style={{display: 'flex', flexDirection: 'column'}}>
                        <button className="btn" style={{padding: '0', background: 'transparent', color: 'var(--primary)', textDecoration: 'underline', textAlign: 'left'}} onClick={() => { setSearchPatientId(s.patient); setActiveTab('patient_portal'); }}>PT-{s.patient || s.patient_id}</button>
                        {isToday && <span className="badge" style={{fontSize: '9px', background: 'var(--primary)', color: 'white', padding: '2px 4px', width: 'fit-content'}}>Today</span>}
                        <span style={{fontSize: '11px', color: '#888'}}>{s.type?.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                  <td style={{fontWeight: '500'}}>{s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <Clock size={14} color="#666" />
                      {s.ot !== -1 ? `${s.startTime || formatTime(s.start_slot)} - ${s.endTime || formatTime(s.end_slot)}` : 'Pending'}
                    </div>
                  </td>
                  <td><span className={`badge ${s.ot !== -1 ? 'ot' : 'ot unassigned'}`}>{s.ot !== -1 ? `OT ${s.ot}` : 'N/A'}</span></td>
                  <td>{s.surgeon ? s.surgeon.replace(/_/g, ' ') : 'Pending'}</td>
                  <td>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button className="btn" style={{padding: '6px', background: 'transparent', color: 'var(--primary)'}} onClick={() => openEditModal(s)}><Edit2 size={16} /></button>
                      <button className="btn" style={{padding: '6px', background: 'transparent', color: 'var(--danger)'}} onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {renderAIList()}
    </div>
  );

  const renderPayroll = () => {
    const staff = [...data.surgeons, ...data.nurses];
    return (
      <div className="glass-panel fade-in">
        <h2 className="page-title">Payroll Dashboard</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Hours</th>
                <th>Overtime</th>
                <th>Surgeries</th>
                <th>Salary</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s, i) => (
                <tr key={i}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.position || (s.max_hours ? 'Surgeon' : 'Nurse')}</td>
                  <td>{s.worked_hours}h</td>
                  <td>
                    <span style={{color: s.overtime_hours > 0 ? 'var(--warning)' : 'inherit', fontWeight: s.overtime_hours > 0 ? '700' : 'normal'}}>
                      {s.overtime_hours}h
                    </span>
                  </td>
                  <td>{s.surgeries_count}</td>
                  <td>
                    <span style={{color: s.bonus_applied === "true" || s.bonus_applied === true ? 'var(--success)' : 'inherit', fontWeight: '700'}}>
                      ₹{s.salary.toLocaleString()}
                    </span>
                  </td>
                  <td style={{fontSize: '0.85rem', color: 'var(--text-light)', maxWidth: '300px'}}>{s.payroll_reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPatientPortal = () => (
    <div className="fade-in">
      <div className="glass-panel" style={{marginBottom: '24px'}}>
        <h2 className="page-title">Patient Portal</h2>
        <form onSubmit={handlePatientSearch} style={{display: 'flex', gap: '12px'}}>
          <div style={{position: 'relative', flex: 1}}>
            <Search style={{position: 'absolute', left: 12, top: 10, color: '#888'}} size={20} />
            <input 
              style={{padding: '10px 10px 10px 40px', width: '100%', borderRadius: '8px', border: '1px solid #ccc'}} 
              placeholder="Enter Patient ID (e.g. 101)" 
              value={searchPatientId}
              onChange={(e) => setSearchPatientId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search Details</button>
        </form>
      </div>

      {patientDetails && (
        <div className="glass-panel fade-in" style={{background: 'white'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '16px', marginBottom: '24px'}}>
            <div>
              <h3 style={{fontSize: '1.5rem', color: 'var(--primary)'}}>Patient ID: {patientDetails.patient}</h3>
              <span className={`badge ${patientDetails.ot !== -1 ? 'priority-3' : 'priority-2'}`}>
                {patientDetails.ot !== -1 ? 'Status: Scheduled' : 'Status: Pending'}
              </span>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: '700'}}>Surgery Name</div>
              <div style={{fontWeight: '700', fontSize: '1.2rem', color: 'var(--primary)'}}>{patientDetails.type ? patientDetails.type.replace(/_/g, ' ') : 'N/A'}</div>
              <div style={{color: '#666', marginTop: '4px'}}>{patientDetails.ot !== -1 ? `OT ${patientDetails.ot}` : 'Unassigned'}</div>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>
            <div>
              <h4 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#444'}}><Stethoscope size={18} /> Surgeon Information</h4>
              <div style={{padding: '16px', background: '#f8f9fa', borderRadius: '12px'}}>
                <p><strong>Name:</strong> {patientDetails.surgeon}</p>
                <p><strong>Specialization:</strong> {patientDetails.surgeonDetails?.specialization || 'General Surgery'}</p>
                <p><strong>Experience:</strong> {patientDetails.surgeonDetails?.experience || '10'} years</p>
              </div>
            </div>
            <div>
              <h4 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#444'}}><Users size={18} /> Nurse Team</h4>
              <div style={{padding: '16px', background: '#f8f9fa', borderRadius: '12px'}}>
                {patientDetails.nurseDetails?.length > 0 ? patientDetails.nurseDetails.map((n, i) => (
                  <div key={i} style={{marginBottom: i < patientDetails.nurseDetails.length - 1 ? '8px' : 0}}>
                    <strong>{n.name}</strong> ({n.specialization})
                  </div>
                )) : <p>Assigned: {patientDetails.assigned_nurses.join(', ')}</p>}
              </div>
            </div>
          </div>

          <div style={{marginTop: '24px', padding: '16px', background: 'rgba(0, 82, 204, 0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'space-around'}}>
            <div><strong>Duration:</strong> {patientDetails.duration} minutes</div>
            <div><strong>Time Slot:</strong> {formatTime(patientDetails.start_slot)} - {formatTime(patientDetails.end_slot)}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{paddingBottom: '50px'}}>
      <nav className="glass-nav">
        <div className="header-title" onClick={() => setActiveTab('dashboard')} style={{cursor: 'pointer'}}><Activity size={28} /> Episkey HP</div>
        
        <div style={{display: 'flex', gap: '40px'}}>
          <div>
            <div style={{fontSize: '0.7rem', fontWeight: '800', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px'}}>Hospital Management</div>
            <div className="nav-links">
              <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Home size={16} style={{marginRight: 6, display: 'inline'}}/>Dashboard</div>
              <div className={`nav-item ${activeTab === 'surgeons' ? 'active' : ''}`} onClick={() => setActiveTab('surgeons')}>Surgeons</div>
              <div className={`nav-item ${activeTab === 'nurses' ? 'active' : ''}`} onClick={() => setActiveTab('nurses')}>Nurses</div>
              <div className={`nav-item ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => setActiveTab('payroll')}><DollarSign size={16} style={{marginRight: 6, display: 'inline'}}/>Payroll</div>
              <div className={`nav-item ${activeTab === 'ots' ? 'active' : ''}`} onClick={() => setActiveTab('ots')}>OTs</div>
              <div className={`nav-item ${activeTab === 'ai_list' ? 'active' : ''}`} onClick={() => setActiveTab('ai_list')}><Clipboard size={16} style={{marginRight: 6, display: 'inline'}}/>AI List</div>
            </div>
          </div>

          <div style={{borderLeft: '1px solid #ddd', paddingLeft: '40px'}}>
            <div style={{fontSize: '0.7rem', fontWeight: '800', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px'}}>Patient Services</div>
            <div className="nav-links">
              <div className={`nav-item ${activeTab === 'patient_portal' ? 'active' : ''}`} onClick={() => setActiveTab('patient_portal')}><Search size={16} style={{marginRight: 6, display: 'inline'}}/>Patient Portal</div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={generateReport}><Download size={18} /> Export Full Report</button>
      </nav>

      <div className="container">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'payroll' && renderPayroll()}
        {activeTab === 'patient_portal' && renderPatientPortal()}
        {activeTab === 'ai_list' && renderAIList()}
        
        {activeTab === 'surgeons' && (
          <div className="glass-panel fade-in">
            <h2 className="page-title">Surgeon Management</h2>
            <table>
              <thead><tr><th>Name</th><th>Position</th><th>Specialization</th><th>Experience</th><th>Surgeries</th><th>Hours</th></tr></thead>
              <tbody>
                {data.surgeons?.map(s => <tr key={s.id}><td>{s.name}</td><td>{s.position}</td><td>{s.specialization}</td><td>{s.experience} yrs</td><td>{s.surgeries_count}</td><td>{s.worked_hours} hrs</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'nurses' && (
          <div className="glass-panel fade-in">
            <h2 className="page-title">Nurse Management</h2>
            <table>
              <thead><tr><th>Name</th><th>Position</th><th>Specialization</th><th>Experience</th><th>Worked Hours</th></tr></thead>
              <tbody>
                {data.nurses?.map(n => <tr key={n.id}><td>{n.name}</td><td>{n.position}</td><td>{n.specialization}</td><td>{n.experience} yrs</td><td>{n.worked_hours} hrs</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ots' && (
          <div className="glass-panel fade-in">
            <h2 className="page-title">Operation Theaters</h2>
            <table>
              <thead><tr><th>OT ID</th><th>Name</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {data.ots?.map(ot => (
                  <tr key={ot.id}>
                    <td>OT {ot.id}</td>
                    <td>{ot.name}</td>
                    <td>{ot.type}</td>
                    <td><span className={`badge ${ot.is_available === 'true' || ot.is_available === true ? 'ot' : 'ot unassigned'}`}>{ot.is_available === 'true' || ot.is_available === true ? 'Available' : 'Maintenance'}</span></td>
                    <td>
                      <button className={`btn ${ot.is_available === 'true' || ot.is_available === true ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleOTMaintenance(ot.id, ot.is_available)}>
                        {ot.is_available === 'true' || ot.is_available === true ? 'Mark Maintenance' : 'Mark Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="glass-panel fade-in" style={{background: 'white', width: '400px', maxWidth: '90%'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3>{editingId ? 'Edit Surgery' : 'Add Surgery'}</h3>
              <button style={{background: 'transparent', border: 'none', cursor: 'pointer'}} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="form-group">
                  <label style={{fontSize: '12px', fontWeight: '700', color: '#666'}}>Surgery Type</label>
                  <input style={{padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc'}} required name="type" placeholder="e.g. Heart Surgery" value={formData.type} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label style={{fontSize: '12px', fontWeight: '700', color: '#666'}}>Patient ID</label>
                  <input style={{padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc'}} required type="number" name="patient_id" placeholder="101" value={formData.patient_id} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="form-group">
                  <label style={{fontSize: '12px', fontWeight: '700', color: '#666'}}>Surgery Date</label>
                  <input id="surgeryDate" style={{padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc'}} required type="date" name="date" value={formData.date} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label style={{fontSize: '12px', fontWeight: '700', color: '#666'}}>Start Time</label>
                  <input id="startTime" style={{padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc'}} required type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="form-group">
                  <label style={{fontSize: '12px', fontWeight: '700', color: '#666'}}>Duration (mins)</label>
                  <input style={{padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc'}} required type="number" name="duration" placeholder="60" value={formData.duration} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label style={{fontSize: '12px', fontWeight: '700', color: '#666'}}>Urgency</label>
                  <select style={{padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc'}} name="urgency" value={formData.urgency} onChange={handleInputChange}>
                    <option value="Emergency">Emergency</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>{editingId ? 'Save Changes' : 'Schedule Surgery'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
