// ========================================
// MAHASISWA-NILAI.JS - Nilai Saya
// ========================================

// ========== 1. LOAD HALAMAN ==========
async function loadNilaiPage() {
    try {
        const token = checkAuth();
        if (!token) return;

        const user = getUser();
        document.getElementById('mhsName').textContent = user.name || 'Mahasiswa';
        document.getElementById('mhsAvatar').textContent = (user.name || 'M')[0].toUpperCase();

        await loadNilai();
    } catch (error) {
        console.error('Error loading nilai page:', error);
    }
}

// ========== 2. LOAD NILAI ==========
async function loadNilai() {
    try {
        const data = await fetchWithAuth('/mahasiswa/nilai');
        const nilai = data.data || [];

        // Hitung statistik
        const dinilai = nilai.filter(n => n.score !== null);
        const belumDinilai = nilai.filter(n => n.score === null);
        const totalNilai = dinilai.length;
        const rataRata = totalNilai > 0 
            ? (dinilai.reduce((sum, n) => sum + parseInt(n.score), 0) / totalNilai).toFixed(1)
            : '-';

        document.getElementById('rataRata').textContent = rataRata;
        document.getElementById('totalDinilai').textContent = totalNilai;
        document.getElementById('totalBelumDinilai').textContent = belumDinilai.length;
        document.getElementById('totalNilaiFilter').textContent = `📊 ${nilai.length} tugas`;

        renderNilaiTable(nilai);
    } catch (error) {
        console.error('Error loading nilai:', error);
        document.getElementById('nilaiTableBody').innerHTML = '<tr><td colspan="5" class="text-center">Error loading data</td></tr>';
    }
}

// ========== 3. RENDER TABEL ==========
function renderNilaiTable(nilai) {
    const tbody = document.getElementById('nilaiTableBody');

    if (nilai.length > 0) {
        tbody.innerHTML = '';
        nilai.forEach((n, index) => {
            const tr = document.createElement('tr');
            const score = n.score !== null ? n.score : '-';
            const feedbackBtn = n.feedback 
                ? `<button class="btn btn-primary btn-sm" onclick="showFeedback('${n.judul}', '${n.nama_kelas}', '${n.score}', \`${n.feedback}\`)">👁️ Lihat</button>` 
                : '-';
            
            // 🔥 FILE JAWABAN
            const fileBtn = n.file_path 
                ? `<button class="btn btn-success btn-sm" onclick="previewFileMhs('${n.file_path}')">📄 Lihat</button>` 
                : '-';
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${n.judul || 'Tugas'}</strong></td>
                <td>${n.nama_kelas || '-'}</td>
                <td>${score}</td>
                <td>${feedbackBtn}</td>
                <td>${fileBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada nilai</td></tr>';
    }
}

// ========== 4. SHOW FEEDBACK ==========
function showFeedback(judul, kelas, nilai, feedback) {
    document.getElementById('fbJudul').textContent = judul || '-';
    document.getElementById('fbKelas').textContent = kelas || '-';
    document.getElementById('fbNilai').textContent = nilai || '-';
    document.getElementById('fbText').textContent = feedback || 'Tidak ada feedback';
    document.getElementById('feedbackModal').classList.add('show');
}

// ========== 5. CLOSE FEEDBACK ==========
function closeFeedback() {
    document.getElementById('feedbackModal').classList.remove('show');
}

// ========== PREVIEW FILE JAWABAN MAHASISWA ==========
async function previewFileMhs(filePath) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login!');
            return;
        }

        // 🔥 AMBIL NAMA FILE
        const fileName = filePath.split('/').pop();
        if (!fileName) {
            alert('Nama file tidak ditemukan!');
            return;
        }

        const url = `http://localhost:8080/api/v1/mahasiswa/preview/${fileName}`;

        // 🔥 AMBIL FILE
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        // 🔥 CEK RESPONSE
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error:', response.status, errorText);
            alert(`Gagal memuat file! (${response.status})`);
            return;
        }

        // 🔥 PROSES FILE
        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);
        const fileExtension = fileName.split('.').pop().toLowerCase();

        // 🔥 TAMPILKAN DI MODAL
        const modal = document.getElementById('pdfModal');
        const viewer = document.getElementById('pdfViewer');
        const loading = document.getElementById('pdfLoading');
        
        if (!modal || !viewer || !loading) {
            console.error('❌ Modal elements not found!');
            alert('Element modal tidak ditemukan!');
            return;
        }

        modal.classList.add('show');
        loading.style.display = 'flex';
        viewer.innerHTML = '';
        viewer.appendChild(loading);

        // 🔥 RENDER BERDASARKAN EKSTENSI
        setTimeout(() => {
            if (fileExtension === 'pdf') {
                viewer.innerHTML = `
                    <iframe src="${fileUrl}" width="100%" height="100%" style="min-height: 500px; border: none;"></iframe>
                `;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExtension)) {
                viewer.innerHTML = `
                    <img src="${fileUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: 0 auto;" />
                `;
            } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(fileExtension)) {
                (async () => {
                    const text = await blob.text();
                    viewer.innerHTML = `
                        <pre style="background: white; padding: 1rem; border-radius: 4px; max-height: 100%; overflow: auto; white-space: pre-wrap; word-break: break-all; font-size: 12px; margin: 0;">${text}</pre>
                    `;
                })();
            } else {
                viewer.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <p style="font-size: 3rem;">📄</p>
                        <p>File tidak bisa dipreview.</p>
                        <p style="color: var(--gray-500); font-size: 0.875rem;">${fileName}</p>
                        <p style="color: var(--gray-400); font-size: 0.8rem;">Silakan download untuk melihat isi file.</p>
                    </div>
                `;
            }
            loading.style.display = 'none';
        }, 100);

    } catch (error) {
        console.error('❌ Preview error:', error);
        alert('Gagal memuat file!');
    }
}

   // ========== CLOSE MODAL PREVIEW ==========
function closePdfModal() {
    const modal = document.getElementById('pdfModal');
    if (modal) {
        modal.classList.remove('show');
        console.log('✅ Modal ditutup');
    }
}

// ========== TUTUP MODAL SAAT KLIK DI LUAR ==========
document.addEventListener('click', function(e) {
    const modal = document.getElementById('pdfModal');
    if (e.target === modal) {
        modal.classList.remove('show');
        console.log('✅ Modal ditutup (klik di luar)');
    }
});


document.addEventListener('DOMContentLoaded', loadNilaiPage);