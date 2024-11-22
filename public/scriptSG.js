const jobDescription = document.getElementById("job-description");
const postJobForm = document.getElementById("post-job-form");
const postShiftButton = document.querySelector("button[type='submit']");

// Add event listeners for form submission
postJobForm.addEventListener("submit", handleJobPost);

// Get business name 
async function fetchUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('Fetching user info...');
        const response = await fetch('https://shift-grab.vercel.app/api/getUserInfo', {
            method: 'GET', 
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('User data received:', userData);

        const businessNameInput = document.getElementById('business-name');
        if (businessNameInput) {
            businessNameInput.value = userData.username;
        } else {
            console.error('Business name input element not found');
        }
        
        return userData;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Constants for DOM Elements
    const recentShiftElement = document.getElementById('recent-shift');
    const pastShiftsContainer = document.getElementById('past-shifts-container');
    const allShiftsBtn = document.getElementById('all-shifts-btn');
    const removedShiftsBtn = document.getElementById('removed-shifts-btn');
    const claimedShiftsBtn = document.getElementById('claimed-shifts-btn');
    const unclaimedShiftsBtn = document.getElementById('unclaimed-shifts-btn');

    // Fetch Recent Shift
    async function fetchRecentShift() {
        const token = localStorage.getItem('token');

        if (!token) {
            recentShiftElement.innerHTML = `<p>You must be logged in to view recent shifts.</p>`;
            return;
        }

        try {
            const response = await fetch('https://shift-grab.vercel.app/api/getRecentShift', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch recent shift.');

            const job = await response.json();
            recentShiftElement.innerHTML = `
                <strong>Recent Shift:</strong><br>
                <p><strong>Business:</strong> ${job.businessName}</p>
                <p><strong>Description:</strong> ${job.jobDescription}</p>
                <p><strong>Date:</strong> ${new Date(job.shift.date).toLocaleString()}</p>
                <p><strong>Time:</strong> ${job.shift.startTime} - ${job.shift.endTime}</p>
                <p><strong>Claimed By:</strong> ${job.claimedBy || 'Not yet claimed'}</p>
            `;
        } catch (error) {
            console.error('Error fetching recent shift:', error);
            recentShiftElement.innerHTML = `<p>Error fetching recent shift. Please try again.</p>`;
        }
    }

    // Fetch Past Shifts with Filter
    async function fetchPastShifts(filter = 'all') {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('You must be logged in to view past shifts.');
            return;
        }

        try {
            const response = await fetch(`https://shift-grab.vercel.app/api/getPastShifts?filter=${filter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch past shifts.');

            const shifts = await response.json();

            // Update DOM
            if (shifts.length > 0) {
                pastShiftsContainer.innerHTML = shifts
                    .map(shift => `
                        <div class="past-shift">
                            <p><strong>Business:</strong> ${shift.businessName}</p>
                            <p><strong>Date/Time:</strong> ${new Date(shift.shift.date).toLocaleString()}</p>
                            <p><strong>Category:</strong> ${shift.category}</p>
                            <p><strong>Status:</strong> ${shift.status}</p>
                        </div>
                    `)
                    .join('');
            } else {
                pastShiftsContainer.innerHTML = `<p>No past shifts found for the selected filter.</p>`;
            }
        } catch (error) {
            console.error('Error fetching past shifts:', error);
            pastShiftsContainer.innerHTML = `<p>Error fetching past shifts. Please try again.</p>`;
        }
    }

    // Event Listeners for Filter Buttons
    if (allShiftsBtn && removedShiftsBtn && claimedShiftsBtn && unclaimedShiftsBtn) {
        allShiftsBtn.addEventListener('click', () => fetchPastShifts('all'));
        removedShiftsBtn.addEventListener('click', () => fetchPastShifts('removed'));
        claimedShiftsBtn.addEventListener('click', () => fetchPastShifts('claimed'));
        unclaimedShiftsBtn.addEventListener('click', () => fetchPastShifts('unclaimed'));
    } else {
        console.error('One or more shift filter buttons are missing.');
    }

    // Initial Fetch Calls
    if (recentShiftElement) fetchRecentShift();
});

// Validation and Submission for Post Job Form
document.addEventListener('DOMContentLoaded', () => {
    const postJobForm = document.getElementById('post-job-form');

    if (!postJobForm) return;

    postJobForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = localStorage.getItem('token');
        const businessName = document.getElementById('business-name').value.trim();
        const jobDescription = document.getElementById('job-description').value.trim();
        const category = document.getElementById('category-select').value;

        if (!businessName || !jobDescription || !category) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const response = await fetch('https://shift-grab.vercel.app/api/postJob', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    businessName,
                    jobDescription,
                    category,
                    shift: window.selectedShiftData,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Shift posted successfully!');
                localStorage.setItem('lastPostedJobId', result.job._id);
                window.location.href = 'shiftstatus.html';
            } else {
                throw new Error(result.message || 'Failed to post shift.');
            }
        } catch (error) {
            console.error('Error posting job:', error);
            alert('An error occurred while posting the shift. Please try again.');
        }
    });
});


// Reset form fields
function resetForm() {
    const businessNameElement = document.getElementById('business-name');
    if (businessNameElement) {
        businessNameElement.value = '';
    }

    const jobDescriptionElement = document.getElementById('job-description');
    if (jobDescriptionElement) {
        jobDescriptionElement.value = '';
    }

    const categoryElement = document.getElementById('category-select');
    if (categoryElement) {
        categoryElement.value = '';
    }

    // Reset ShiftSelector component
    const shiftDropdown = document.getElementById('shift-selector');
    if (shiftDropdown) {
        shiftDropdown.value = '';
    }

    // Clear global state for shift selection
    window.selectedShiftOption = null;
    window.selectedShiftData = null;
}

// Log out Function 
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Add to global scope
window.handleLogout = handleLogout;

// Ensure functions are attached to window
toggleNav && (window.toggleNav = toggleNav);
viewPhoneNumbers && (window.viewPhoneNumbers = viewPhoneNumbers);

async function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No valid token found, cannot load categories.");
        return;
    }

    const categoryList = document.getElementById('category-list');
    if (!categoryList) {
        console.error("Category list element not found");
        return;
    }

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/getCategories', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        const categories = await response.json();
        categoryList.innerHTML = ''; // Clear any previous content
        categories.forEach(category => {
            const listItem = document.createElement('li');
            listItem.textContent = category;
            categoryList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Add this to load existing preferences when the page loads
document.addEventListener('DOMContentLoaded', loadCategories);

// Fetch and display jobs
function fetchJobs() {
    const token = localStorage.getItem('token');
    fetch('https://shift-grab.vercel.app/getJobs', {
        headers: { 'Authorization': `Bearer ${token}` },
    })
        .then((response) => response.json())
        .then((jobs) => renderJobList(jobs))
        .catch((error) => console.error('Error fetching jobs:', error));
}

// Render job list
function renderJobList(jobs) {
    const list = document.getElementById("job-list");
    list.innerHTML = "";
    jobs.forEach((job) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong>${job.businessName}</strong>
            <p>${job.jobDescription}</p>
            <p>${job.datetime}</p>
        `;
        list.appendChild(listItem);
    });
}

function toggleDropdown() {
    const dropdown = document.getElementById('phone-dropdown');
    console.log("Dropdown toggled"); // Check if the function is called

    // Use inline style to toggle the display
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
}

function viewPhoneNumbers() {
    console.log("View Phone Numbers button clicked"); // Check if this logs
    const token = localStorage.getItem('token');
    fetch('https://shift-grab.vercel.app/api/getPhoneNumbers', {
        headers: { 'Authorization': `Bearer ${token}` },
    })
    .then(response => response.json())
    .then(phoneNumbers => displayPhoneNumbers(phoneNumbers))
    .catch(error => console.error("Error fetching phone numbers:", error));
}

function displayPhoneNumbers(phoneNumbers) {
    const list = document.getElementById('phone-list');
    list.innerHTML = '';
    phoneNumbers.forEach(({ name, number, category }) => {
        const li = document.createElement('li');
        li.className = 'phone-item'; 
        const span = document.createElement('span');
        span.className = 'phone-info';
        span.innerHTML = `<strong>${name}</strong>: ${number} (${category})`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deletePhoneNumber(number);

        // Use Flexbox to align the text and button
        li.appendChild(span);
        li.appendChild(deleteButton);
        list.appendChild(li);
    });
}

async function deletePhoneNumber(number) {
    const token = localStorage.getItem('token');
    await fetch('https://shift-grab.vercel.app/api/deletePhoneNumber', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
    });
    viewPhoneNumbers();
}

function addPhoneForm() {
    console.log("Add Phone Form button clicked"); // Check if this logs
    document.getElementById('add-phone-form').style.display = 'block';
}

async function saveNewPhoneNumber() {
    const name = document.getElementById('new-phone-name').value.trim();
    const number = document.getElementById('new-phone-number').value.trim();
    const category = document.getElementById('new-phone-category').value;

    const token = localStorage.getItem('token');
    await fetch('https://shift-grab.vercel.app/api/addPhoneNumber', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, number, category }),
    });
    document.getElementById('add-phone-form').style.display = 'none';
    viewPhoneNumbers();
}

