// ========================================
// DOSEN.JS - Dashboard Dosen
// ========================================

// ========== 1. LOAD DASHBOARD ==========
async function loadDashboard() {
    try {
        const token = checkAuth();
        if (!token) return;

        const user = getUser();
        document.getElementById('dosenName').textContent = user.name || 'Dosen';
        document.getElementById('dosenAvatar').textContent = (user.name || 'D')[0].toUpperCase();

        await loadStats();
        await loadKelas();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

/// ========== 2. LOAD STATISTIK ==========
async function loadStats() {
    try {
        const data = await fetchWithAuth('/dosen/dashboard');
        console.log('📊 Data dashboard dosen:', data); // 🔥 DEBUG

        if (data && data.data) {
            document.getElementById('totalKelas').textContent = data.data.total_kelas || 0;
            document.getElementById('totalTugas').textContent = data.data.total_tugas || 0;
            document.getElementById('totalPengumpulan').textContent = data.data.total_pengumpulan || 0;
        } else {
            console.error('Data dashboard kosong:', data);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ========== 3. LOAD KELAS ==========
async function loadKelas() {
    try {
        const data = await fetchWithAuth('/dosen/kelas');
        const tbody = document.getElementById('kelasTableBody');

        if (!tbody) return;

        const kelas = data.data || [];

        if (kelas.length > 0) {
            tbody.innerHTML = '';
            kelas.forEach(k => {
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
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada kelas yang diampu</td></tr>';
        }
    } catch (error) {
        console.error('Error loading kelas:', error);
    }
}

// ========== 4. DETAIL KELAS ==========
function detailKelas(id) {
    window.location.href = `dosen-detail-kelas.html?id=${id}`;
}

// ========== 5. TOGGLE STATUS KELAS ==========
let confirmCallback = null;

function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'aktif' ? 'ditutup' : 'aktif';
    const message = `Yakin ingin ${newStatus === 'aktif' ? 'membuka' : 'menutup'} kelas ini?`;
    
    document.getElementById('confirmMessage').textContent = message;
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
                loadStats();
            } else {
                alert(response.message || 'Gagal mengubah status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Terjadi kesalahan!');
        }
    };
}

// ========== 6. BUKA KELAS ==========
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
            loadStats();
        } else {
            alert(response.message || 'Gagal membuka kelas!');
        }
    } catch (error) {
        console.error('Error buka kelas:', error);
        alert('Terjadi kesalahan!');
    }
});

// ========== 7. KONFIRMASI ==========
function closeConfirm() {
    document.getElementById('confirmModal').classList.remove('show');
    confirmCallback = null;
}

document.getElementById('confirmYesBtn').addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback();
    }
});

// ========== 8. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadDashboard);