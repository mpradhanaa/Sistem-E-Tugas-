// ========================================
// DOSEN-NILAI.JS - Penilaian Tugas
// ========================================
let allTugasData = [];
let filterKelas = 'all';
// ========== 1. LOAD HALAMAN ==========
async function loadNilai() {
    try {
        const token = checkAuth();
        if (!token) return;

        const user = getUser();
        document.getElementById('dosenName').textContent = user.name || 'Dosen';
        document.getElementById('dosenAvatar').textContent = (user.name || 'D')[0].toUpperCase();

        await loadTugas();
    } catch (error) {
        console.error('Error loading nilai:', error);
    }
}

// ========== 2. LOAD TUGAS ==========
async function loadTugas() {
    try {
        const kelasData = await fetchWithAuth('/dosen/kelas');
        const kelas = kelasData.data || [];

        if (kelas.length === 0) {
            document.getElementById('tugasTableBody').innerHTML = '<tr><td colspan="6" class="text-center">Belum ada kelas</td></tr>';
            document.getElementById('filterKelas').innerHTML = '<option value="all">📚 Tidak ada kelas</option>';
            return;
        }

        // 🔥 UPDATE DROPDOWN FILTER
        const filterSelect = document.getElementById('filterKelas');
        filterSelect.innerHTML = '<option value="all">📚 Semua Kelas</option>';
        
        let allTugas = [];
        for (const k of kelas) {
            // Tambahkan opsi filter
            const option = document.createElement('option');
            option.value = k.id;
            option.textContent = `${k.nama} (${k.kode})`;
            filterSelect.appendChild(option);

            // Ambil tugas per kelas
            const tugasData = await fetchWithAuth(`/dosen/kelas/${k.id}/tugas`);
            const tugas = tugasData.data || [];
            for (const t of tugas) {
                t.nama_kelas = k.nama;
                t.kode_kelas = k.kode;
                t.kelas_id = k.id;
                
                // Ambil jumlah pengumpulan
                try {
                    const pengumpulanData = await fetchWithAuth(`/dosen/tugas/${t.id}/pengumpulan`);
                    const pengumpulan = pengumpulanData.data || [];
                    t.terkumpul = pengumpulan.length;
                } catch (err) {
                    t.terkumpul = 0;
                }
            }
            allTugas = [...allTugas, ...tugas];
        }

        // 🔥 SIMPAN DATA GLOBAL
        allTugasData = allTugas;
        
        // 🔥 TERAPKAN FILTER
        applyFilterKelas();

    } catch (error) {
        console.error('Error loading tugas:', error);
        document.getElementById('tugasTableBody').innerHTML = '<tr><td colspan="6" class="text-center">Error loading data</td></tr>';
    }
}

// ========== FILTER BERDASARKAN KELAS ==========
function applyFilterKelas() {
    const filterSelect = document.getElementById('filterKelas');
    const selectedKelasId = filterSelect.value;
    
    let filteredTugas = allTugasData;
    
    if (selectedKelasId !== 'all') {
        filteredTugas = allTugasData.filter(t => t.kelas_id == selectedKelasId);
    }
    
    // 🔥 UPDATE TOTAL TUGAS
    const totalEl = document.getElementById('totalTugasFilter');
    if (totalEl) {
        totalEl.textContent = `📊 ${filteredTugas.length} tugas`;
    }
    
    // 🔥 RENDER TABEL
    renderTugasTable(filteredTugas);
}

// ========== RENDER TABEL TUGAS ==========
function renderTugasTable(tugas) {
    const tbody = document.getElementById('tugasTableBody');

    if (tugas.length > 0) {
        tbody.innerHTML = '';
        for (const t of tugas) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.id}</td>
                <td><strong>${t.judul}</strong></td>
                <td>${t.nama_kelas} (${t.kode_kelas})</td>
                <td>${new Date(t.deadline).toLocaleString('id-ID')}</td>
                <td>
                    <span class="status-badge ${t.terkumpul > 0 ? 'aktif' : 'belum'}">
                        ${t.terkumpul} ${t.terkumpul === 1 ? 'mahasiswa' : 'mahasiswa'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="lihatPengumpulan(${t.id}, '${t.judul}')">📝 Nilai</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada tugas di kelas ini</td></tr>';
    }
}

