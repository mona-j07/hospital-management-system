const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');
const BACKEND_DIR = path.join(__dirname, '../backend');
const INPUT_TXT = path.join(BACKEND_DIR, 'input.txt');
const OUTPUT_JSON = path.join(__dirname, '../frontend/public/output.json');

// Helper to run the C program
function generateScheduleAndGetData() {
    // 1. Read data.json
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const db = JSON.parse(rawData);

    // 2. Write to input.txt for the C program
    let inputStr = `SURGERIES ${db.surgeries.length}\n`;
    db.surgeries.forEach(s => {
        // Remove spaces from string fields
        const typeStr = s.type ? s.type.replace(/ /g, '_') : "Unknown";
        const urgencyStr = s.urgency ? s.urgency.replace(/ /g, '_') : "Minor";
        const eqStr = s.equipment ? s.equipment.replace(/ /g, '_') : "Standard";
        inputStr += `${s.id} ${typeStr} ${urgencyStr} ${s.patient_id} ${s.surgeon_id} ${s.required_nurses} ${s.duration} ${eqStr} ${s.priority}\n`;
    });

    inputStr += `\nOTS ${db.ots.length}\n`;
    db.ots.forEach(o => {
        const nameStr = o.name ? o.name.replace(/ /g, '_') : "OT";
        const typeStr = o.type ? o.type.replace(/ /g, '_') : "General";
        const eqStr = o.equipment ? o.equipment.replace(/ /g, '_') : "Standard";
        inputStr += `${o.id} ${nameStr} ${typeStr} ${eqStr} ${o.is_available}\n`;
    });

    inputStr += `\nSURGEONS ${db.surgeons.length}\n`;
    db.surgeons.forEach(d => {
        const nameStr = d.name ? d.name.replace(/ /g, '_') : "Doctor";
        const posStr = d.position ? d.position.replace(/ /g, '_') : "Doctor";
        const specStr = d.specialization ? d.specialization.replace(/ /g, '_') : "General";
        const exp = d.experience || 0;
        inputStr += `${d.id} ${nameStr} ${posStr} ${specStr} ${exp} ${d.max_hours} ${d.rate}\n`;
    });

    inputStr += `\nNURSES ${db.nurses.length}\n`;
    db.nurses.forEach(n => {
        const nameStr = n.name ? n.name.replace(/ /g, '_') : "Nurse";
        const posStr = n.position ? n.position.replace(/ /g, '_') : "Nurse";
        const specStr = n.specialization ? n.specialization.replace(/ /g, '_') : "General";
        const exp = n.experience || 0;
        inputStr += `${n.id} ${nameStr} ${posStr} ${specStr} ${exp} ${n.max_hours} ${n.rate}\n`;
    });

    fs.writeFileSync(INPUT_TXT, inputStr);

    // 3. Execute the C program
    try {
        const isWindows = process.platform === 'win32';
        const execCmd = isWindows ? '.\\hospital_backend.exe' : './hospital_backend';
        execSync(execCmd, { cwd: BACKEND_DIR });
    } catch (e) {
        console.error("Error executing C backend", e);
    }

    // 4. Read the output.json produced
    if (fs.existsSync(OUTPUT_JSON)) {
        return JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf-8'));
    } else if (fs.existsSync(path.join(BACKEND_DIR, 'output.json'))) {
        return JSON.parse(fs.readFileSync(path.join(BACKEND_DIR, 'output.json'), 'utf-8'));
    } else {
        return { error: "output.json not found in either location" };
    }
}

app.get('/api/data', (req, res) => {
    const data = generateScheduleAndGetData();
    res.json(data);
});

app.post('/api/surgeries', (req, res) => {
    const newSurgery = req.body;
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const db = JSON.parse(rawData);
    
    // Auto increment ID
    const maxId = db.surgeries.reduce((max, s) => Math.max(max, s.id), 0);
    newSurgery.id = maxId + 1;
    
    db.surgeries.push(newSurgery);
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    
    const resultData = generateScheduleAndGetData();
    res.json(resultData);
});

app.put('/api/surgeries/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updatedSurgery = req.body;
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const db = JSON.parse(rawData);
    
    const index = db.surgeries.findIndex(s => s.id === id);
    if (index !== -1) {
        db.surgeries[index] = { ...db.surgeries[index], ...updatedSurgery, id };
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    }
    
    const resultData = generateScheduleAndGetData();
    res.json(resultData);
});

app.delete('/api/surgeries/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const db = JSON.parse(rawData);
    
    db.surgeries = db.surgeries.filter(s => s.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    
    const resultData = generateScheduleAndGetData();
    res.json(resultData);
});

app.put('/api/ots/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { is_available } = req.body;
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const db = JSON.parse(rawData);
    
    const index = db.ots.findIndex(o => o.id === id);
    if (index !== -1) {
        db.ots[index].is_available = is_available ? 1 : 0;
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    }
    
    const resultData = generateScheduleAndGetData();
    res.json(resultData);
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node API running on port ${PORT}`);
});
