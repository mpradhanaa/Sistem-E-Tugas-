// ========================================
// AUTH.JS - Login, Logout, & Token Helper
// ========================================

const API_URL = '/api/v1'; // 

// ========== 1. LOGIN ==========
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorEl = document.getElementById('errorMessage');

        if (!username || !password) {
            errorEl.textContent = 'Username dan password wajib diisi!';
            errorEl.classList.add('show');
            return;
        }

        errorEl.classList.remove('show');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Simpan token & user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect berdasarkan role
                if (data.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (data.role === 'dosen') {
                    window.location.href = 'dosen-dashboard.html';
                } else if (data.role === 'mahasiswa') {
                    window.location.href = 'mahasiswa-dashboard.html';
                }
            } else {
                errorEl.textContent = data.message || 'Login gagal. Cek username dan password.';
                errorEl.classList.add('show');
            }
        } catch (error) {
            errorEl.textContent = 'Terjadi kesalahan. Pastikan server backend berjalan.';
            errorEl.classList.add('show');
            console.error('Login error:', error);
        }
    });
});

// ========== 2. CEK AUTH (UNTUK HALAMAN DASHBOARD) ==========
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

// ========== 3. GET USER DATA ==========
function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

// ========== 4. LOGOUT ==========
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ========== 5. FETCH WITH AUTH ==========
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    // Jika body berupa FormData, jangan set Content-Type (biar browser yang set)
    if (options.body instanceof FormData) {
        delete mergedOptions.headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}${url}`, mergedOptions);
    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        throw new Error('Sesi habis, silakan login ulang');
    }

    return data;
}

// ========================================
// 6. UBAH PASSWORD (DOSEN & MAHASISWA)
// ========================================

// ========== SHOW MODAL UBAH PASSWORD ==========
function showChangePassword() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('passwordForm').reset();
        const msg = document.getElementById('passwordMessage');
        if (msg) {
            msg.style.display = 'none';
            msg.textContent = '';
        }
    } else {
        console.error('❌ Modal password tidak ditemukan!');
        alert('Terjadi kesalahan. Modal tidak ditemukan.');
    }
}

// ========== CLOSE MODAL UBAH PASSWORD ==========
function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ========== HANDLE UBAH PASSWORD ==========
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageEl = document.getElementById('passwordMessage');

        // 🔥 VALIDASI
        if (newPassword !== confirmPassword) {
            messageEl.textContent = '❌ Konfirmasi password tidak cocok';
            messageEl.style.color = 'red';
            messageEl.style.display = 'block';
            return;
        }

        if (newPassword.length < 6) {
            messageEl.textContent = '❌ Password baru minimal 6 karakter';
            messageEl.style.color = 'red';
            messageEl.style.display = 'block';
            return;
        }

        messageEl.style.display = 'none';
        const saveBtn = document.getElementById('savePasswordBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Menyimpan...';

        try {
            const response = await fetchWithAuth('/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            if (response && response.status === 200) {
                messageEl.textContent = '✅ ' + response.message;
                messageEl.style.color = 'green';
                messageEl.style.display = 'block';
                setTimeout(() => {
                    closePasswordModal();
                    alert('Password berhasil diubah!');
                }, 1500);
            } else {
                messageEl.textContent = '❌ ' + (response.message || 'Gagal mengubah password');
                messageEl.style.color = 'red';
                messageEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Change password error:', error);
            messageEl.textContent = '❌ Terjadi kesalahan. Coba lagi.';
            messageEl.style.color = 'red';
            messageEl.style.display = 'block';
        }

        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Simpan';
    });
});

// ========== TUTUP MODAL SAAT KLIK DI LUAR ==========
document.addEventListener('click', function(e) {
    const modal = document.getElementById('passwordModal');
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});