// ========================================
// MAHASISWA.JS - Dashboard Mahasiswa
// ========================================

// ========== 1. LOAD DASHBOARD ==========
async function loadDashboard() {
    try {
        const token = checkAuth();
        if (!token) return;

        const user = getUser();
        document.getElementById('mhsName').textContent = user.name || 'Mahasiswa';
        document.getElementById('mhsAvatar').textContent = (user.name || 'M')[0].toUpperCase();
        
        // Info mahasiswa
        document.getElementById('mhsNama').textContent = user.name || '-';
        document.getElementById('mhsNpm').textContent = user.username || '-';
        document.getElementById('mhsProdi').textContent = user.prodi || '-';
        document.getElementById('mhsAngkatan').textContent = user.angkatan || '-';

        await loadStats();
        await loadTugas();
        await loadDeadlineTugas();
        if (typeof refreshKelasFilter === 'function') {
            refreshKelasFilter();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ========== 2. LOAD STATISTIK ==========
async function loadStats() {
    try {
        const data = await fetchWithAuth('/mahasiswa/dashboard');
        if (data && data.data) {
            document.getElementById('totalKelas').textContent = data.data.total_kelas || 0;
            document.getElementById('totalTugas').textContent = data.data.total_tugas || 0;
            document.getElementById('totalSelesai').textContent = data.data.total_selesai || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}
// ========== 3. LOAD TUGAS ==========
async function loadTugas() {
    try {
        const data = await fetchWithAuth('/mahasiswa/tugas');
        const tbody = document.getElementById('tugasTableBody');

        if (!tbody) return;

        const tugas = data.data || [];

        // Hitung tugas selesai
        const selesai = tugas.filter(t => t.status === 'sudah').length;
        document.getElementById('totalSelesai').textContent = selesai;

        if (tugas.length > 0) {
            tbody.innerHTML = '';
            tugas.forEach((t, index) => {
                // 🔥 CEK STATUS TUGAS (Sudah / Belum / Terlambat)
let statusBadge = '';
if (t.status === 'sudah') {
    statusBadge = '<span class="status-badge aktif">✅ Sudah</span>';
} else {
    const now = new Date();
    const deadline = new Date(t.deadline);
    if (now > deadline) {
        statusBadge = '<span class="status-badge danger">🔴 Terlambat</span>';
    } else {
        statusBadge = '<span class="status-badge belum">⏳ Belum</span>';
    }
}
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td><strong>${t.judul}</strong></td>
                    <td>${t.nama_kelas || '-'}</td>
                    <td>${t.nama_dosen || '-'}</td>
                    <td>${new Date(t.deadline).toLocaleString('id-ID')}</td>
                    <td>${statusBadge}</td>
                    <td>${t.nilai || '-'}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="detailTugas(${t.id})">👁️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada tugas</td></tr>';
        }
    } catch (error) {
        console.error('Error loading tugas:', error);
    }
}

// ========== 4. LOAD TUGAS DEADLINE MENDEKAT ==========
async function loadDeadlineTugas() {
    try {
        const data = await fetchWithAuth('/mahasiswa/tugas');
        const tugas = data.data || [];

        // 🔥 FILTER TUGAS YANG BELUM DIKUMPULKAN DAN DEADLINE MASIH DATANG
        const sekarang = new Date();
        const deadlineMendekat = tugas
            .filter(t => t.status === 'belum' && new Date(t.deadline) > sekarang)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5); // Ambil 5 tugas terdekat

        const tbody = document.getElementById('deadlineTableBody');
        const countEl = document.getElementById('deadlineCount');

        if (deadlineMendekat.length > 0) {
            countEl.textContent = `📊 ${deadlineMendekat.length} tugas mendekati deadline`;
            tbody.innerHTML = '';
            deadlineMendekat.forEach((t, index) => {
                const sisaWaktu = getRemainingTime(t.deadline);
                const statusBadge = sisaWaktu.includes('Lewat') 
                    ? '<span class="status-badge danger">🔴 Lewat</span>'
                    : sisaWaktu.includes('hari') 
                        ? '<span class="status-badge warning">🟡 Mendekat</span>'
                        : '<span class="status-badge aktif">🟢 Aman</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td><strong>${t.judul}</strong></td>
                    <td>${t.nama_kelas || '-'}</td>
                    <td>${t.nama_dosen || '-'}</td>
                    <td>${new Date(t.deadline).toLocaleString('id-ID')}</td>
                    <td><strong>${sisaWaktu}</strong></td>
                    <td>${statusBadge}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            countEl.textContent = '📊 Tidak ada tugas deadline mendekat';
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">✅ Semua tugas sudah dikumpulkan atau periksa kembali tugas anda</td></tr>';
        }
    } catch (error) {
        console.error('Error loading deadline tugas:', error);
    }
}

// ========== 5. HITUNG SISA WAKTU ==========
function getRemainingTime(deadline) {
    const now = new Date();
    const target = new Date(deadline);
    const diff = target - now;

    if (diff <= 0) {
        return '⛔ Lewat deadline';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days} hari ${hours} jam`;
    } else if (hours > 0) {
        return `${hours} jam ${minutes} menit`;
    } else {
        return `${minutes} menit`;
    }
}

// ========== 4. DETAIL TUGAS ==========
function detailTugas(id) {
    window.location.href = `mahasiswa-detail-tugas.html?id=${id}`;
}

// ========== 4. FILTER ==========
function applyFilter() {
    const kelas = document.getElementById('filterKelas').value;
    const status = document.getElementById('filterStatus').value;
    
    currentFilter.kelas = kelas;
    currentFilter.status = status;

    let filtered = allTugasData;
    
    // Filter by kelas
    if (kelas !== 'all') {
        filtered = filtered.filter(t => t.kelas_id == kelas);
    }
    
    // Filter by status
    if (status !== 'all') {
        filtered = filtered.filter(t => t.status === status);
    }

    document.getElementById('totalTugasFilter').textContent = `📊 ${filtered.length} tugas`;
    renderTugasTable(filtered);
}

// ========== 5. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadDashboard);