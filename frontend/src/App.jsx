import React, { useState, useEffect } from 'react';
import { Activity, Users, Stethoscope, Download, AlertCircle, Clock, Plus, Edit2, Trash2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://hospital-management-system-my4q.onrender.com/api';

const App = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

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
      required_nurses: '2', 
      duration: s.duration,
      equipment: 'Standard',
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
    doc.setFontSize(22);
    doc.setTextColor(0, 82, 204);
    doc.text("Hospital Management Report", 14, 20);
    let yPos = 30;

    doc.setFontSize(16);
    doc.setTextColor(23, 43, 77);
    doc.text("Surgeon Report", 14, yPos);
    yPos += 10;
    const surgeonBody = data.surgeons.map(s => [s.name, s.surgeries_count.toString(), `${s.worked_hours} hrs`, `₹${s.salary.toFixed(2)}`]);
    doc.autoTable({ startY: yPos, head: [['Name', 'Surgeries', 'Hours', 'Salary']], body: surgeonBody, headStyles: { fillColor: [0, 82, 204] } });
    yPos = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(16);
    doc.text("Nurse Report", 14, yPos);
    yPos += 10;
    const nurseBody = data.nurses.map(n => [n.name, 'N/A', `${n.worked_hours} hrs`, `₹${n.salary.toFixed(2)}`]);
    doc.autoTable({ startY: yPos, head: [['Name', 'Surgeries', 'Hours', 'Salary']], body: nurseBody, headStyles: { fillColor: [0, 184, 217] } });
    yPos = doc.lastAutoTable.finalY + 20;

    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFontSize(16);
    doc.text("Patient Report", 14, yPos);
    yPos += 10;
    const patientBody = data.surgeries.map(s => [s.patient.toString(), s.type, s.ot !== -1 ? `OT ${s.ot}` : 'Unassigned', `${s.duration} min`]);
    doc.autoTable({ startY: yPos, head: [['Patient ID', 'Surgery', 'OT', 'Duration']], body: patientBody, headStyles: { fillColor: [54, 179, 126] } });
    doc.save("hospital_report.pdf");
  };

  if (loading) {
    return <div className="loading" style={{textAlign: 'center', marginTop: '20vh', fontSize: '24px', color: '#0052cc'}}>Loading Hospital Data...</div>;
  }
  
  if (!data || data.error) {
    return (
      <div style={{textAlign: 'center', marginTop: '20vh', color: 'red'}}>
        <h2>Error Loading Data</h2>
        <p>{data?.error || "Failed to connect to the backend API. Please check your network or backend server."}</p>
        <button onClick={fetchData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

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
      </div>

      <div className="glass-panel">
        <h2 className="page-title">
          OT Schedule
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Add Surgery
            </button>
            <button className="btn btn-danger" onClick={fetchData}>
              <AlertCircle size={18} /> Refresh / Simulate
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
                  <td><button className="btn" style={{padding: '4px', background: 'transparent', color: 'var(--primary)', textDecoration: 'underline'}} onClick={() => setSelectedSurgery(s)}>PT-{s.patient || s.patient_id}</button></td>
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
    </div>
  );

  return (
    <div>
      <nav className="glass-nav">
        <div className="header-title"><Activity size={28} /> MedCore System</div>
        <div className="nav-links">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</div>
          <div className={`nav-item ${activeTab === 'surgeons' ? 'active' : ''}`} onClick={() => setActiveTab('surgeons')}>Surgeons</div>
          <div className={`nav-item ${activeTab === 'nurses' ? 'active' : ''}`} onClick={() => setActiveTab('nurses')}>Nurses</div>
          <div className={`nav-item ${activeTab === 'ots' ? 'active' : ''}`} onClick={() => setActiveTab('ots')}>OTs</div>
          <div className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>Patients</div>
          <div className={`nav-item ${activeTab === 'ai_list' ? 'active' : ''}`} onClick={() => setActiveTab('ai_list')}>AI Preference List</div>
        </div>
        <button className="btn btn-primary" onClick={generatePDF}><Download size={18} /> Export Reports</button>
      </nav>

      <div className="container">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'surgeons' && (
          <div className="glass-panel fade-in">
            <h2 className="page-title">Surgeon Management</h2>
            <table>
              <thead><tr><th>Name</th><th>Position</th><th>Specialization</th><th>Experience</th><th>Surgeries</th><th>Duration</th><th>Salary</th></tr></thead>
              <tbody>
                {data.surgeons?.map(s => <tr key={s.id}><td>{s.name.replace(/_/g, ' ')}</td><td>{s.position.replace(/_/g, ' ')}</td><td>{s.specialization.replace(/_/g, ' ')}</td><td>{s.experience} yrs</td><td>{s.surgeries_count}</td><td>{s.worked_hours} hrs</td><td>₹{s.salary.toFixed(2)}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'nurses' && (
          <div className="glass-panel fade-in">
            <h2 className="page-title">Nurse Management</h2>
            <table>
              <thead><tr><th>Name</th><th>Position</th><th>Specialization</th><th>Experience</th><th>Worked Hours</th><th>Salary</th></tr></thead>
              <tbody>
                {data.nurses?.map(n => <tr key={n.id}><td>{n.name.replace(/_/g, ' ')}</td><td>{n.position.replace(/_/g, ' ')}</td><td>{n.specialization.replace(/_/g, ' ')}</td><td>{n.experience} yrs</td><td>{n.worked_hours} hrs</td><td>₹{n.salary.toFixed(2)}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'patients' && (
          <div className="glass-panel fade-in">
            <h2 className="page-title">Patient View</h2>
            <table>
              <thead><tr><th>Patient ID</th><th>Surgery Type</th><th>Assigned OT</th><th>Duration</th></tr></thead>
              <tbody>
                {data.surgeries?.map(s => <tr key={s.id}><td><button className="btn" style={{padding: '4px', background: 'transparent', color: 'var(--primary)', textDecoration: 'underline'}} onClick={() => setSelectedSurgery(s)}>PT-{s.patient || s.patient_id}</button></td><td>{s.type}</td><td><span className={`badge ${s.ot !== -1 ? 'ot' : 'ot unassigned'}`}>{s.ot !== -1 ? `OT ${s.ot}` : 'Unassigned'}</span></td><td>{s.duration} mins</td></tr>)}
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
                    <td>{ot.name.replace(/_/g, ' ')}</td>
                    <td>{ot.type.replace(/_/g, ' ')}</td>
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
        {activeTab === 'ai_list' && (
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
        )}
      </div>

      {selectedSurgery && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="glass-panel fade-in" style={{background: 'white', width: '450px', maxWidth: '90%', padding: '24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3>Surgery Details (PT-{selectedSurgery.patient || selectedSurgery.patient_id})</h3>
              <button style={{background: 'transparent', border: 'none', cursor: 'pointer'}} onClick={() => setSelectedSurgery(null)}><X size={20} /></button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px'}}>
              <p><strong>Surgery Type:</strong> {selectedSurgery.type}</p>
              <p><strong>Duration:</strong> {selectedSurgery.duration} mins</p>
              <p><strong>Allocated Doctor:</strong> {selectedSurgery.surgeon || 'N/A'}</p>
              <p><strong>Allocated Nurses:</strong> {selectedSurgery.assigned_nurses && selectedSurgery.assigned_nurses.length > 0 ? selectedSurgery.assigned_nurses.join(', ') : 'N/A'}</p>
              <p><strong>Allocated OT:</strong> {selectedSurgery.ot !== -1 ? `OT ${selectedSurgery.ot}` : 'Unassigned'}</p>
              <p><strong>Time Slot:</strong> {selectedSurgery.ot !== -1 ? `${formatTime(selectedSurgery.start_slot)} - ${formatTime(selectedSurgery.end_slot)}` : 'Pending'}</p>
            </div>
          </div>
        </div>
      )}

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
              <select style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}} name="equipment" value={formData.equipment} onChange={handleInputChange}>
                <option value="Standard">Standard</option>
                <option value="Ventilator">Ventilator</option>
              </select>
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
