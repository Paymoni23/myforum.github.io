// State variables
let allMembers = [];
let currentPage = 1;
const membersPerPage = 12;
let currentFilter = 'all';
let currentSort = 'newest';
let searchTerm = '';

// Fetch members from the server
async function fetchMembers() {
    try {
        const response = await fetch('/data/users.json');
        if (!response.ok) throw new Error('Failed to fetch members');
        allMembers = await response.json();
        // Remove password field from each member
        allMembers = allMembers.map(member => {
            const { password, ...memberWithoutPassword } = member;
            return memberWithoutPassword;
        });
        updateMembersList();
        updateStatistics();
    } catch (error) {
        console.error('Error fetching members:', error);
    }
}

// Filter and sort members
function getFilteredMembers() {
    let filtered = [...allMembers];

    // Apply role filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(member => member.role === currentFilter);
    }

    // Apply search
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(member => 
            member.username.toLowerCase().includes(term) ||
            member.studentId.includes(term)
        );
    }

    // Apply sorting
    switch (currentSort) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
            break;
        case 'posts':
            filtered.sort((a, b) => b.posts - a.posts);
            break;
        case 'name':
            filtered.sort((a, b) => a.username.localeCompare(b.username));
            break;
    }

    return filtered;
}

// Update members list display
function updateMembersList() {
    const filteredMembers = getFilteredMembers();
    const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
    const start = (currentPage - 1) * membersPerPage;
    const end = start + membersPerPage;
    const pageMembers = filteredMembers.slice(start, end);

    const membersList = document.getElementById('membersList');
    membersList.innerHTML = pageMembers.map(member => `
        <div class="member-card">
            <div class="member-header">
                <div class="user-avatar">
                    <i class='bx bxs-user'></i>
                </div>
                <div class="member-info">
                    <h3 class="member-name">${member.username}</h3>
                    <span class="member-studentid">ID: ${member.studentId}</span>
                    <span class="member-role role-${member.role}">${member.role}</span>
                </div>
            </div>
            <div class="member-stats">
                <div class="member-stat">
                    <div class="stat-value">${member.posts}</div>
                    <div class="stat-label">Posts</div>
                </div>
                <div class="member-stat">
                    <div class="stat-value">${member.likes || 0}</div>
                    <div class="stat-label">Likes</div>
                </div>
                <div class="member-stat">
                    <div class="stat-value">${formatDate(member.joinDate)}</div>
                    <div class="stat-label">Joined</div>
                </div>
            </div>
        </div>
    `).join('');

    // Update pagination
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

// Update statistics
function updateStatistics() {
    const totalMembers = allMembers.length;
    const today = new Date().toDateString();
    const newToday = allMembers.filter(m => new Date(m.joinDate).toDateString() === today).length;
    const mostActive = allMembers.sort((a, b) => b.posts - a.posts)[0]?.username || '-';

    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('newToday').textContent = newToday;
    document.getElementById('mostActive').textContent = mostActive;
}

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    fetchMembers();

    // Role filter
    document.getElementById('roleFilter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        updateMembersList();
    });

    // Sort filter
    document.getElementById('sortFilter').addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        updateMembersList();
    });

    // Search
    let searchTimeout;
    document.getElementById('memberSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = e.target.value;
            currentPage = 1;
            updateMembersList();
        }, 300);
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateMembersList();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(getFilteredMembers().length / membersPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateMembersList();
        }
    });
}); 