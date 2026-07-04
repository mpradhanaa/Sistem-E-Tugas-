// ========================================
// AUTH.JS - Login, Logout, & Token Helper
// ========================================

const API_URL = 'http://localhost:8080/api/v1';  // 🔥 PAKE LOCALHOST

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
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('user', JSON.stringify(data.user));

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
            console.error('Login error:', error);
            errorEl.textContent = 'Terjadi kesalahan. Pastikan server backend berjalan.';
            errorEl.classList.add('show');
        }
    });
});

// ========== 2. CEK AUTH ==========
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

// ========== 3. GET USER ==========
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