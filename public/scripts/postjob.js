document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, fetching user info...');
    fetchUserInfo();
    
    // Ensure the form element is loaded before adding an event listener
    const postJobForm = document.getElementById('post-job-form');
    if (postJobForm) {
        postJobForm.addEventListener('submit', handleJobPost);
    } else {
        console.error('Post Job Form element not found');
    }
});

async function fetchUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("User is not logged in.");
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
            businessNameInput.value = userData.username || "";
        } else {
            console.error('Business name input element not found');
        }

        return userData;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

async function handleJobPost(e) {
    e.preventDefault();

    const postShiftButton = document.querySelector("button[type='submit']");
    postShiftButton.disabled = true;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("You must be logged in to post a job.");
            window.location.href = "login.html";
            return;
        }

        // Get other form data
        const businessNameElement = document.getElementById('business-name');
        const jobDescriptionElement = document.getElementById('job-description');
        const businessName = businessNameElement ? businessNameElement.value.trim() : '';
        const jobDescription = jobDescriptionElement ? jobDescriptionElement.value.trim() : '';

        if (!businessName) {
             alert("Business name cannot be empty.");
             postShiftButton.disabled = false;
             return;
        }

        // Get category
        const categoryElement = document.getElementById("category-select");
        const category = categoryElement ? categoryElement.value.trim() : '';
        if (!category) {
            alert("Please select a category.");
            postShiftButton.disabled = false;
            return;
        }

        // Verify shift data
        if (!window.selectedShiftOption || !window.selectedShiftData) {
            alert("Please select a shift type and time.");
            postShiftButton.disabled = false;
            return;
        }

        // Additional validation for custom shifts
        if (window.selectedShiftOption === 'custom') {
            if (!window.selectedShiftData.startTime || !window.selectedShiftData.endTime) {
                alert("Please select both start and end times for custom shift.");
                postShiftButton.disabled = false;
                return;
            }
        }

        // Prepare the job data
        const job = {
            businessName,
            jobDescription,
            category,
            shift: {
                type: window.selectedShiftOption,
                date: window.selectedShiftData.date,
                startTime: window.selectedShiftData.startTime,
                endTime: window.selectedShiftData.endTime
            }
        };

        console.log('Submitting job:', job); // Debug log

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
            const jobId = result.job._id;
            console.log(`Job ID to fetch: ${jobId}`);
            localStorage.setItem('lastPostedJobId', jobId);  // Store the job ID in localStorage
            window.location.href = 'shiftstatus.html';  // Redirect to shift status page
        } else {
            alert(result.message || "Error posting job.");
        }
    } catch (error) {
        console.error('Error posting job:', error);
        alert('Error posting job.');
    } finally {
        postShiftButton.disabled = false;
    }
}

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

// Initialize the component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('shift-selector-root'));
    root.render(React.createElement(ShiftSelector, {
        onShiftSelect: (shift) => {
            window.selectedShiftOption = shift.type;
            window.selectedShiftData = shift;
            console.log('Shift selected:', shift);
        }
    }));
});