// Settings saving shifts
async function saveShiftTimes() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to save settings.");
        window.location.href = 'login.html';
        return;
    }

    // Disable the save button while processing
    const saveButton = document.querySelector('.settings-button');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
    }

    try {
        // Get and validate all time inputs
        const morningStart = document.getElementById('morning-start').value;
        const morningEnd = document.getElementById('morning-end').value;
        const middayStart = document.getElementById('midday-start').value;
        const middayEnd = document.getElementById('midday-end').value;
        const nightStart = document.getElementById('night-start').value;
        const nightEnd = document.getElementById('night-end').value;

        // Validate that all times are filled
        if (!morningStart || !morningEnd || !middayStart || !middayEnd || !nightStart || !nightEnd) {
            alert("Please fill in all shift times.");
            return;
        }

        const response = await fetch('https://shift-grab.vercel.app/api/updateUserPreferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                shiftTimes: {
                    morning: { start: morningStart, end: morningEnd },
                    midday: { start: middayStart, end: middayEnd },
                    night: { start: nightStart, end: nightEnd },
                },
            }),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Shift times updated successfully!");
            // Optionally refresh the page or update the UI
            // window.location.reload();
        } else {
            throw new Error(result.message || "Error saving shift times.");
        }
    } catch (error) {
        console.error("Error saving shift times:", error);
        alert(error.message || "Error saving shift times.");
    } finally {
        // Re-enable the save button
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'SAVE SHIFT TIMES';
        }
    }
}

