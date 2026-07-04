// ========================================
// DOSEN-KELAS.JS - Halaman Kelas Saya
// ========================================

let allKelasData = [];
let currentFilter = { prodi: 'all', angkatan: 'all', status: 'all' };
let confirmCallback = null;

// ========== 1. LOAD HALAMAN ==========
async function loadKelasPage() {
    try {
        const token = checkAuth();
        if (!token) return;

        const user = getUser();
        document.getElementById('dosenName').textContent = user.name || 'Dosen';
        document.getElementById('dosenAvatar').textContent = (user.name || 'D')[0].toUpperCase();

        await loadKelas();
    } catch (error) {
        console.error('Error loading kelas page:', error);
    }
}

// ========== 2. LOAD KELAS ==========
async function loadKelas() {
    try {
        const data = await fetchWithAuth('/dosen/kelas');
        allKelasData = data.data || [];
        applyFilters();
    } catch (error) {
        console.error('Error loading kelas:', error);
        document.getElementById('kelasTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Error loading data</td></tr>';
    }
}

// ========== 3. FILTER ==========
function applyFilters() {
    const prodi = document.getElementById('filterProdi').value;
    const angkatan = document.getElementById('filterAngkatan').value;
    const status = document.getElementById('filterStatus').value;

    let filtered = allKelasData;

    if (prodi !== 'all') {
        filtered = filtered.filter(k => k.prodi === prodi);
    }
    if (angkatan !== 'all') {
        filtered = filtered.filter(k => k.angkatan === angkatan);
    }
    if (status !== 'all') {
        filtered = filtered.filter(k => k.status === status);
    }

    // Update total
    document.getElementById('totalKelasFilter').textContent = `📊 ${filtered.length} kelas`;

    renderKelasTable(filtered);
}

function resetFilters() {
    document.getElementById('filterProdi').value = 'all';
    document.getElementById('filterAngkatan').value = 'all';
    document.getElementById('filterStatus').value = 'all';
    applyFilters();
}

// ========== 4. RENDER TABEL KELAS ==========
function renderKelasTable(kelas) {
    const tbody = document.getElementById('kelasTableBody');

    if (kelas.length > 0) {
        tbody.innerHTML = '';
        for (const k of kelas) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${k.id}</td>
                <td><strong>${k.nama}</strong></td>
                <td>${k.kode}</td>
                <td>${k.prodi}</td>
                <td>${k.angkatan}</td>
                <td>${k.kelas}</td>
                <td><span class="status-badge ${k.status}">${k.status}</span></td>
                <td>
    <button class="btn btn-primary btn-sm" onclick="detailKelas(${k.id})">📝</button>
    <button class="btn btn-warning btn-sm" onclick="toggleStatus(${k.id}, '${k.status}')">🔄</button>
    <button class="btn btn-danger btn-sm" onclick="hapusKelas(${k.id}, '${k.nama}')">🗑️</button>
</td>
            `;
            tbody.appendChild(tr);
        }
    } else {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada kelas dengan filter ini</td></tr>';
    }
}

// ========== 5. DETAIL KELAS ==========
function detailKelas(id) {
    window.location.href = `dosen-detail-kelas.html?id=${id}`;
}

// ========== 6. TOGGLE STATUS ==========
function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'aktif' ? 'ditutup' : 'aktif';
    document.getElementById('confirmMessage').textContent = `Yakin ingin ${newStatus === 'aktif' ? 'membuka' : 'menutup'} kelas ini?`;
    document.getElementById('confirmModal').classList.add('show');
    
    confirmCallback = async () => {
        try {
            const response = await fetchWithAuth(`/dosen/kelas/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            if (response && response.status === 200) {
                alert(`Kelas berhasil ${newStatus === 'aktif' ? 'dibuka' : 'ditutup'}`);
                closeConfirm();
                loadKelas();
            } else {
                alert(response.message || 'Gagal mengubah status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Terjadi kesalahan!');
        }
    };
}

// ========== 7. BUKA KELAS ==========
function showBukaKelas() {
    document.getElementById('bukaKelasModal').classList.add('show');
    document.getElementById('bukaKelasForm').reset();
}

function closeBukaKelas() {
    document.getElementById('bukaKelasModal').classList.remove('show');
}

document.getElementById('bukaKelasForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        nama: document.getElementById('namaKelas').value.trim(),
        kode: document.getElementById('kodeKelas').value.trim(),
        deskripsi: document.getElementById('deskripsiKelas').value.trim(),
        prodi: document.getElementById('prodiKelas').value,
        angkatan: document.getElementById('angkatanKelas').value,
        kelas: document.getElementById('kelasKelas').value,
    };

    if (!data.nama || !data.kode) {
        alert('Nama dan kode kelas wajib diisi!');
        return;
    }

    try {
        const response = await fetchWithAuth('/dosen/kelas', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response && response.status === 200) {
            alert(response.message || 'Kelas berhasil dibuka!');
            closeBukaKelas();
            loadKelas();
        } else {
            alert(response.message || 'Gagal membuka kelas!');
        }
    } catch (error) {
        console.error('Error buka kelas:', error);
        alert('Terjadi kesalahan!');
    }
});

// ========== 8. KONFIRMASI ==========
function closeConfirm() {
    document.getElementById('confirmModal').classList.remove('show');
    confirmCallback = null;
}

document.getElementById('confirmYesBtn').addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback();
    }
});

// ========== HAPUS KELAS ==========
function hapusKelas(id, nama) {
    document.getElementById('confirmMessage').textContent = `Yakin ingin menghapus kelas "${nama}"? Semua data tugas dan pengumpulan akan ikut terhapus.`;
    document.getElementById('confirmModal').classList.add('show');
    
    confirmCallback = async () => {
        try {
            const response = await fetchWithAuth(`/dosen/kelas/${id}`, {
                method: 'DELETE'
            });

            if (response && response.status === 200) {
                alert(`Kelas "${nama}" berhasil dihapus!`);
                closeConfirm();
                loadKelas();
            } else {
                alert(response.message || 'Gagal menghapus kelas!');
            }
        } catch (error) {
            console.error('Error hapus kelas:', error);
            alert('Terjadi kesalahan!');
        }
    };
}

// ========== 9. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadKelasPage);