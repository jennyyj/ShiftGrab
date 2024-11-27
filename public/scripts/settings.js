document.addEventListener('DOMContentLoaded', () => {
    // References to all time inputs
    const timeInputs = {
        morningStart: document.getElementById('morning-start'),
        morningEnd: document.getElementById('morning-end'),
        middayStart: document.getElementById('midday-start'),
        middayEnd: document.getElementById('midday-end'),
        nightStart: document.getElementById('night-start'),
        nightEnd: document.getElementById('night-end')
    };

    // Add click handlers for each icon button
    document.querySelectorAll('.icon-button').forEach(button => {
        button.addEventListener('click', () => {
            // Find the associated input (next sibling)
            const input = button.nextElementSibling;
            if (input) {
                input.showPicker();
            }
        });
    });

    // Add click handlers for inputs
    Object.values(timeInputs).forEach(input => {
        const button = input.previousElementSibling;
        if (button && button.classList.contains('icon-button')) {
            button.addEventListener('click', () => {
                input.showPicker();
            });
        }
    });
});

// Make times readable
function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
        const date = new Date(`2000-01-01T${timeStr}`);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
        return timeStr;
    }
}

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

async function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No valid token found, cannot load categories.");
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
        if (categoryList) {
            categoryList.innerHTML = ''; // Clear any previous content
            categories.forEach(category => {
                const listItem = document.createElement('li');
                listItem.textContent = category.name;
                categoryList.appendChild(listItem);
            });
        } else {
            console.error("Category list element not found in the DOM");
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    // Load user preferences when the page loads
    loadUserPreferences();

    // Add event listener to save shift times button
    const saveShiftButton = document.querySelector('.settings-button');
    if (saveShiftButton) {
        saveShiftButton.addEventListener('click', saveShiftTimes);
    } else {
        console.error("Save shift times button not found in the DOM");
    }

    // Add event listener to add category button
    const addCategoryButton = document.getElementById('add-category-btn');
    if (addCategoryButton) {
        addCategoryButton.addEventListener('click', addCategory);
    } else {
        console.error("Add category button not found in the DOM");
    }

    // Add event listener to update credentials button
    const updateCredentialsButton = document.getElementById('update-credentials-btn');
    if (updateCredentialsButton) {
        updateCredentialsButton.addEventListener('click', updateUserCredentials);
    } else {
        console.error("Update credentials button not found in the DOM");
    }
});
