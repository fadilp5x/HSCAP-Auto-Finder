let state = {};

// Initialize state when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
    state = {
        isSearching: false, isPaused: false, schoolIndex: 0, courseIndex: 0,
        foundStudents: [], totalSchools: 0, startTime: 0, currentDelay: 3000
    };
    chrome.storage.local.set(state);
});

// Load state from storage when the browser starts
chrome.runtime.onStartup.addListener(async () => {
    state = await chrome.storage.local.get();
});

async function updateState(newState) {
    state = { ...state, ...newState };
    await chrome.storage.local.set(state);
    sendUIUpdate(); // Broadcast the update
}

function sendUIUpdate() {
    const eta = calculateETA();
    chrome.runtime.sendMessage({
        command: 'updateUI',
        data: {
            status: state.isSearching ? (state.isPaused ? 'Paused' : 'Running') : 'Idle',
            schoolsScanned: state.schoolIndex,
            totalSchools: state.totalSchools,
            matchesFound: state.foundStudents ? state.foundStudents.length : 0,
            eta: state.isSearching && !state.isPaused ? eta : '--:--',
            results: state.foundStudents || [],
            isPaused: state.isPaused
        }
    });
}

function calculateETA() {
    if (!state.isSearching || state.schoolIndex === 0) return '--:--';
    const elapsedTime = performance.now() - state.startTime;
    const timePerSchool = elapsedTime / state.schoolIndex;
    const schoolsRemaining = state.totalSchools - state.schoolIndex;
    const etaMs = schoolsRemaining * timePerSchool;
    const minutes = Math.floor(etaMs / 60000);
    const seconds = ((etaMs % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}

function playSound(soundFile) {
  const audio = new Audio(chrome.runtime.getURL(soundFile));
  audio.play();
}

// --- Main Listeners ---
chrome.runtime.onMessage.addListener((request) => {
    if (request.command === 'start') startSearch();
    else if (request.command === 'pause') updateState({ isPaused: true });
    else if (request.command === 'resume') {
        updateState({ isPaused: false }).then(() => injectContentScript());
    }
    else if (request.command === 'getUIState') sendUIUpdate(); // Respond to heartbeat
    else if (request.command === 'playSound') playSound(request.sound);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    state = await chrome.storage.local.get(); // Ensure state is fresh
    if (state.isSearching && !state.isPaused && changeInfo.status === 'complete' && tab.url.includes('student_status.php')) {
        injectContentScript(tabId);
    }
});

// --- Search Logic ---
async function startSearch() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes('student_status.php')) {
        alert("Error: Please navigate to the HSCAP page and select a district.");
        return;
    }
    await updateState({
        isSearching: true, isPaused: false, schoolIndex: 0, courseIndex: 0,
        foundStudents: [], totalSchools: 0, startTime: performance.now()
    });
    // Inject the special initialization script first
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: initializeAndRunFirstStep,
        args: ['AMINA']
    });
}

function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId || state.activeTabId },
        function: runSearchStep,
        args: ['AMINA']
    });
}

// --- Injected Functions ---

// This new function runs ONLY ONCE at the start of a new search
async function initializeAndRunFirstStep(searchQuery) {
    const schoolDropdown = document.querySelector('select[name="cmbschool"]');
    const schoolOptions = Array.from(schoolDropdown.options).filter(opt => opt.value !== '0');
    const totalSchools = schoolOptions.length;

    // Save the total count immediately
    await chrome.storage.local.set({ totalSchools: totalSchools });

    // Now, perform the first action of the search
    const school = schoolOptions[0];
    schoolDropdown.value = school.value;
    sessionStorage.setItem('currentSchoolName', school.text);
    await chrome.storage.local.set({ courseIndex: 1, schoolIndex: 0 });
    document.forms['frm'].submit();
}


async function runSearchStep(searchQuery) {
  // This function is injected onto the HSCAP page
  const { isSearching, schoolIndex, courseIndex, foundStudents } = await chrome.storage.local.get(['isSearching', 'schoolIndex', 'courseIndex', 'foundStudents']);

  if (!isSearching) return;

  // --- LOGIC FOR RESULTS PAGE ---
  if (!document.querySelector('select[name="cmbschool"]')) {
    console.log("Scanning results page...");
    
    // --- THE FIX IS HERE: Increased wait time ---
    await new Promise(resolve => setTimeout(resolve, 10000)); // Now waits 10 seconds

    const tables = document.querySelectorAll('table');
    const resultsTable = tables.length > 1 ? tables[tables.length - 1] : null;

    if (resultsTable) {
      const rows = resultsTable.querySelectorAll('tr');
      for (const row of rows) {
        if (row.innerText.toUpperCase().includes(searchQuery)) {
          const school = sessionStorage.getItem('currentSchoolName');
          const course = sessionStorage.getItem('currentCourseName');
          const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
          
          const studentData = { school, course, details: cells };
          
          console.log(`✅ Match Found!`, studentData);
          foundStudents.push(studentData);
        }
      }
      await chrome.storage.local.set({ foundStudents });
    }
    
    history.back();
    return;
  }

  // --- LOGIC FOR FORM PAGE ---
  const schoolDropdown = document.querySelector('select[name="cmbschool"]');
  const courseDropdown = document.querySelector('select[name="txtgroup"]');
  
  const schoolOptions = Array.from(schoolDropdown.options).filter(opt => opt.value !== '0');
  
  if (schoolIndex >= schoolOptions.length) {
    await chrome.storage.local.set({ isSearching: false });
    chrome.runtime.sendMessage({ command: 'downloadResults', data: foundStudents });
    alert("Search complete! A file with the results will be downloaded.");
    return;
  }

  const currentSchool = schoolOptions[schoolIndex];
  schoolDropdown.value = currentSchool.value;
  sessionStorage.setItem('currentSchoolName', currentSchool.text);

  const courseOptions = Array.from(courseDropdown.options).filter(opt => opt.value !== '0');

  if (courseOptions.length === 0 || courseIndex === 0) {
    await chrome.storage.local.set({ courseIndex: 1 });
    document.forms['frm'].submit();
  } else {
    if (courseIndex > courseOptions.length) {
      await chrome.storage.local.set({ schoolIndex: schoolIndex + 1, courseIndex: 0 });
      document.forms['frm'].submit();
    } else {
      const currentCourse = courseOptions[courseIndex - 1];
      courseDropdown.value = currentCourse.value;
      sessionStorage.setItem('currentCourseName', currentCourse.text);
      
      await chrome.storage.local.set({ courseIndex: courseIndex + 1 });
      document.querySelector('input[name="njreset"]').click();
    }
  }
}