// ========================================
// MAHASISWA-DETAIL.JS - Detail Tugas
// ========================================

let tugasId = null;
let currentPdfUrl = '';
let currentPdfFilename = '';

// ========== 1. LOAD DETAIL ==========
async function loadDetail() {
    try {
        const token = checkAuth();
        if (!token) return;

        const params = new URLSearchParams(window.location.search);
        tugasId = params.get('id');

        if (!tugasId) {
            document.getElementById('tugasTitle').textContent = 'ID Tugas tidak ditemukan';
            return;
        }

        const user = getUser();
        document.getElementById('mhsName').textContent = user.name || 'Mahasiswa';
        document.getElementById('mhsAvatar').textContent = (user.name || 'M')[0].toUpperCase();

        await loadTugasDetail();
    } catch (error) {
        console.error('Error loading detail:', error);
    }
}

// ========== 2. LOAD TUGAS DETAIL ==========
async function loadTugasDetail() {
    try {
        const data = await fetchWithAuth('/mahasiswa/tugas');
        const tugas = data.data.find(t => t.id == tugasId);

        if (!tugas) {
            document.getElementById('tugasTitle').textContent = 'Tugas tidak ditemukan';
            return;
        }

        document.getElementById('detailJudul').textContent = tugas.judul;
        document.getElementById('detailDeskripsi').textContent = tugas.deskripsi || '-';
        document.getElementById('detailKelas').textContent = tugas.nama_kelas || '-';
        document.getElementById('detailDosen').textContent = tugas.nama_dosen || '-';
        document.getElementById('detailDeadline').textContent = new Date(tugas.deadline).toLocaleString('id-ID');
        
        const status = tugas.status === 'sudah' ? '✅ Sudah dikumpulkan' : '⏳ Belum dikumpulkan';
        document.getElementById('detailStatus').textContent = status;
        document.getElementById('detailNilai').textContent = tugas.nilai || '-';
        document.getElementById('detailFeedback').textContent = tugas.feedback || '-';

        // 🔥 PREVIEW LAMPIRAN (jika ada)
        const filePreviewSection = document.getElementById('filePreviewSection');
        const filePreviewContent = document.getElementById('filePreviewContent');

        if (tugas.lampiran) {
            filePreviewSection.style.display = 'block';
            const fileName = tugas.lampiran.split('/').pop();
            
            filePreviewContent.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    <span style="font-size: 1.2rem;">📎</span>
                    <span><strong>${fileName}</strong></span>
                    <button class="btn btn-primary btn-sm" onclick="previewPdf('${fileName}')" style="margin-left: auto;">👁️ Lihat</button>
                    <button class="btn btn-success btn-sm" onclick="downloadFileMhs('${fileName}')">📥 Download</button>
                </div>
                <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--gray-100); border-radius: 4px; font-size: 0.8rem; color: var(--gray-500);">
                    💡 Klik "Lihat" untuk preview file di modal, atau "Download" untuk menyimpan file.
                </div>
            `;
        } else {
            filePreviewSection.style.display = 'none';
        }

        // Jika sudah dikumpulkan, sembunyikan form upload
        if (tugas.status === 'sudah') {
            document.getElementById('uploadSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading tugas detail:', error);
    }
}

// ========== PREVIEW FILE DI MODAL ==========
async function previewPdf(filename) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login!');
            return;
        }

        const url = `http://localhost:8080/api/v1/mahasiswa/download/${filename}`;
        currentPdfFilename = filename;

        const modal = document.getElementById('pdfModal');
        const viewer = document.getElementById('pdfViewer');
        const loading = document.getElementById('pdfLoading');
        
        modal.classList.add('show');
        loading.style.display = 'flex';
        viewer.innerHTML = '';
        viewer.appendChild(loading);

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            viewer.innerHTML = `<p style="color: var(--danger); padding: 2rem;">❌ Gagal memuat file (${response.status})</p>`;
            return;
        }

        const blob = await response.blob();
        currentPdfUrl = URL.createObjectURL(blob);

        // 🔥 CEK BERDASARKAN EKSTENSI FILE
        const fileExtension = filename.split('.').pop().toLowerCase();

        if (fileExtension === 'pdf') {
            viewer.innerHTML = `
                <embed src="${currentPdfUrl}" type="application/pdf" width="100%" height="100%" style="min-height: 500px;" />
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExtension)) {
            viewer.innerHTML = `
                <img src="${currentPdfUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: 0 auto;" />
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(fileExtension)) {
            const text = await blob.text();
            viewer.innerHTML = `
                <pre style="background: white; padding: 1rem; border-radius: 4px; max-height: 100%; overflow: auto; white-space: pre-wrap; word-break: break-all; font-size: 12px; margin: 0;">${text}</pre>
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else {
            viewer.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p style="font-size: 3rem;">📄</p>
                    <p>File tidak bisa dipreview.</p>
                    <p style="color: var(--gray-500); font-size: 0.875rem;">${filename}</p>
                    <button class="btn btn-primary" onclick="downloadFileMhs('${filename}')">📥 Download</button>
                </div>
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        }

        loading.style.display = 'none';

    } catch (error) {
        console.error('Preview error:', error);
        document.getElementById('pdfViewer').innerHTML = `<p style="color: var(--danger); padding: 2rem;">❌ Gagal memuat file</p>`;
    }
}

// ========== CLOSE MODAL PREVIEW ==========
function closePdfModal() {
    document.getElementById('pdfModal').classList.remove('show');
    if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
        currentPdfUrl = '';
    }
}

// ========== DOWNLOAD FILE (MAHASISWA) ==========
async function downloadFileMhs(filename) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login!');
            return;
        }

        const url = `http://localhost:8080/api/v1/mahasiswa/download/${filename}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            alert(`Gagal download: ${response.status}`);
            return;
        }

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

// ========== 3. KUMPULKAN TUGAS ==========
document.getElementById('submitForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const messageEl = document.getElementById('submitMessage');

    if (!fileInput.files.length) {
        messageEl.textContent = '❌ Pilih file terlebih dahulu!';
        messageEl.style.color = 'red';
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/v1/mahasiswa/tugas/${tugasId}/submit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            messageEl.textContent = '✅ ' + (data.message || 'Tugas berhasil dikumpulkan!');
            messageEl.style.color = 'green';
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            messageEl.textContent = '❌ ' + (data.message || 'Gagal mengumpulkan tugas');
            messageEl.style.color = 'red';
        }
    } catch (error) {
        console.error('Submit error:', error);
        messageEl.textContent = '❌ Terjadi kesalahan. Coba lagi.';
        messageEl.style.color = 'red';
    }
});

