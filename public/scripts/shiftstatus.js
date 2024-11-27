document.addEventListener('DOMContentLoaded', () => {
    // Fetch the recent shift when the page loads
    if (document.getElementById('recent-shift')) {
        fetchRecentShift();
    }

    // Attach event listeners for past shift filter buttons
    const allShiftsBtn = document.querySelector('#all-shifts-btn');
    const removedShiftsBtn = document.querySelector('#removed-shifts-btn');
    const claimedShiftsBtn = document.querySelector('#claimed-shifts-btn');
    const unclaimedShiftsBtn = document.querySelector('#unclaimed-shifts-btn');

    if (allShiftsBtn && removedShiftsBtn && claimedShiftsBtn && unclaimedShiftsBtn) {
        allShiftsBtn.addEventListener('click', () => {
            console.log('All shifts button clicked');
            fetchPastShifts('all');
        });

        removedShiftsBtn.addEventListener('click', () => {
            console.log('Removed shifts button clicked');
            fetchPastShifts('removed');
        });

        claimedShiftsBtn.addEventListener('click', () => {
            console.log('Claimed shifts button clicked');
            fetchPastShifts('claimed');
        });

        unclaimedShiftsBtn.addEventListener('click', () => {
            console.log('Not claimed shifts button clicked');
            fetchPastShifts('unclaimed');
        });
    } else {
        console.error('One or more shift filter buttons not found.');
    }
});

async function fetchRecentShift() {
    const token = localStorage.getItem('token');
    const jobId = localStorage.getItem('lastPostedJobId'); // Ensure this is stored when posting a shift

    if (!token) {
        console.error("Token not found in local storage");
        document.getElementById('recent-shift').innerHTML = "You must be logged in to view recent shifts.";
        return;
    }

    if (!jobId) {
        console.error("Job ID not found in local storage");
        document.getElementById('recent-shift').innerHTML = "No recent shift found.";
        return;
    }

    try {
        const response = await fetch(`https://shift-grab.vercel.app/api/getJob/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch recent shift: ${response.statusText}`);
        }

        const job = await response.json();
        const recentShiftContainer = document.getElementById('recent-shift');
        recentShiftContainer.innerHTML = `
            <div class="posted-shift">
                <h2>POSTED SHIFT</h2>
                <p><strong>Date:</strong> ${new Date(job.shift.date).toLocaleDateString()}</p>
                <p><strong>Shift:</strong> ${job.shift.type.toUpperCase()}</p>
                <p><strong>Job Description:</strong> ${job.jobDescription || 'None'}</p>
                <button class="remove-shift-btn" onclick="removeShift('${job._id}')">REMOVE SHIFT</button>
            </div>
            <div class="shift-status">
                <h2>STATUS</h2>
                <p class="${job.status}-status">${job.status.toUpperCase()}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching recent shift:', error);
    }
}

async function fetchPastShifts(filter) {
    console.log(`Fetching past shifts with filter: ${filter}`);
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Token not found in local storage");
        alert("You must be logged in to view past shifts.");
        return;
    }

    try {
        const response = await fetch(`https://shift-grab.vercel.app/api/getPastShifts?filter=${filter}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch past shifts: ${response.statusText}`);
        }

        const shifts = await response.json();
        console.log("Shifts data received:", shifts);

        const pastShiftContainer = document.getElementById('past-shifts-container');
        if (pastShiftContainer) {
            // Clear previous content
            pastShiftContainer.innerHTML = '';

            // Map through shifts to create HTML elements
            pastShiftContainer.innerHTML = shifts.map(shift => `
                <div class="past-shift">
                    <p><strong>Date/Time:</strong> ${new Date(shift.shift.date).toLocaleString()}</p>
                    <p><strong>Shift:</strong> ${shift.shift.type.toUpperCase()}</p>
                    <p><strong>Category:</strong> ${shift.category}</p>
                    <p><strong>Job Description:</strong> ${shift.jobDescription || 'None'}</p>
                    <p><strong>Status:</strong> ${shift.status}</p>
                    <p class="${shift.status}-status">${shift.status.toUpperCase()}</p>
                </div>
            `).join('');
        } else {
            console.error('Past shift container not found.');
        }
    } catch (error) {
        console.error('Error fetching past shifts:', error);
    }
}

async function removeShift(shiftId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/removeShift/${shiftId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            alert('Shift removed successfully.');
            fetchRecentShift(); // Refresh the recent shift display
        } else {
            throw new Error('Failed to remove shift');
        }
    } catch (error) {
        console.error('Error removing shift:', error);
    }
}
