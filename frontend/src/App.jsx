import React, { useState, useEffect } from 'react';
import { Activity, Users, Stethoscope, Download, AlertCircle, Clock, Plus, Edit2, Trash2, X, DollarSign, Search, User, Clipboard, Home } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    urgency: 'Major'
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
    setFormData({ type: '', patient_id: '', required_nurses: '2', duration: '60', equipment: 'Standard', urgency: 'Major' });
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
      urgency: s.urgency || 'Major'
    });
    setEditingId(s.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      type: formData.type,
      patient_id: parseInt(formData.patient_id),
      surgeon_id: -1, // Auto-allocated
      required_nurses: parseInt(formData.required_nurses),
      duration: parseInt(formData.duration),
      equipment: formData.equipment,
      urgency: formData.urgency,
      priority: formData.urgency === 'Emergency' ? 1 : formData.urgency === 'Major' ? 2 : 3
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

  const generatePDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header Section
    try {
      // Add Logo (if available in public/logo.png)
      doc.addImage('/logo.png', 'PNG', 14, 10, 30, 15);
    } catch (e) {
      console.warn("Logo not found for PDF");
    }

    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("Episkey HP", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text("Hospital Operation Report", pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 14, 38, { align: 'right' });
    
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);

    let yPos = 55;

    // 1. AI Surgery Priority List
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("1. AI-BASED SURGERY PRIORITY LIST", 14, yPos);
    yPos += 10;

    const sortedSurgeries = [...(data.preference_order || [])];
    
    if (sortedSurgeries.length > 0) {
      sortedSurgeries.forEach((pref, index) => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. Patient ID: ${pref.patient}`, 14, yPos);
        yPos += 6;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const details = [
          `Surgery Type: ${pref.type}`,
          `OT Assigned: ${pref.ot !== -1 ? 'OT-' + pref.ot : 'Pending'}`,
          `Surgeon: ${pref.surgeon || 'Auto-Allocated'}`,
          `Duration: ${pref.duration} minutes`
        ];
        
        details.forEach(line => {
          doc.text(`   ${line}`, 14, yPos);
          yPos += 5;
        });
        
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text(`   Reason: ${pref.reason}`, 14, yPos);
        yPos += 10;
      });
    } else {
      doc.text("No surgeries scheduled.", 14, yPos);
      yPos += 10;
    }

    // 2. Doctor Payroll Report
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("2. DOCTOR PAYROLL REPORT", 14, yPos);
    yPos += 10;

    data.surgeons?.forEach(s => {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`Doctor: ${s.name}`, 14, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const baseSalary = s.salary - (s.overtime_hours * 1.5 * (s.rate || 150)) - (s.bonus_applied === "true" || s.bonus_applied === true ? 1000 : 0);
      const otBonus = s.overtime_hours * 1.5 * (s.rate || 150);
      const surgeryBonus = (s.bonus_applied === "true" || s.bonus_applied === true ? 1000 : 0);

      const rows = [
        `Total Hours: ${s.worked_hours}`,
        `Surgeries Handled: ${s.surgeries_count}`,
        `Base Salary: ₹${baseSalary.toFixed(0)}`,
        `Overtime Bonus: ₹${otBonus.toFixed(0)}`,
        `Surgery Bonus: ₹${surgeryBonus.toFixed(0)}`,
        `Final Salary: ₹${s.salary.toFixed(0)}`
      ];

      rows.forEach(r => {
        doc.text(`   ${r}`, 14, yPos);
        yPos += 5;
      });

      doc.setFont("helvetica", "bold");
      doc.text("   Reason:", 14, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      const reasons = s.payroll_reason.split(' | ');
      reasons.forEach(res => {
        doc.text(`   - ${res}`, 14, yPos);
        yPos += 5;
      });
      yPos += 5;
    });

    // 3. Nurse Payroll Report
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("3. NURSE PAYROLL REPORT", 14, yPos);
    yPos += 10;

    data.nurses?.forEach(n => {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`Nurse: ${n.name}`, 14, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const baseSalary = n.salary - (n.overtime_hours * 1.5 * (n.rate || 100)) - (n.bonus_applied === "true" || n.bonus_applied === true ? 500 : 0);
      const otBonus = n.overtime_hours * 1.5 * (n.rate || 100);
      const surgeryBonus = (n.bonus_applied === "true" || n.bonus_applied === true ? 500 : 0);

      const rows = [
        `Total Hours: ${n.worked_hours}`,
        `Surgeries Assisted: ${n.surgeries_count}`,
        `Base Salary: ₹${baseSalary.toFixed(0)}`,
        `Overtime Bonus: ₹${otBonus.toFixed(0)}`,
        `Surgery Bonus: ₹${surgeryBonus.toFixed(0)}`,
        `Final Salary: ₹${n.salary.toFixed(0)}`
      ];

      rows.forEach(r => {
        doc.text(`   ${r}`, 14, yPos);
        yPos += 5;
      });

      doc.setFont("helvetica", "bold");
      doc.text("   Reason:", 14, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      const reasons = n.payroll_reason.split(' | ');
      reasons.forEach(res => {
        doc.text(`   - ${res}`, 14, yPos);
        yPos += 5;
      });
      yPos += 5;
    });

    // Footer & Page Numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Generated by Episkey HP System", 14, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    doc.save("Episkey_Hospital_Report.pdf");
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
                <th>ID</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Surgeon</th>
                <th>Duration</th>
                <th>OT</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.surgeries?.map(s => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td><button className="btn" style={{padding: '4px', background: 'transparent', color: 'var(--primary)', textDecoration: 'underline'}} onClick={() => { setSearchPatientId(s.patient); setActiveTab('patient_portal'); }}>PT-{s.patient || s.patient_id}</button></td>
                  <td>{s.type ? s.type.replace(/_/g, ' ') : 'Unknown'} {s.urgency === 'Emergency' && <span className="badge priority-1">Emergency</span>}</td>
                  <td>{s.surgeon ? s.surgeon.replace(/_/g, ' ') : 'Pending'}</td>
                  <td><Clock size={14} style={{display: 'inline', marginRight: 4}}/>{s.duration}m</td>
                  <td><span className={`badge ${s.ot !== -1 ? 'ot' : 'ot unassigned'}`}>{s.ot !== -1 ? `OT ${s.ot}` : 'N/A'}</span></td>
                  <td>{s.ot !== -1 ? `${formatTime(s.start_slot)} - ${formatTime(s.end_slot)}` : 'Pending'}</td>
                  <td>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button className="btn" style={{padding: '6px', background: 'transparent', color: 'var(--primary)'}} onClick={() => openEditModal(s)}><Edit2 size={16} /></button>
                      <button className="btn" style={{padding: '6px', background: 'transparent', color: 'var(--danger)'}} onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <div style={{fontWeight: '700'}}>{patientDetails.type}</div>
              <div style={{color: '#666'}}>{patientDetails.ot !== -1 ? `OT ${patientDetails.ot}` : 'Unassigned'}</div>
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

        <button className="btn btn-primary" onClick={generatePDF}><Download size={18} /> Export Full Report</button>
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
              <input style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}} required name="type" placeholder="Surgery Type" value={formData.type} onChange={handleInputChange} />
              <input style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}} required type="number" name="patient_id" placeholder="Patient ID" value={formData.patient_id} onChange={handleInputChange} />
              <input style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}} required type="number" name="duration" placeholder="Duration (mins)" value={formData.duration} onChange={handleInputChange} />
              <select style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}} name="urgency" value={formData.urgency} onChange={handleInputChange}>
                <option value="Emergency">Emergency</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>
              <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>{editingId ? 'Save Changes' : 'Add Surgery'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
