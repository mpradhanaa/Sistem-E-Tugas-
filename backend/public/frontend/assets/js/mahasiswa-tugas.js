// ========================================
// MAHASISWA-TUGAS.JS - Tugas Saya
// ========================================

let allTugasData = [];
let allKelasData = []; // 🔥 TAMBAHKAN INI!
let currentFilter = { kelas: 'all', status: 'all' }; // 🔥 UBAH JADI OBJEK

// ========== 1. LOAD HALAMAN ==========
async function loadTugasPage() {
    try {
        const token = checkAuth();
        if (!token) return;

        const user = getUser();
        document.getElementById('mhsName').textContent = user.name || 'Mahasiswa';
        document.getElementById('mhsAvatar').textContent = (user.name || 'M')[0].toUpperCase();

        // 🔥 LOAD KELAS FILTER DULU, BARU TUGAS
        await loadKelasFilter();
        await loadTugas();
    } catch (error) {
        console.error('Error loading tugas page:', error);
    }
}

// ========== 2. LOAD KELAS UNTUK FILTER ==========
async function loadKelasFilter() {
    try {
        const data = await fetchWithAuth('/mahasiswa/kelas');
        console.log('📚 Data kelas:', data);
        
        allKelasData = data.data || [];
        
        const filterKelas = document.getElementById('filterKelas');
        if (!filterKelas) {
            console.warn('Element filterKelas tidak ditemukan');
            return;
        }
        
        filterKelas.innerHTML = '<option value="all">📚 Semua Kelas</option>';
        
        allKelasData.forEach(k => {
            const option = document.createElement('option');
            option.value = k.id;
            option.textContent = `${k.nama} (${k.kode})`;
            filterKelas.appendChild(option);
        });
        
        console.log('✅ Filter kelas terisi:', filterKelas.options.length, 'kelas');
        
        // 🔥 TERAPKAN FILTER AWAL
        applyFilter();
    } catch (error) {
        console.error('Error loading kelas filter:', error);
    }
}

// ========== 3. LOAD TUGAS ==========
async function loadTugas() {
    try {
        const data = await fetchWithAuth('/mahasiswa/tugas');
        allTugasData = data.data || [];
        applyFilter(); // 🔥 TERAPKAN FILTER SETELAH LOAD TUGAS
    } catch (error) {
        console.error('Error loading tugas:', error);
        document.getElementById('tugasTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Error loading data</td></tr>';
    }
}

// ========== 4. FILTER ==========
function applyFilter() {
    const kelas = document.getElementById('filterKelas')?.value || 'all';
    const status = document.getElementById('filterStatus')?.value || 'all';
    
    currentFilter.kelas = kelas;
    currentFilter.status = status;

    let filtered = allTugasData;
    
    // 🔥 FILTER BY KELAS
    if (kelas !== 'all') {
        filtered = filtered.filter(t => t.kelas_id == kelas);
    }
    
    // 🔥 FILTER BY STATUS
    if (status !== 'all') {
        filtered = filtered.filter(t => t.status === status);
    }

    document.getElementById('totalTugasFilter').textContent = `📊 ${filtered.length} tugas`;
    renderTugasTable(filtered);
}

// ========== 5. RENDER TABEL ==========
function renderTugasTable(tugas) {
    const tbody = document.getElementById('tugasTableBody');

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
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada tugas dengan filter ini</td></tr>';
    }
}

// ========== 6. DETAIL TUGAS ==========
function detailTugas(id) {
    window.location.href = `mahasiswa-detail-tugas.html?id=${id}`;
}

// ========== 7. REFRESH FILTER (UNTUK KELAS BARU) ==========
async function refreshKelasFilter() {
    await loadKelasFilter();
}

// ========== RESET FILTER ==========
function resetFilter() {
    document.getElementById('filterKelas').value = 'all';
    document.getElementById('filterStatus').value = 'all';
    applyFilter();
}

// ========== 8. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadTugasPage);