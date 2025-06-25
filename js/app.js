/* <------------ LINK ACTIVE ----------> */

const linkColor = document.querySelectorAll('.nav_link')
function colorLink(){
  linkColor.forEach(l => l.classList.remove('active-link'))
  this.classList.add('active-link')
}
linkColor.forEach(l => l.addEventListener('click', colorLink))

/* <------------ SHOW HIDDEN MENU ----------> */

const showMenu = (toggleId, navbarId) =>{
  const toggle = document.getElementById(toggleId),
  navbar = document.getElementById(navbarId)
  if(toggle && navbar){
      toggle.addEventListener('click', ()=>{

          /* Show menu */
          navbar.classList.toggle('show-menu')
          
          /* Rotate toggle icon */
          toggle.classList.toggle('rotate-icon')
      })
  }
}
showMenu('nav-toggle','nav')

// Thread storage management
const THREADS_STORAGE_KEY = 'forum_threads';

// Initialize threads array in localStorage if it doesn't exist
if (!localStorage.getItem(THREADS_STORAGE_KEY)) {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify([]));
}

// Thread Modal Functions
function openThreadModal() {
    const modal = document.getElementById('createThreadModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeThreadModal() {
    const modal = document.getElementById('createThreadModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('threadForm');
        if (form) form.reset();
    }
}

function submitThread(event) {
    event.preventDefault();

    const titleInput = document.getElementById('threadTitle');
    const contentInput = document.getElementById('threadContent');
    const categorySelect = document.getElementById('threadCategory');
    const tagsInput = document.getElementById('threadTags');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const category = categorySelect.value;
    const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (!title || !content || !category) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            throw new Error('You must be logged in to create a thread');
        }

        const threads = JSON.parse(localStorage.getItem(THREADS_STORAGE_KEY) || '[]');
        
        const newThread = {
            id: Date.now().toString(),
            title,
            content,
            authorId: currentUser.studentId,
            authorName: currentUser.username,
            category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            likes: 0,
            replies: [],
            tags: tags
        };

        // Add thread to storage
        threads.push(newThread);
        localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));

        // Update user's post count
        const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));
        const userIndex = users.findIndex(u => u.studentId === currentUser.studentId);
        if (userIndex !== -1) {
            users[userIndex].posts += 1;
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }

        // Close modal and clear form
        closeThreadModal();

        // Refresh thread displays
        displayThreads();
        displayRecentThreads();
    } catch (error) {
        alert(error.message || 'Failed to create thread. Please try again.');
    }
}

function displayThreads(filterTag = 'All') {
    const threadsContainer = document.getElementById('threadsContainer');
    if (!threadsContainer) return;

    const threads = JSON.parse(localStorage.getItem(THREADS_STORAGE_KEY) || '[]');
    const currentPage = window.location.pathname;
    
    // Filter threads based on current page
    let filteredThreads = threads;
    
    if (currentPage.includes('academic')) {
        filteredThreads = threads.filter(thread => 
            ['Research', 'Publications', 'Conferences'].includes(thread.category));
    } else if (currentPage.includes('general')) {
        filteredThreads = threads.filter(thread => 
            ['Chat', 'Questions', 'Help'].includes(thread.category));
    } else if (currentPage.includes('news')) {
        filteredThreads = threads.filter(thread => 
            ['Announcements', 'Updates', 'Events'].includes(thread.category));
    }

    // Apply tag filter if not 'All'
    if (filterTag !== 'All') {
        filteredThreads = filteredThreads.filter(thread => thread.category === filterTag);
    }

    if (filteredThreads.length === 0) {
        threadsContainer.innerHTML = '<div class="no-threads">No threads found. Be the first to create one!</div>';
        return;
    }

    // Sort threads by creation date (newest first)
    const sortedThreads = filteredThreads.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    threadsContainer.innerHTML = sortedThreads.map(thread => `
        <div class="threads-icon">
            <div class="icon">
                <i class='bx bx-message-square-detail'></i>
            </div>
            <div class="threads-text">
                <div class="threads-main">
                    <div class="title-and-tag">
                        <div class="threads-title">${thread.title}</div>
                        <div class="threads-tag" data-category="${thread.category}">${thread.category}</div>
                    </div>
                    <div class="threads-content">${thread.content}</div>
                    <div class="threads-info">
                        <span class="threads-creator">By ${thread.authorName}</span>
                        <span class="threads-time">${formatDate(thread.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 86400000) {
        if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
    }
    
    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
}

// Handle tag filtering
function setupTagFilters() {
    const tagButtons = document.querySelectorAll('.tags-count');
    
    tagButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all buttons
            tagButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the filter value and update display
            const filterValue = button.querySelector('.tags-name').textContent;
            displayThreads(filterValue);
        });
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('createThreadModal');
    if (event.target === modal) {
        closeThreadModal();
    }
}

function displayRecentThreads() {
    const recentThreadsContainer = document.querySelector('.recent-threads');
    if (!recentThreadsContainer) return;

    const threads = JSON.parse(localStorage.getItem(THREADS_STORAGE_KEY) || '[]');
    
    // Sort threads by creation date (newest first) and take the 5 most recent
    const recentThreads = threads
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentThreads.length === 0) {
        recentThreadsContainer.innerHTML = '<div class="no-threads">No recent threads</div>';
        return;
    }

    recentThreadsContainer.innerHTML = recentThreads.map(thread => `
        <div class="threads-icon">
            <div class="icon">
                <i class='bx bx-message-square-detail'></i>
            </div>
            <div class="threads-text">
                <div class="threads-main">
                    <div class="title-and-tag">
                        <div class="threads-title">${thread.title}</div>
                        <div class="threads-tag" data-category="${thread.category}">${thread.category}</div>
                    </div>
                    <div class="threads-info">
                        <span class="threads-creator">By ${thread.authorName}</span>
                        <span class="threads-time">${formatDate(thread.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize page based on current location
document.addEventListener('DOMContentLoaded', () => {
    // Display threads and setup filters
    displayThreads('All');
    setupTagFilters();
    displayRecentThreads();
    
    // Set 'All' tag as active by default
    const allTag = document.querySelector('.tags-count');
    if (allTag) {
        allTag.classList.add('active');
    }
});