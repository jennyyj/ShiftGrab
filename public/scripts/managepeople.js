async function viewPhoneNumbers() {
    console.log("View Phone Numbers button clicked"); // Check if this logs
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("User is not logged in.");
        window.location.href = 'login.html';
        return;
    }
    try {
        const response = await fetch('https://shift-grab.vercel.app/api/getPhoneNumbers', {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch phone numbers: ${response.statusText}`);
        }
        const phoneNumbers = await response.json();
        displayPhoneNumbers(phoneNumbers);
    } catch (error) {
        console.error("Error fetching phone numbers:", error);
    }
}

function displayPhoneNumbers(phoneNumbers) {
    const list = document.getElementById('phone-list');
    if (!list) {
        console.error("Phone list element not found in the DOM");
        return;
    }
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
    if (!token) {
        console.error("User is not logged in.");
        window.location.href = 'login.html';
        return;
    }
    try {
        const response = await fetch('https://shift-grab.vercel.app/api/deletePhoneNumber', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number }),
        });
        if (response.ok) {
            alert('Phone number deleted successfully.');
            viewPhoneNumbers(); // Refresh the phone numbers list
        } else {
            throw new Error('Failed to delete phone number');
        }
    } catch (error) {
        console.error('Error deleting phone number:', error);
    }
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
    if (!token) {
        console.error("User is not logged in.");
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/addPhoneNumber', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, number, category }),
        });

        if (response.ok) {
            alert("Phone number added successfully.");
            document.getElementById('add-phone-form').style.display = 'none';
            viewPhoneNumbers(); // Refresh the list
        } else {
            throw new Error('Failed to add phone number');
        }
    } catch (error) {
        console.error('Error adding phone number:', error);
    }
}