// ========== 3. LIHAT PENGUMPULAN ==========
async function lihatPengumpulan(tugasId, judulTugas) {
    try {
        const data = await fetchWithAuth(`/dosen/tugas/${tugasId}/pengumpulan`);
        const pengumpulan = data.data || [];

        const modal = document.getElementById('nilaiModal');
        const list = document.getElementById('nilaiMahasiswaList');

        if (pengumpulan.length === 0) {
            list.innerHTML = `<p>Belum ada mahasiswa yang mengumpulkan tugas <strong>"${judulTugas}"</strong></p>`;
        } else {
            let html = `<h4>📝 ${judulTugas}</h4>`;
            html += `<div style="overflow-x: auto; max-height: 500px; overflow-y: auto;">`;
            html += `<table class="table" style="min-width: 700px;">`;
            html += `<thead><tr>
                <th style="width:50px;">#</th>
                <th style="width:120px;">NPM</th>
                <th style="width:150px;">Nama</th>
                <th style="width:180px;">File</th>
                <th style="width:80px;">Nilai</th>
                <th style="width:200px;">Feedback</th>
                <th style="width:100px;">Aksi</th>
            </tr></thead><tbody>`;
            
            for (const p of pengumpulan) {
                const fileUrl = p.file_path ? `/api/v1/dosen/pengumpulan/${p.id}/download` : '#';
                const fileHtml = p.file_path ? 
    `<button class="btn btn-sm btn-primary" onclick="downloadFile(${p.id})">📥 Download</button>
    <td>
     <button class="btn btn-sm btn-success" onclick="previewFile(${p.id})">👁️ Lihat</button>` : 
    '-';
                html += `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.npm || '-'}</td>
                        <td>${p.mahasiswa_nama || p.mahasiswa_id}</td>
                        <td>${fileHtml}</td>
                        <td><input type="number" id="score_${p.id}" class="form-control" style="width:70px;" value="${p.score || ''}" placeholder="0-100"></td>
                        <td><input type="text" id="feedback_${p.id}" class="form-control" style="width:180px;" value="${p.feedback || ''}" placeholder="Feedback..."></td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="simpanNilai(${p.id}, ${tugasId})">💾</button>
                        </td>
                    </tr>
                `;
            }
            html += `</tbody></table></div>`;
            html += `<small class="text-muted">💡 Scroll ke bawah untuk melihat semua mahasiswa</small>`;
            list.innerHTML = html;
        }

        modal.classList.add('show');
    } catch (error) {
        console.error('Error loading pengumpulan:', error);
        alert('Gagal memuat data pengumpulan!');
    }
}

// ========== DOWNLOAD FILE (Pakai Token) ==========
async function downloadFile(pengumpulanId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login!');
            return;
        }

        const url = `http://localhost:8080/api/v1/dosen/pengumpulan/${pengumpulanId}/download`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            alert(`Gagal download: ${response.status} - ${errorText}`);
            return;
        }

        // Ambil nama file dari header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'file';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) filename = match[1];
        }

        // Konversi response ke blob
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error('Download error:', error);
        alert('Terjadi kesalahan saat download file!');
    }
}

// ========== 4. SIMPAN NILAI ==========
async function simpanNilai(pengumpulanId, tugasId) {
    const scoreInput = document.getElementById(`score_${pengumpulanId}`);
    const feedbackInput = document.getElementById(`feedback_${pengumpulanId}`);
    
    const score = parseInt(scoreInput.value);
    const feedback = feedbackInput ? feedbackInput.value.trim() : '';

    if (isNaN(score) || score < 0 || score > 100) {
        alert('Masukkan nilai antara 0-100');
        return;
    }

    try {
        const response = await fetchWithAuth(`/dosen/pengumpulan/${pengumpulanId}`, {
            method: 'PUT',
            body: JSON.stringify({ score, feedback })
        });

        if (response && response.status === 200) {
            alert('Nilai berhasil disimpan!');
            await lihatPengumpulan(tugasId, document.querySelector('#nilaiMahasiswaList h4')?.textContent || 'Tugas');
        } else {
            alert(response.message || 'Gagal menyimpan nilai!');
        }
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Terjadi kesalahan!');
    }
}