// ========== PREVIEW FILE DI MODAL (PAKAI ENDPOINT PREVIEW) ==========
async function previewPdf(filename) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login!');
            return;
        }

        // 🔥 PAKAI ENDPOINT PREVIEW (BUKAN DOWNLOAD)
        const url = `http://localhost:8080/api/v1/mahasiswa/preview/${filename}`;
        currentPdfFilename = filename;

        const modal = document.getElementById('pdfModal');
        const viewer = document.getElementById('pdfViewer');
        const loading = document.getElementById('pdfLoading');
        
        modal.classList.add('show');
        loading.style.display = 'flex';
        viewer.innerHTML = '';
        viewer.appendChild(loading);

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            viewer.innerHTML = `<p style="color: var(--danger); padding: 2rem;">❌ Gagal memuat file (${response.status})</p>`;
            return;
        }

        // 🔥 AMBIL BLOB DARI RESPONSE
        const blob = await response.blob();
        currentPdfUrl = URL.createObjectURL(blob);

        // 🔥 CEK BERDASARKAN EKSTENSI FILE
        const fileExtension = filename.split('.').pop().toLowerCase();

        if (fileExtension === 'pdf') {
            viewer.innerHTML = `
                <iframe src="${currentPdfUrl}" width="100%" height="100%" style="min-height: 500px; border: none;"></iframe>
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExtension)) {
            viewer.innerHTML = `
                <img src="${currentPdfUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: 0 auto;" />
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(fileExtension)) {
            const text = await blob.text();
            viewer.innerHTML = `
                <pre style="background: white; padding: 1rem; border-radius: 4px; max-height: 100%; overflow: auto; white-space: pre-wrap; word-break: break-all; font-size: 12px; margin: 0;">${text}</pre>
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        } else {
            viewer.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p style="font-size: 3rem;">📄</p>
                    <p>File tidak bisa dipreview.</p>
                    <p style="color: var(--gray-500); font-size: 0.875rem;">${filename}</p>
                    <button class="btn btn-primary" onclick="downloadFileMhs('${filename}')">📥 Download</button>
                </div>
            `;
            document.getElementById('downloadPdfBtn').onclick = function() {
                const link = document.createElement('a');
                link.href = currentPdfUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        }

        loading.style.display = 'none';

    } catch (error) {
        console.error('Preview error:', error);
        document.getElementById('pdfViewer').innerHTML = `<p style="color: var(--danger); padding: 2rem;">❌ Gagal memuat file</p>`;
    }
}

// ========== REFRESH FILTER KELAS ==========
async function refreshKelasFilter() {
    try {
        const data = await fetchWithAuth('/mahasiswa/kelas');
        allKelasData = data.data || [];
        
        const filterKelas = document.getElementById('filterKelas');
        const currentValue = filterKelas.value;
        
        filterKelas.innerHTML = '<option value="all">📚 Semua Kelas</option>';
        
        allKelasData.forEach(k => {
            const option = document.createElement('option');
            option.value = k.id;
            option.textContent = `${k.nama} (${k.kode})`;
            filterKelas.appendChild(option);
        });
        
        // Kembalikan ke pilihan sebelumnya jika masih ada
        if (allKelasData.some(k => k.id == currentValue)) {
            filterKelas.value = currentValue;
        }
        
        // Terapkan filter ulang
        applyFilter();
    } catch (error) {
        console.error('Error refreshing kelas filter:', error);
    }

    if (response.ok) {
    messageEl.textContent = '✅ ' + (data.message || 'Tugas berhasil dikumpulkan!');
    messageEl.style.color = 'green';
    
    // 🔥 REFRESH FILTER KELAS (karena mungkin ada perubahan)
    if (typeof refreshKelasFilter === 'function') {
        refreshKelasFilter();
    }
    
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}
}

// ========== 4. LOAD SAAT HALAMAN DIBUKA ==========
document.addEventListener('DOMContentLoaded', loadDetail);