const jobDescription = document.getElementById("job-description");
const postJobForm = document.getElementById("post-job-form");
const postShiftButton = document.querySelector("button[type='submit']");


// Add event listeners for form submission
postJobForm.addEventListener("submit", handleJobPost);

   // Update selectedShiftOption when a shift is selected
   const shiftDropdown = document.getElementById('shift-selector');
   if (shiftDropdown) {
       shiftDropdown.addEventListener('change', (event) => {
           window.selectedShiftOption = event.target.value;
           console.log(`Shift type selected: ${window.selectedShiftOption}`);
       });
   } else {
       console.error('Shift dropdown not found');
   }


   // Load categories
   loadCategories();


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
