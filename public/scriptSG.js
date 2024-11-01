// Get input elements
const input = document.getElementById("job-post-input");
const jobDescription = document.getElementById("job-description");
const datetimeInput = document.getElementById("datetime-input");
const postJobForm = document.getElementById("post-job-form");

// Initialize Flatpickr
flatpickr(datetimeInput, {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    time_24hr: false,
});

// Add event listeners for form submission
postJobForm.addEventListener("submit", handleJobPost);

// Handle job posting
async function handleJobPost(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to post a job.");
        window.location.href = "login.html";
        return;
    }

    const category = document.getElementById("category-select").value.trim();
    if (!category) {
        alert("Please select a category.");
        return;
}


    const job = {
        businessName: input.value.trim(),
        jobDescription: jobDescription.value.trim(),
        datetime: datetimeInput.value.trim(),
        category: document.getElementById("category-select").value.trim(),
    };

    if (!job.businessName || !job.jobDescription || !job.datetime || !job.category) {
        alert("All fields are required, including the category.");
        return;
    }

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
            fetchJobs();
            resetForm();
        } else {
            alert(result.message || "Error posting job.");
        }
    } catch (error) {
        console.error("Error posting job:", error);
        alert("Error posting job.");
    }
}

// Reset form fields
function resetForm() {
    input.value = "";
    jobDescription.value = "";
    datetimeInput.value = "";
    document.getElementById("category-select").value = "";
}

// Fetch and display jobs
function fetchJobs() {
    const token = localStorage.getItem('token');
    fetch('https://shift-grab.vercel.app/api/getJobs', {
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
