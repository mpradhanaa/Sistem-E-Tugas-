// ========================================
// MAHASISWA-KELAS.JS - Kelas Saya
// ========================================

let allKelasData = [];
let currentFilter = 'all';

// ========== 1. LOAD HALAMAN ==========
async function loadKelasPage() {
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

        await loadKelas();
    } catch (error) {
        console.error('Error loading kelas page:', error);
    }
}

// ========== 2. LOAD KELAS ==========
async function loadKelas() {
    try {
        const data = await fetchWithAuth('/mahasiswa/kelas');
        allKelasData = data.data || [];
        applyFilter();
    } catch (error) {
        console.error('Error loading kelas:', error);
        document.getElementById('kelasTableBody').innerHTML = '<tr><td colspan="6" class="text-center">Error loading data</td></tr>';
    }
}

// ========== 3. FILTER ==========
function applyFilter() {
    const status = document.getElementById('filterStatus').value;
    currentFilter = status;

    let filtered = allKelasData;
    if (status !== 'all') {
        filtered = allKelasData.filter(k => k.status === status);
    }

    document.getElementById('totalKelasFilter').textContent = `📊 ${filtered.length} kelas`;
    renderKelasTable(filtered);
}

// ========== 4. RENDER TABEL ==========
function renderKelasTable(kelas) {
    const tbody = document.getElementById('kelasTableBody');

    if (kelas.length > 0) {
        tbody.innerHTML = '';
        kelas.forEach((k, index) => {
            const statusBadge = k.status === 'aktif' 
                ? '<span class="status-badge aktif">🟢 Aktif</span>' 
                : '<span class="status-badge ditutup">🔴 Ditutup</span>';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${k.nama}</strong></td>
                <td>${k.kode}</td>
                <td>${k.nama_dosen || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="lihatTugasKelas(${k.id})">📝</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada kelas yang diikuti</td></tr>';
    }
}

// ========== 5. LIHAT TUGAS PER KELAS ==========
function lihatTugasKelas(kelasId) {
    window.location.href = `mahasiswa-tugas.html?kelas=${kelasId}`;
}

document.addEventListener('DOMContentLoaded', loadKelasPage);