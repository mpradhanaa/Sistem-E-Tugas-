<?php

namespace App\Controllers;

use App\Models\TugasModel;
use App\Models\PengumpulanModel;

class Mahasiswa extends BaseController
{
    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    // ========== DASHBOARD MAHASISWA ==========
public function dashboard()
{
    $user = $this->request->user;

    // Ambil semua kelas yang diikuti mahasiswa
    $kelas_ids = $this->db->table('peserta_kelas')
        ->select('kelas_id')
        ->where('mahasiswa_id', $user->id)
        ->get()
        ->getResultArray();
    $kelas_ids = array_column($kelas_ids, 'kelas_id');

    $total_kelas = count($kelas_ids);
    $total_tugas = 0;
    $total_selesai = 0;

    if (!empty($kelas_ids)) {
        $tugasModel = new \App\Models\TugasModel();
        $total_tugas = $tugasModel->whereIn('kelas_id', $kelas_ids)->countAllResults();

        $total_selesai = $this->db->table('pengumpulan')
            ->where('mahasiswa_id', $user->id)
            ->countAllResults();
    }

    return $this->response->setJSON([
        'status' => 200,
        'data' => [
            'total_kelas' => $total_kelas,
            'total_tugas' => $total_tugas,
            'total_selesai' => $total_selesai,
        ]
    ]);
}

    // ========== 1. LIHAT DAFTAR TUGAS ==========
    public function tugas()
    {
        $user = $this->request->user;

        // Ambil semua kelas yang diikuti mahasiswa
        $kelas_ids = $this->db->table('peserta_kelas')
            ->select('kelas_id')
            ->where('mahasiswa_id', $user->id)
            ->get()
            ->getResultArray();
        $kelas_ids = array_column($kelas_ids, 'kelas_id');

        if (empty($kelas_ids)) {
            return $this->response->setJSON([
                'status' => 200,
                'data' => []
            ]);
        }

        $tugasModel = new TugasModel();
        $tugas = $tugasModel->select('tugas.*, kelas.nama as nama_kelas, users.name as nama_dosen')
            ->join('kelas', 'kelas.id = tugas.kelas_id')
            ->join('users', 'users.id = kelas.dosen_id')
            ->whereIn('tugas.kelas_id', $kelas_ids)
            ->orderBy('tugas.deadline', 'ASC')
            ->findAll();

        // Tambahkan status pengumpulan
        foreach ($tugas as &$t) {
            $pengumpulan = $this->db->table('pengumpulan')
                ->where('tugas_id', $t['id'])
                ->where('mahasiswa_id', $user->id)
                ->get()
                ->getRowArray();

            $t['status'] = $pengumpulan ? 'sudah' : 'belum';
            $t['nilai'] = $pengumpulan['score'] ?? null;
            $t['feedback'] = $pengumpulan['feedback'] ?? null;
        }

        return $this->response->setJSON([
            'status' => 200,
            'data' => $tugas
        ]);
    }

    // ========== 2. KUMPULKAN TUGAS ==========
    public function submit($tugas_id)
    {
        $user = $this->request->user;
        $file = $this->request->getFile('file');

        // Cek apakah tugas ada
        $tugasModel = new TugasModel();
        $tugas = $tugasModel->find($tugas_id);

        if (!$tugas) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Tugas tidak ditemukan'
            ])->setStatusCode(404);
        }

        // 🔥 CEK DEADLINE (Status kelas diabaikan)
        $now = date('Y-m-d H:i:s');
        if ($now > $tugas['deadline']) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Melewati deadline tugas'
            ])->setStatusCode(400);
        }

        // Cek apakah sudah pernah mengumpulkan
        $pengumpulanModel = new PengumpulanModel();
        $existing = $pengumpulanModel->where('tugas_id', $tugas_id)
            ->where('mahasiswa_id', $user->id)
            ->first();

        if ($existing) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Anda sudah mengumpulkan tugas ini'
            ])->setStatusCode(400);
        }

        // 🔥 CEK FILE
        if (!$file || !$file->isValid()) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'File wajib diupload'
            ])->setStatusCode(400);
        }

        // Upload file
        $newName = $user->id . '_' . $tugas_id . '_' . time() . '.' . $file->getExtension();
        $file->move(WRITEPATH . 'uploads', $newName);

        // Simpan data pengumpulan
        $pengumpulanModel->insert([
            'tugas_id' => $tugas_id,
            'mahasiswa_id' => $user->id,
            'file_path' => 'uploads/' . $newName,
            'submitted_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Tugas berhasil dikumpulkan'
        ]);
    }

    // ========== 3. LIHAT NILAI + FEEDBACK ==========
    public function nilai()
    {
        $user = $this->request->user;

        $pengumpulan = $this->db->table('pengumpulan')
            ->select('pengumpulan.*, tugas.judul, kelas.nama as nama_kelas')
            ->join('tugas', 'tugas.id = pengumpulan.tugas_id')
            ->join('kelas', 'kelas.id = tugas.kelas_id')
            ->where('pengumpulan.mahasiswa_id', $user->id)
            ->orderBy('pengumpulan.submitted_at', 'DESC')
            ->get()
            ->getResultArray();

        return $this->response->setJSON([
            'status' => 200,
            'data' => $pengumpulan
        ]);
    }

    // ========== 4. LIHAT DAFTAR KELAS ==========
    public function kelas()
    {
        $user = $this->request->user;

        $kelas = $this->db->table('peserta_kelas')
            ->select('kelas.*, users.name as nama_dosen')
            ->join('kelas', 'kelas.id = peserta_kelas.kelas_id')
            ->join('users', 'users.id = kelas.dosen_id')
            ->where('peserta_kelas.mahasiswa_id', $user->id)
            ->orderBy('kelas.nama', 'ASC')
            ->get()
            ->getResultArray();

        return $this->response->setJSON([
            'status' => 200,
            'data' => $kelas
        ]);
    }

    // ========== DOWNLOAD FILE LAMPIRAN ==========
public function download($filename)
{
    $user = $this->request->user;
    
    // Cari file di database berdasarkan nama file
    $filePath = WRITEPATH . 'uploads/' . $filename;
    
    if (!file_exists($filePath)) {
        return $this->response->setJSON([
            'status' => 404,
            'message' => 'File tidak ditemukan'
        ])->setStatusCode(404);
    }

    return $this->response->download($filePath, null);
}

// ========== PREVIEW FILE (TAMPIL DI BROWSER) ==========
public function preview($filename)
{
    $user = $this->request->user;
    
    $filePath = WRITEPATH . 'uploads/' . $filename;
    
    // 🔥 TAMBAHKAN LOG INI
    log_message('debug', '🔍 Mencari file di: ' . $filePath);
    log_message('debug', '📄 File exists: ' . (file_exists($filePath) ? 'YES' : 'NO'));

    if (!file_exists($filePath)) {
        return $this->response->setStatusCode(404)->setBody('File tidak ditemukan');
    }

    // Tentukan MIME type berdasarkan ekstensi
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $mimeTypes = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'txt' => 'text/plain',
        'md' => 'text/markdown',
        'json' => 'application/json',
        'xml' => 'application/xml',
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
    ];

    $mime = $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';

    // 🔥 KIRIM FILE TANPA HEADER CONTENT-DISPOSITION (AGAR TIDAK DOWNLOAD)
    return $this->response
        ->setHeader('Content-Type', $mime)
        ->setBody(file_get_contents($filePath));
}

}