// Add this to load existing preferences when the page loads
async function loadUserPreferences() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/getUserPreferences', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const { shiftTimes } = await response.json();
            
            // Populate the inputs with existing values
            if (shiftTimes) {
                document.getElementById('morning-start').value = shiftTimes.morning.start;
                document.getElementById('morning-end').value = shiftTimes.morning.end;
                document.getElementById('midday-start').value = shiftTimes.midday.start;
                document.getElementById('midday-end').value = shiftTimes.midday.end;
                document.getElementById('night-start').value = shiftTimes.night.start;
                document.getElementById('night-end').value = shiftTimes.night.end;
            }
        }
    } catch (error) {
        console.error("Error loading preferences:", error);
    }
}

// Load preferences when page loads
document.addEventListener('DOMContentLoaded', loadUserPreferences);

// Attach the function to the global scope for use in settings.html
window.saveShiftTimes = saveShiftTimes;

async function addCategory() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to add a category.");
        return;
    }

    const categoryName = document.getElementById('new-category-name').value.trim();
    if (!categoryName) {
        alert("Category name cannot be empty.");
        return;
    }

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/addCategory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ categoryName }),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Category added successfully!");
            // Optionally, update the category list in the UI
            loadCategories();
        } else {
            alert(result.message || "Error adding category.");
        }
    } catch (error) {
        console.error("Error adding category:", error);
        alert("Error adding category.");
    }
}

// Function to load categories from the server
async function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) {
        return;
    }

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/getCategories', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const categories = await response.json();
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        categories.forEach(category => {
            const listItem = document.createElement('li');
            listItem.textContent = category.name;
            categoryList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Make addCategory and loadCategories functions globally accessible
window.addCategory = addCategory;
document.addEventListener('DOMContentLoaded', loadCategories);

async function updateUserCredentials() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to update your credentials.");
        return;
    }

    const newUsername = document.getElementById('new-username').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();

    if (!newUsername && !newPassword) {
        alert("Please enter a new username or password.");
        return;
    }

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/updateUsernamePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ newUsername, newPassword }),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Credentials updated successfully!");
        } else {
            alert(result.message || "Error updating credentials.");
        }
    } catch (error) {
        console.error("Error updating credentials:", error);
        alert("Error updating credentials.");
    }
}

// Make the function accessible in the HTML
window.updateUserCredentials = updateUserCredentials;


// Make viewPhoneNumbers available globally
window.viewPhoneNumbers = viewPhoneNumbers;
window.toggleNav = toggleNav;

// Add navigation toggle function if not already defined in HTML
function toggleNav() {
    const drawer = document.getElementById('navDrawer');
    const overlay = document.getElementById('overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
    } else {
        drawer.classList.add('open');
        overlay.classList.add('show');
    }
}