// ========== 5. CLOSE MODAL ==========
document.addEventListener('click', function(e) {
    const modal = document.getElementById('nilaiModal');
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// ========== PREVIEW FILE ==========
async function previewFile(pengumpulanId, filePath) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login!');
            return;
        }

        const url = `http://localhost:8080/api/v1/dosen/pengumpulan/${pengumpulanId}/download`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            alert('Gagal mengambil file!');
            return;
        }

        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);

        // Ambil nama file dari path
        const fileName = filePath ? filePath.split('/').pop() : 'file';
        const fileExt = fileName.split('.').pop().toLowerCase();

        // 🔥 CEK APAKAH BISA DIPREVIEW
        const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'txt', 'md', 'json', 'xml', 'html', 'css', 'js'];

        if (previewableTypes.includes(fileExt)) {
            // ✅ BISA DIPREVIEW
            if (contentType.includes('pdf')) {
                const win = window.open('', '_blank');
                win.document.write(`
                    <html>
                    <head><title>Preview PDF</title></head>
                    <body style="margin:0; height:100vh;">
                        <embed src="${fileUrl}" type="application/pdf" width="100%" height="100%" />
                    </body>
                    </html>
                `);
            } else if (contentType.includes('image')) {
                const win = window.open('', '_blank');
                win.document.write(`
                    <html>
                    <head><title>Preview Gambar</title></head>
                    <body style="display:flex; justify-content:center; align-items:center; height:100vh; margin:0; background:#f0f0f0;">
                        <img src="${fileUrl}" style="max-width:90%; max-height:90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
                    </body>
                    </html>
                `);
            } else {
                // File teks (txt, json, xml, dll)
                const text = await blob.text();
                const modal = document.getElementById('nilaiModal');
                const list = document.getElementById('nilaiMahasiswaList');
                const prevContent = list.innerHTML;
                
                list.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4>📄 Preview: ${fileName}</h4>
                        <button class="btn btn-outline btn-sm" onclick="closePreview('${prevContent.replace(/'/g, "\\'")}')">✖ Tutup</button>
                    </div>
                    <pre style="background:#f5f5f5; padding:1rem; border-radius:8px; max-height:400px; overflow:auto; white-space:pre-wrap; word-break:break-all; font-size:12px;">${text}</pre>
                    <button class="btn btn-primary btn-sm" onclick="downloadFile(${pengumpulanId})" style="margin-top:1rem;">📥 Download File</button>
                `;
                modal.classList.add('show');
            }
        } else {
            // ❌ TIDAK BISA DIPREVIEW → POPUP INFO
            const modal = document.getElementById('nilaiModal');
            const list = document.getElementById('nilaiMahasiswaList');
            const prevContent = list.innerHTML;
            
            list.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>⚠️ File Tidak Dapat Dipreview</h4>
                    <button class="btn btn-outline btn-sm" onclick="closePreview('${prevContent.replace(/'/g, "\\'")}')">✖ Tutup</button>
                </div>
                <div style="text-align: center; padding: 2rem 0;">
                    <p style="font-size: 3rem;">📄</p>
                    <p><strong>${fileName}</strong></p>
                    <p style="color: var(--gray-500);">
                        File dengan ekstensi <strong>.${fileExt}</strong> tidak bisa dipreview secara online.
                    </p>
                    <p style="color: var(--gray-500);">
                        Silakan <strong>download</strong> file untuk melihat isinya.
                    </p>
                    <button class="btn btn-primary" onclick="downloadFile(${pengumpulanId})" style="margin-top: 1rem;">
                        📥 Download File
                    </button>
                </div>
            `;
            modal.classList.add('show');
        }

    } catch (error) {
        console.error('Preview error:', error);
        alert('Terjadi kesalahan saat preview file!');
    }
}
// ========== 6. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadNilai);