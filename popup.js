// UI Elements
const startBtn = document.getElementById('startBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const schoolsScannedEl = document.getElementById('schoolsScanned');
const matchesFoundEl = document.getElementById('matchesFound');
const statusEl = document.getElementById('status');
const etaEl = document.getElementById('eta');
const resultsBody = document.getElementById('resultsBody');

let uiUpdateInterval;

// --- Event Listeners ---
startBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'start' });
});

pauseResumeBtn.addEventListener('click', () => {
    const currentState = pauseResumeBtn.textContent;
    if (currentState === 'Pause') {
        chrome.runtime.sendMessage({ command: 'pause' });
    } else {
        chrome.runtime.sendMessage({ command: 'resume' });
    }
});

// Listen for broadcasted updates from the background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.command === 'updateUI') {
        updateDashboard(request.data);
    }
});

// --- UI Functions ---
function updateDashboard(data) {
    if (!data) return; // Exit if data is not available yet
    const { status, schoolsScanned, totalSchools, matchesFound, eta, results, isPaused } = data;
    
    statusEl.textContent = isPaused ? 'Paused' : status;
    schoolsScannedEl.textContent = `${schoolsScanned || 0} / ${totalSchools || '...'}`;
    matchesFoundEl.textContent = matchesFound || 0;
    etaEl.textContent = eta || '--:--';
    
    pauseResumeBtn.textContent = isPaused ? 'Resume' : 'Pause';
    pauseResumeBtn.className = isPaused ? 'paused' : '';
    
    // Update results table if the data is different
    if (results && results.length !== resultsBody.childElementCount) {
        resultsBody.innerHTML = ''; // Clear old results
        results.forEach(student => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const schoolCell = document.createElement('td');

            nameCell.textContent = student.details[1] || 'N/A';
            schoolCell.textContent = student.school.substring(0, 25) + '...';
            
            row.appendChild(nameCell);
            row.appendChild(schoolCell);
            resultsBody.appendChild(row);
        });
    }
}

// When the popup opens, start the heartbeat to get live updates
document.addEventListener('DOMContentLoaded', () => {
    uiUpdateInterval = setInterval(() => {
        chrome.runtime.sendMessage({ command: 'getUIState' });
    }, 1000); // Request an update every second
});

// When the popup closes, stop the heartbeat
window.addEventListener('unload', () => {
    if (uiUpdateInterval) {
        clearInterval(uiUpdateInterval);
    }
});