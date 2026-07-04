// ========================================
// ADMIN.JS - Dashboard Admin
// ========================================

let currentFilter = {
    role: 'all',
    prodi: 'all',
    angkatan: 'all'
};

//  LOAD DASHBOARD 
async function loadDashboard() {
    try {
        const token = checkAuth();
        if (!token) return;

        const user = getUser();
        const nameEl = document.getElementById('adminName');
        const avatarEl = document.getElementById('adminAvatar');
        if (nameEl) nameEl.textContent = user.name || 'Admin';
        if (avatarEl) avatarEl.textContent = (user.name || 'A')[0].toUpperCase();

        if (document.getElementById('statsContainer')) {
            await loadStats();
        }
        if (document.getElementById('userTableBody')) {
            await loadUsers();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// LOAD STATISTIK 
async function loadStats() {
    try {
        const data = await fetchWithAuth('/dashboard/admin');
        if (data && data.data) {
            document.getElementById('totalDosen').textContent = data.data.total_dosen || 0;
            document.getElementById('totalMahasiswa').textContent = data.data.total_mahasiswa || 0;
            document.getElementById('totalKelas').textContent = data.data.total_kelas || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// LOAD USERS DENGAN MULTI FILTER
async function loadUsers(filter = null) {
    try {
        const data = await fetchWithAuth('/users');
        const tbody = document.getElementById('userTableBody');

        if (!tbody) return;

        let users = data.data || [];
        const activeFilter = filter || currentFilter;

        // 🔥 FILTER ROLE
        if (activeFilter.role !== 'all') {
            users = users.filter(u => u.role === activeFilter.role);
        }

        // 🔥 FILTER PRODI (hanya untuk mahasiswa)
        if (activeFilter.prodi !== 'all') {
            users = users.filter(u => u.prodi === activeFilter.prodi);
        }

        // 🔥 FILTER ANGKATAN (hanya untuk mahasiswa)
        if (activeFilter.angkatan !== 'all') {
            users = users.filter(u => u.angkatan === activeFilter.angkatan);
        }

        // 🔥 URUTKAN: ADMIN > DOSEN > MAHASISWA
        const roleOrder = { admin: 0, dosen: 1, mahasiswa: 2 };
        users.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

        if (users.length > 0) {
            tbody.innerHTML = '';
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.name}</td>
                    <td><span class="status-badge ${user.role}">${user.role}</span></td>
                    <td>${user.prodi || '-'}</td>
                    <td>${user.angkatan || '-'}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editUser(${user.id})">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada user dengan filter yang dipilih</td></tr>`;
        }

    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('userTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading data</td></tr>';
        }
    }
}

// ========== 4. APLIKASIKAN FILTER ==========
function applyFilters() {
    const role = document.getElementById('filterRole').value;
    const prodi = document.getElementById('filterProdi').value;
    const angkatan = document.getElementById('filterAngkatan').value;

    currentFilter.role = role;
    currentFilter.prodi = prodi;
    currentFilter.angkatan = angkatan;

    loadUsers();
}

// ========== 5. RESET FILTER ==========
function resetFilters() {
    document.getElementById('filterRole').value = 'all';
    document.getElementById('filterProdi').value = 'all';
    document.getElementById('filterAngkatan').value = 'all';

    currentFilter.role = 'all';
    currentFilter.prodi = 'all';
    currentFilter.angkatan = 'all';

    loadUsers();
}

// ========== 6. SHOW MODAL ==========
function showModal(role) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalTitle');
    const roleInput = document.getElementById('userRole');
    const prodiGroup = document.getElementById('prodiGroup');
    const angkatanGroup = document.getElementById('angkatanGroup');

    roleInput.value = role;
    title.textContent = role === 'dosen' ? 'Tambah Dosen' : 'Tambah Mahasiswa';
    prodiGroup.style.display = role === 'mahasiswa' ? 'block' : 'none';
    angkatanGroup.style.display = role === 'mahasiswa' ? 'block' : 'none';

    document.getElementById('userForm').reset();
    document.getElementById('editUserId').value = '';
    modal.classList.add('show');
}

// ========== 7. CLOSE MODAL ==========
function closeModal() {
    document.getElementById('userModal').classList.remove('show');
}

// ========== 8. HANDLE FORM SUBMIT ==========
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const role = document.getElementById('userRole').value;
    const username = document.getElementById('usernameInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const prodi = document.getElementById('prodiInput').value;
    const angkatan = document.getElementById('angkatanInput').value;
    const editId = document.getElementById('editUserId').value;

    if (!username || !name) {
        alert('Username dan nama wajib diisi!');
        return;
    }

    // 🔥 PASTIKAN USERNAME TERKIRIM!
    const data = { username, name };
    if (password) data.password = password;
    if (role === 'mahasiswa') {
        data.prodi = prodi;
        data.angkatan = angkatan;
    }

    try {
        let response;
        if (editId) {
            // 🔥 EDIT USER → kirim data lengkap termasuk username
            response = await fetchWithAuth(`/users/${editId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            const url = role === 'dosen' ? '/users/dosen' : '/users/mahasiswa';
            response = await fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response && response.status === 200) {
            alert(response.message || 'Berhasil!');
            closeModal();
            loadUsers(currentFilter || 'all');
            if (document.getElementById('statsContainer')) {
                loadStats();
            }
        } else {
            alert(response.message || 'Gagal!');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Terjadi kesalahan!');
    }
});

// ========== 9. EDIT USER ==========
async function editUser(id) {
    try {
        const data = await fetchWithAuth(`/users`);
        const user = data.data.find(u => u.id == id);
        if (!user) {
            alert('User tidak ditemukan');
            return;
        }

        const modal = document.getElementById('userModal');
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('userRole').value = user.role;
        document.getElementById('editUserId').value = user.id;
        document.getElementById('usernameInput').value = user.username;
        document.getElementById('nameInput').value = user.name;
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').placeholder = 'Kosongkan jika tidak diubah';

        if (user.role === 'mahasiswa') {
            document.getElementById('prodiGroup').style.display = 'block';
            document.getElementById('angkatanGroup').style.display = 'block';
            document.getElementById('prodiInput').value = user.prodi || 'TI';
            document.getElementById('angkatanInput').value = user.angkatan || '2024';
        } else {
            document.getElementById('prodiGroup').style.display = 'none';
            document.getElementById('angkatanGroup').style.display = 'none';
        }

        modal.classList.add('show');
    } catch (error) {
        console.error('Error editing user:', error);
        alert('Gagal memuat data user!');
    }
}

// ========== 10. DELETE USER ==========
async function deleteUser(id) {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
        const response = await fetchWithAuth(`/users/${id}`, {
            method: 'DELETE'
        });

        if (response && response.status === 200) {
            alert('User berhasil dihapus!');
            loadUsers();
            if (document.getElementById('statsContainer')) {
                loadStats();
            }
        } else {
            alert(response.message || 'Gagal menghapus user!');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Terjadi kesalahan!');
    }
}

// ========== 11. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadDashboard);