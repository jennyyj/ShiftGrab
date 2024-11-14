const jobDescription = document.getElementById("job-description");
const postJobForm = document.getElementById("post-job-form");
const postShiftButton = document.querySelector("button[type='submit']");

// User Shift Times object
let userShiftTimes = {};

// Add event listeners
postJobForm?.addEventListener("submit", handleJobPost);
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, fetching user info...");
    fetchUserInfo().then(renderShiftSelector);
    loadCategories();
});

// Fetch User Info
async function fetchUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    try {
        const response = await fetch('https://shift-grab.vercel.app/api/getUserInfo', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const userData = await response.json();
        console.log('User data received:', userData);

        document.getElementById('business-name')?.value = userData.username;
        userShiftTimes = userData.preferences?.shiftTimes || {};

        const categorySelect = document.getElementById('category-select');
        categorySelect.innerHTML = `<option value="" disabled selected>Select Category</option>`;
        userData.categories?.forEach(category => {
            categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
        });

        return userData;
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// React Component: ShiftSelector
const ShiftSelector = ({ shiftTimes }) => {
    const [selectedOption, setSelectedOption] = React.useState('');
    const [showCustom, setShowCustom] = React.useState(false);
    const [customTimes, setCustomTimes] = React.useState({
        startDate: '',
        startTime: '',
        endTime: ''
    });

    const handleShiftChange = (e) => {
        const value = e.target.value;
        setSelectedOption(value);
        setShowCustom(value === 'custom');
        window.selectedShiftOption = value;
    };

    const dateInputRef = React.useRef(null);
    const startTimeInputRef = React.useRef(null);
    const endTimeInputRef = React.useRef(null);

    const handleCalendarClick = () => dateInputRef.current?.showPicker();
    const handleClockClick = (inputRef) => inputRef.current?.showPicker();

    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('select', {
            value: selectedOption,
            onChange: handleShiftChange,
            className: 'shift-select',
            'aria-label': 'Select shift time'
        },
            React.createElement('option', { value: '' }, 'Select shift time'),
            shiftTimes?.morning && React.createElement('option', { value: 'morning' }, `Morning (${shiftTimes.morning.start} - ${shiftTimes.morning.end})`),
            shiftTimes?.midday && React.createElement('option', { value: 'midday' }, `Midday (${shiftTimes.midday.start} - ${shiftTimes.midday.end})`),
            shiftTimes?.night && React.createElement('option', { value: 'night' }, `Night (${shiftTimes.night.start} - ${shiftTimes.night.end})`),
            React.createElement('option', { value: 'custom' }, 'Custom Time')
        ),
        showCustom && React.createElement('div', { className: 'custom-time-container' },
            React.createElement('div', { className: 'input-container' },
                React.createElement('button', {
                    type: 'button',
                    onClick: handleCalendarClick,
                    className: 'icon-button',
                    'aria-label': 'Open date picker'
                },
                    React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: '#4484E3', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                        React.createElement('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
                        React.createElement('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
                        React.createElement('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
                        React.createElement('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
                    )
                ),
                React.createElement('input', {
                    ref: dateInputRef,
                    type: 'date',
                    value: customTimes.startDate,
                    onChange: (e) => setCustomTimes({ ...customTimes, startDate: e.target.value }),
                    className: 'shift-input',
                    placeholder: 'mm/dd/yyyy'
                })
            ),
            React.createElement('div', { className: 'time-inputs-grid' },
                React.createElement('div', { className: 'input-container' },
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => handleClockClick(startTimeInputRef),
                        className: 'icon-button',
                        'aria-label': 'Open start time picker'
                    },
                        React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: '#4484E3', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                            React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
                            React.createElement('polyline', { points: '12 6 12 12 16 14' })
                        )
                    ),
                    React.createElement('input', {
                        ref: startTimeInputRef,
                        type: 'time',
                        value: customTimes.startTime,
                        onChange: (e) => setCustomTimes({ ...customTimes, startTime: e.target.value }),
                        className: 'shift-input'
                    })
                ),
                React.createElement('div', { className: 'input-container' },
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => handleClockClick(endTimeInputRef),
                        className: 'icon-button',
                        'aria-label': 'Open end time picker'
                    },
                        React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: '#4484E3', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                            React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
                            React.createElement('polyline', { points: '12 6 12 12 16 14' })
                        )
                    ),
                    React.createElement('input', {
                        ref: endTimeInputRef,
                        type: 'time',
                        value: customTimes.endTime,
                        onChange: (e) => setCustomTimes({ ...customTimes, endTime: e.target.value }),
                        className: 'shift-input'
                    })
                )
            )
        )
    );
};

// Render ShiftSelector Component
function renderShiftSelector() {
    const rootElement = document.getElementById('shift-selector-root');
    if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(ShiftSelector, { shiftTimes: userShiftTimes }));
    }
}

// Handle Job Posting
async function handleJobPost(e) {
    e.preventDefault();
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
        const [startDate, startTime, endTime] = [
            document.querySelector("input[type='date']").value,
            document.querySelector("input[type='time']").value,
            document.querySelectorAll("input[type='time']")[1].value
        ];

        if (!startDate || !startTime || !endTime) {
            alert("Please complete the custom shift details.");
            postShiftButton.disabled = false;
            return;
        }
        shiftData = { type: 'custom', date: startDate, startTime, endTime };
    } else if (window.selectedShiftOption) {
        shiftData = { type: window.selectedShiftOption, startTime: '06:00', endTime: '14:00' }; // Example times
    } else {
        alert("Please select a shift type.");
        postShiftButton.disabled = false;
        return;
    }

    const job = {
        businessName: document.getElementById('business-name')?.value.trim(),
        jobDescription: jobDescription?.value.trim() || '',
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

// Reset Form Fields
function resetForm() {
    jobDescription.value = "";
    document.getElementById("category-select").value = "";
    const shiftSelectorRoot = document.getElementById('shift-selector-root');
    const shiftSelector = shiftSelectorRoot?._reactRootContainer?._internalRoot?.current;
    shiftSelector?.memoizedProps?.onChange({ target: { value: '' } });
}

// Utility Functions
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function toggleNav() {
    const drawer = document.getElementById('navDrawer');
    const overlay = document.getElementById('overlay');
    drawer.classList.toggle('open');
    overlay.classList.toggle('show');
}

// Attach Functions to Window for Global Use
window.handleLogout = handleLogout;
window.toggleNav = toggleNav;
window.renderShiftSelector = renderShiftSelector;

// Category Management Functions
async function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/getCategories', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const categories = await response.json();
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';

        categories.forEach(category => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `${category.name} <button onclick="removeCategory('${category.name}')">Remove</button>`;
            categoryList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function removeCategory(categoryName) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to remove a category.");
        return;
    }

    try {
        const response = await fetch('https://shift-grab.vercel.app/api/removeCategory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ categoryName }),
        });
        const result = await response.json();

        if (response.ok) {
            alert("Category removed successfully!");
            loadCategories();
        } else {
            alert(result.message || "Error removing category.");
        }
    } catch (error) {
        console.error("Error removing category:", error);
        alert("Error removing category.");
    }
}

// Attach Category Management Functions to Window
window.loadCategories = loadCategories;
window.removeCategory = removeCategory;

// Additional Utility Functions for Handling Phone Numbers, Shifts, etc.
async function viewPhoneNumbers() {
    console.log("View Phone Numbers button clicked");
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

// Make Utility Functions Globally Accessible
window.viewPhoneNumbers = viewPhoneNumbers;
window.deletePhoneNumber = deletePhoneNumber;
window.saveNewPhoneNumber = saveNewPhoneNumber;
