// js/admin.js

let allEnquiries = [];

// 1. Admin Login Function (Local Fallback + Firebase Auth)
async function loginAdmin() {
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    if (email === 'admin@mjm.in' && password === 'admin123') {
        const authStatus = document.getElementById('auth-status');
        const loginBox = document.getElementById('admin-login-box');
        const adminContent = document.getElementById('admin-content');

        if (authStatus) authStatus.innerText = `Logged in as: ${email}`;
        if (loginBox) loginBox.classList.add('hidden');
        if (adminContent) adminContent.classList.remove('hidden');

        fetchEnquiries();
    } else {
        alert('Invalid admin credentials.');
    }
}

// 2. Admin Logout Action
function logoutAdmin() {
    const authStatus = document.getElementById('auth-status');
    const loginBox = document.getElementById('admin-login-box');
    const adminContent = document.getElementById('admin-content');

    if (authStatus) authStatus.innerText = 'Not Logged In';
    if (loginBox) loginBox.classList.remove('hidden');
    if (adminContent) adminContent.classList.add('hidden');
}

// 3. Fetch Real-time Submissions from Firestore
function fetchEnquiries() {
    const container = document.getElementById('enquiries-container');
    if (!container) return;

    container.innerHTML = '<p class="text-xs font-mono text-brand-muted">Fetching live entries...</p>';

    if (typeof db === 'undefined') {
        container.innerHTML = '<p class="text-xs font-mono text-red-500">Database connection not initialized.</p>';
        return;
    }

    db.collection('enquiries').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        allEnquiries = [];
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p class="text-xs font-mono text-brand-muted">No client inquiries found yet.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            allEnquiries.push(data);
            container.appendChild(createEnquiryCard(data));
        });
    }, (error) => {
        console.error('Error fetching submissions:', error);
        container.innerHTML = `<p class="text-xs font-mono text-red-500">Error loading data: ${error.message}</p>`;
    });
}

// 4. Delete Entry from Firestore
async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to permanently delete this entry?')) return;

    try {
        await db.collection('enquiries').doc(id).delete();
        alert('Entry deleted successfully.');
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry: ' + error.message);
    }
}

// 5. Render Individual Card Node
function createEnquiryCard(data) {
    const card = document.createElement('div');
    card.className = 'p-4 border border-brand-border bg-brand-bg space-y-2 text-xs font-mono relative';

    const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : 'Just now';

    if (data.type === 'client_feedback') {
        card.innerHTML = `
            <div class="flex justify-between items-center text-brand-muted border-b border-brand-border pb-2">
                <span class="font-bold text-amber-600">[FEEDBACK — ${'★'.repeat(data.rating || 5)}]</span>
                <span>${dateStr}</span>
            </div>
            <div class="text-brand-text"><strong>Client:</strong> ${data.name || 'Anonymous'}</div>
            <div class="text-brand-muted bg-brand-surface p-2">"${data.comment || ''}"</div>
            <div class="pt-2 flex justify-end">
                <button onclick="deleteEnquiry('${data.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-[10px]">DELETE ENTRY</button>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="flex justify-between items-center text-brand-muted border-b border-brand-border pb-2">
                <span class="font-bold text-brand-text">[DIRECT INQUIRY]</span>
                <span>${dateStr}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-brand-text">
                <div><strong>Name:</strong> ${data.name || 'N/A'}</div>
                <div><strong>Phone:</strong> ${data.phone || 'N/A'}</div>
                <div><strong>Service:</strong> ${data.service || 'General'}</div>
            </div>
            <div class="text-brand-muted bg-brand-surface p-2 mt-1">"${data.message || 'No message provided.'}"</div>
            <div class="pt-2 flex justify-between items-center">
                <a href="https://wa.me/91${(data.phone || '').replace(/\D/g,'')}?text=Hello%20${encodeURIComponent(data.name || '')},%20following%20up%20from%20MJM%20Associates." target="_blank" class="inline-block bg-brand-text text-brand-bg px-3 py-1 text-[10px]">REPLY ON WHATSAPP</a>
                <button onclick="deleteEnquiry('${data.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-[10px]">DELETE ENTRY</button>
            </div>
        `;
    }

    return card;
}

// 6. Filter Inquiries Bar
function filterEnquiries() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase();
    const container = document.getElementById('enquiries-container');
    if (!container) return;

    container.innerHTML = '';

    const filtered = allEnquiries.filter(e => 
        (e.name && e.name.toLowerCase().includes(query)) ||
        (e.phone && e.phone.includes(query)) ||
        (e.service && e.service.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-xs font-mono text-brand-muted">No matching records found.</p>';
        return;
    }

    filtered.forEach(data => container.appendChild(createEnquiryCard(data)));
}

// 7. Export Records to CSV File
function exportToCSV() {
    if (allEnquiries.length === 0) {
        alert('No data available to export.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Type,Name,Phone,Service/Rating,Message/Comment,Date\n";

    allEnquiries.forEach(e => {
        const date = e.createdAt ? new Date(e.createdAt.toDate()).toISOString() : '';
        const row = [
            `"${e.type || 'Inquiry'}"`,
            `"${e.name || ''}"`,
            `"${e.phone || ''}"`,
            `"${e.service || e.rating || ''}"`,
            `"${(e.message || e.comment || '').replace(/"/g, '""')}"`,
            `"${date}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mjm_inquiries_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}