function initBioPage() {
    console.log('1. Initializing alumni profile page...');
    
	const urlParams = new URLSearchParams(window.location.search);
	const pennwestId = urlParams.get('id');
	console.log('2. URL PennWest ID:', pennwestId);
    
    if (!pennwestId) {
	console.log('ERROR: No ID in URL');
        showError('No alumni selected.');
        return;
    }
    
	console.log('3. Calling loadAlumniProfile...');
	loadAlumniProfile(pennwestId);
	console.log('4. initBioPage finished.');
}

/**
 * Load and display alumni profile
 */
async function loadAlumniProfile(pennwestId) {
	console.log('5. loadAlumniProfile STARTED with ID', pennwestId);
	showLoading();
    
    try {
	console.log('6. Entered TRY block.');

	console.log('6a. Checking sessionStorage...');
	const storedAlumni = sessionStorage.getItem('selectedAlumni');
	const storedId = sessionStorage.getItem('selectedAlumniPennWestId');
	console.log('6b. Stored ID:', storedId, 'Current ID:', pennwestId, 'Match?:', storedId === pennwestId);

	console.log('6c. About to call fetch() to API...');
	const apiUrl = `api.php?action=getAlumniByPennWestId&id=${encodeURIComponent(pennwestId)}`;
	console.log('6d. Full API URL:', apiUrl);

	const response = await fetch(apiUrl);

	console.log('6e. Fetch completed. Response:', response);
	console.log('6f. Response OK?:', response.ok);
	console.log('6g. Response status:', response.status, response.statusText);

	if(!response.ok) throw new Error('Failed to fetch');

	console.log('6h. About to parse response as JSON...');

	let alumni;
	
	try {
		alumni = await response.json();
//		console.log('6i. Successfully parsed JSON:', alumni);
//		console.log('6j. Data type:', typeof alumni);
//		console.log('6k. Number of keys:', Object.keys(alumni).length);
	} catch (jsonError) {
		console.log('6l. ERROR parsing JSON:', jsonError.message);
		console.log('6m. Trying to read as text instead...');
		const text = await response.text();
		console.log('6n. Raw response text:', text);
		throw new Error('Invalid JSON response from API: ' + jsonError.message);
	}

	if(!alumni || Object.keys(alumni).length === 0) {
		console.log('6t. ERROR TRIGGERED! Why?');
		console.log('6u. !alumni is:', !alumni);
		console.log('6v. length === 0 is:', Object.keys(alumni).length === 0);
		throw new Error('Alumni not found in database');
	}
	
	console.log('6o. Success! Calling displayAlumniProfile...');
	displayAlumniProfile(alumni);

	} catch (error) {  
 		console.log('ERROR caught in loadAlumniProfile:', error.message);
		showError(error.message);
	}

	console.log('7. loadAlumniProfile ENDED.');
}	

/**
 * Display the alumni profile
 */
function displayAlumniProfile(alumni) {
	console.log('8. DISPLAY function called with data:', alumni);
	const bioContainer = document.getElementById('bio-container');
	if (!bioContainer) return;
    
	// Create photo HTML
	const photoHTML = createBioPhotoHTML(alumni);
   
	bioContainer.innerHTML = `
		<div class="bio-header">
			<div class="bio-photo">
				${photoHTML}
			</div>
		</div>
        
		<div class="bio-details">
			<div class="detail-section">
				<h3 style="color:#001F3C;">
				<span>${escapeHTML(alumni.name) || 'Not specified'}</span>
				</h3>
				<h3 style="color:#001F3C;">Professional Information</h3>
				<div class="detail-grid">
					<div class="detail-item">
						<strong>Starting Semester:</strong>
						<span>${escapeHTML(alumni.start) || 'Not specified'}</span>
					</div>
					<div class="detail-item">
						<strong>Ending Semester:</strong>
						<span>${escapeHTML(alumni.end) || 'Not specified'}</span>
					</div>
					<div class="detail-item">
						<strong>Job Title:</strong>
						<span>${escapeHTML(alumni.jobTitle) || 'Not specified'}</span>
					</div>
					<div class="detail-item">
						<strong>Employer:</strong>
						<span>${escapeHTML(alumni.employer) || 'Not specified'}</span>
					</div>
					<div class="detail-item">
						<strong>Job Setting:</strong>
						<span>${escapeHTML(alumni.jobSetting) || 'Not specified'}</span>
					</div>
				</div>
			</div>
            
			<div class="detail-section">
				<h3 style="color:#001F3C;">Biography</h3>
				<div class="bio-content">
					${escapeHTML(alumni.bio) || 'No biography available.'}
				</div>
			</div>
			</div>
	        
		<div class="bio-footer">
			<button onclick="window.location.href='index.html'" class="back-button"> Back to Hall of Excellence </button>
		</div>
	`;
}

/**
 * Create HTML for biography page photo
 */
function createBioPhotoHTML(alumni) {
    if (alumni.image  && alumni.image.trim() !== '') {
        return `<img src="${escapeHTML(alumni.image)}" alt="Photo of ${escapeHTML(alumni.name)}">`;
    }
    
    return `
        <div class="bio-photo-placeholder">
            <i class="bi bi-person-circle"></i>
        </div>
    `;
}

/**
 * Simple HTML escaping to prevent XSS
 */
function escapeHTML(text) {
    if (!text) return '';
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Show loading state
 */
function showLoading() {
    const bioContainer = document.getElementById('bioContainer');
    if (!bioContainer) return;
    
    bioContainer.innerHTML = `
        <div class="loading-state">
            <i class="bi bi-hourglass-split"></i>
            <p>Loading alumni profile...</p>
        </div>
    `;
}

/**
 * Show error state
 */
function showError(message) {
    const bioContainer = document.getElementById('bioContainer');
    if (!bioContainer) return;
    
    bioContainer.innerHTML = `
        <div class="error-state">
            <i class="bi bi-exclamation-triangle"></i>
            <h2>Unable to Load Profile</h2>
            <p>${escapeHTML(message)}</p>
            <a href="index.html" class="back-button">
                <i class="bi bi-arrow-left"></i> Back to Hall of Excellence
            </a>
        </div>
    `;
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBioPage);
} else {
    initBioPage();
}

// Export functions for debugging if needed
window.bioPage = {
    reload: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const alumniId = urlParams.get('id');
        if (alumniId) loadAlumniProfile(alumniId);
    },
    getAlumniId: () => new URLSearchParams(window.location.search).get('id')
};
