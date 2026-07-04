// ========================================
// DOSEN-DETAIL.JS - Detail Kelas
// ========================================

let kelasId = null;

// ========== 1. LOAD DETAIL KELAS ==========
async function loadDetail() {
    try {
        const token = checkAuth();
        if (!token) return;

        // Ambil ID dari URL
        const params = new URLSearchParams(window.location.search);
        kelasId = params.get('id');

        if (!kelasId) {
            document.getElementById('kelasInfo').textContent = 'ID Kelas tidak ditemukan';
            return;
        }

        const user = getUser();
        document.getElementById('dosenName').textContent = user.name || 'Dosen';
        document.getElementById('dosenAvatar').textContent = (user.name || 'D')[0].toUpperCase();

        await loadKelasInfo();
        await loadTugas();
        await loadMahasiswa();
    } catch (error) {
        console.error('Error loading detail:', error);
    }
}

// ========== LOAD MAHASISWA ==========
async function loadMahasiswa() {
    try {
        const data = await fetchWithAuth(`/dosen/kelas/${kelasId}`);
        const mahasiswa = data.data?.mahasiswa || [];

        const tbody = document.getElementById('mahasiswaTableBody');
        const totalEl = document.getElementById('totalMahasiswa');

        if (!tbody) return;

        if (mahasiswa.length > 0) {
            // 🔥 URUTKAN BERDASARKAN NPM
            mahasiswa.sort((a, b) => a.username.localeCompare(b.username));

            totalEl.textContent = `👥 ${mahasiswa.length} mahasiswa`;

            tbody.innerHTML = '';
            mahasiswa.forEach((m, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${m.username}</td>
                    <td>${m.name}</td>
                    <td><span class="status-badge aktif">✅ Terdaftar</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            totalEl.textContent = '👥 0 mahasiswa';
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada mahasiswa terdaftar</td></tr>';
        }
    } catch (error) {
        console.error('Error loading mahasiswa:', error);
        const tbody = document.getElementById('mahasiswaTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading data</td></tr>';
        }
    }
}

// ========== 2. LOAD INFO KELAS ==========
async function loadKelasInfo() {
    try {
        const data = await fetchWithAuth(`/dosen/kelas/${kelasId}`);
        if (data && data.data) {
            const k = data.data.kelas;
            document.getElementById('kelasTitle').textContent = `📚 ${k.nama}`;
            document.getElementById('kelasInfo').innerHTML = `
                <p><strong>Kode:</strong> ${k.kode}</p>
                <p><strong>Prodi:</strong> ${k.prodi}</p>
                <p><strong>Angkatan:</strong> ${k.angkatan}</p>
                <p><strong>Kelas:</strong> ${k.kelas}</p>
                <p><strong>Status:</strong> <span class="status-badge ${k.status}">${k.status}</span></p>
                <p><strong>Mahasiswa:</strong> ${data.data.mahasiswa ? data.data.mahasiswa.length : 0} orang</p>
            `;
        }
    } catch (error) {
        console.error('Error loading kelas info:', error);
    }
}

// ========== 3. LOAD TUGAS ==========
async function loadTugas() {
    try {
        const data = await fetchWithAuth(`/dosen/kelas/${kelasId}/tugas`);
        const tbody = document.getElementById('tugasTableBody');

        if (!tbody) return;

        const tugas = data.data || [];

        if (tugas.length > 0) {
            tbody.innerHTML = '';
            tugas.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${t.id}</td>
                    <td>${t.judul}</td>
                    <td>${new Date(t.deadline).toLocaleString('id-ID')}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteTugas(${t.id})">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada tugas</td></tr>';
        }
    } catch (error) {
        console.error('Error loading tugas:', error);
    }
}

// ========== 4. KIRIM TUGAS ==========
document.getElementById('kirimTugasForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('judul', document.getElementById('judulTugas').value.trim());
    formData.append('deskripsi', document.getElementById('deskripsiTugas').value.trim());
    formData.append('deadline', document.getElementById('deadlineTugas').value);

    const fileInput = document.getElementById('lampiranTugas');
    if (fileInput.files.length > 0) {
        formData.append('lampiran', fileInput.files[0]);
    }

    if (!formData.get('judul') || !formData.get('deadline')) {
        alert('Judul dan deadline wajib diisi!');
        return;
    }

    try {
        const response = await fetchWithAuth(`/dosen/kelas/${kelasId}/tugas`, {
            method: 'POST',
            body: formData,
            headers: {} // biar browser set Content-Type
        });

        if (response && response.status === 200) {
            alert(response.message || 'Tugas berhasil dikirim!');
            document.getElementById('kirimTugasForm').reset();
            loadTugas();
        } else {
            alert(response.message || 'Gagal mengirim tugas!');
        }
    } catch (error) {
        console.error('Error kirim tugas:', error);
        alert('Terjadi kesalahan!');
    }
});

// ========== 5. DELETE TUGAS ==========
async function deleteTugas(id) {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;

    try {
        const response = await fetchWithAuth(`/dosen/tugas/${id}`, {
            method: 'DELETE'
        });

        if (response && response.status === 200) {
            alert('Tugas berhasil dihapus!');
            loadTugas();
        } else {
            alert(response.message || 'Gagal menghapus tugas!');
        }
    } catch (error) {
        console.error('Error deleting tugas:', error);
        alert('Terjadi kesalahan!');
    }
}

// ========== 6. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadDetail);