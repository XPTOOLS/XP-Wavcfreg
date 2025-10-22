const ADMIN_PASSWORD = "xpadmin"; // Change this password here
const dashboard = document.getElementById('dashboard');
const loginSection = document.getElementById('login-section');
const totalEl = document.getElementById('total');
const targetEl = document.getElementById('target');
const tbody = document.querySelector('#users-table tbody');
const newTargetInput = document.getElementById('new-target');
const prefixInput = document.getElementById('name-prefix');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');

let currentPage = 0;
const usersPerPage = 10;

function login() {
    const pass = document.getElementById('admin-pass').value;
    if (pass === ADMIN_PASSWORD) {
        loginSection.style.display = 'none';
        dashboard.style.display = 'block';
        loadStats();
        loadUsers();
        loadPrefix();
    } else {
        alert('Incorrect password!');
    }
}

async function loadStats() {
    try {
        const res = await fetch('/stats');
        const data = await res.json();
        totalEl.textContent = data.total_users;
        targetEl.textContent = data.target;
    } catch (e) { console.error(e); }
}

async function loadUsers() {
    try {
        const res = await fetch(`/get_contacts?page=${currentPage}&limit=${usersPerPage}`);
        const users = await res.json();
        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.name || ''}</td>
                <td>${user.username || ''}</td>
                <td>${user.phone || ''}</td>
            `;
            tbody.appendChild(tr);
        });
        updatePagination();
    } catch (e) { console.error(e); }
}

async function loadPrefix() {
    try {
        const res = await fetch('/get_prefix');
        const data = await res.json();
        prefixInput.value = data.prefix || '';
    } catch (e) { console.error(e); }
}

async function updateTarget() {
    const target = parseInt(newTargetInput.value);
    if (!target || target < 0) return alert('Enter a valid target!');
    try {
        const res = await fetch('/update_target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target })
        });
        if (res.ok) {
            loadStats();
            newTargetInput.value = '';
            alert('Target updated!');
        }
    } catch (e) { console.error(e); }
}

async function updatePrefix() {
    const prefix = prefixInput.value.trim();
    try {
        const res = await fetch('/update_prefix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix })
        });
        if (res.ok) {
            alert('Prefix updated!');
        }
    } catch (e) { console.error(e); }
}

async function generateVCF() {
    try {
        const res = await fetch('/generate_vcf');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts.vcf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
}

async function clearContacts() {
    if (confirm('Are you sure you want to clear all contacts? This action cannot be undone!')) {
        try {
            const res = await fetch('/clear_contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await res.json();
            if (result.success) {
                loadUsers();
                loadStats();
                alert('All contacts have been cleared!');
            } else {
                alert(result.message || 'Failed to clear contacts!');
            }
        } catch (e) {
            console.error('Error clearing contacts:', e);
            alert('An error occurred. Please try again.');
        }
    }
}

function updatePagination() {
    const totalUsers = parseInt(totalEl.textContent) || 0;
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    prevPageBtn.disabled = currentPage === 0;
    nextPageBtn.disabled = currentPage >= totalPages - 1 || totalPages === 0;
}

function changePage(delta) {
    const totalUsers = parseInt(totalEl.textContent) || 0;
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    currentPage += delta;
    if (currentPage < 0) currentPage = 0;
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    loadUsers();
}

// Auto-refresh every 12s
setInterval(() => {
    if (dashboard.style.display !== 'none') {
        loadStats();
        loadUsers();
    }
}, 12000);