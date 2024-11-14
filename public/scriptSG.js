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

// Add this to ensure the function runs after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, fetching user info...');
    fetchUserInfo();
});

// Handle job posting
async function handleJobPost(e) {
    e.preventDefault();

    // Disable the submit button to prevent multiple submissions
    postShiftButton.disabled = true;

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to post a job.");
        window.location.href = "login.html";
        return;
    }

    const category = document.getElementById("category-select").value.trim();
    if (!category) {
        alert("Please select a category.");
        postShiftButton.disabled = false;
        return;
    }

    let shiftData;
    if (window.selectedShiftOption === 'custom') {
        const startDate = document.querySelector("input[type='date']").value;
        const startTime = document.querySelector("input[type='time']").value;
        const endTime = document.querySelectorAll("input[type='time']")[1].value;

        if (!startDate || !startTime || !endTime) {
            alert("Please complete the custom shift details.");
            postShiftButton.disabled = false;
            return;
        }
        shiftData = {
            type: 'custom',
            date: startDate,
            startTime,
            endTime
        };
    } else if (window.selectedShiftOption) {
        shiftData = {
            type: window.selectedShiftOption,
            startTime: '06:00', // Example start time; adjust as needed
            endTime: '14:00'    // Example end time; adjust as needed
        };
    } else {
        alert("Please select a shift type.");
        postShiftButton.disabled = false;
        return;
    }

    const job = {
        businessName: document.getElementById('business-name')?.value.trim(),
        jobDescription: document.getElementById('job-description')?.value.trim(),
        category,
        shift: shiftData
    };

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/postJob', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(job),
        });
        
        const result = await response.json();
        if (response.ok) {
            alert("Job posted successfully!");
            resetForm();
        } else {
            alert(result.message || "Error posting job.");
        }
    } catch (error) {
        console.error("Error posting job:", error);
        alert("Error posting job.");
    } finally {
        postShiftButton.disabled = false;
    }
}

// Reset form fields
function resetForm() {
    jobDescription.value = "";
    document.getElementById("category-select").value = "";
    const shiftSelectorRoot = document.getElementById('shift-selector-root');
    const shiftSelector = shiftSelectorRoot?._reactRootContainer?._internalRoot?.current;
    if (shiftSelector && shiftSelector.memoizedProps?.onChange) {
        shiftSelector.memoizedProps.onChange({ target: { value: '' } });
    }
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
  