<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\KelasModel;

class Dashboard extends BaseController
{
    public function admin()
    {
        $userModel = new UserModel();
        $kelasModel = new KelasModel();

        $data = [
            'total_dosen' => $userModel->where('role', 'dosen')->countAllResults(),
            'total_mahasiswa' => $userModel->where('role', 'mahasiswa')->countAllResults(),
            'total_kelas' => $kelasModel->countAll(),
        ];

        return $this->response->setJSON([
            'status' => 200,
            'data' => $data
        ]);
    }

    public function dosen()
{
    $user = $this->request->user;
    $kelasModel = new KelasModel();
    $tugasModel = new \App\Models\TugasModel();
    $pengumpulanModel = new \App\Models\PengumpulanModel();

    $kelas = $kelasModel->where('dosen_id', $user->id)->findAll();
    $kelas_ids = array_column($kelas, 'id');

    $total_tugas = 0;
    $total_pengumpulan = 0;

    if (!empty($kelas_ids)) {
        $total_tugas = $tugasModel->whereIn('kelas_id', $kelas_ids)->countAllResults();
        $total_pengumpulan = $pengumpulanModel->join('tugas', 'tugas.id = pengumpulan.tugas_id')
            ->whereIn('tugas.kelas_id', $kelas_ids)
            ->countAllResults();
    }

    return $this->response->setJSON([
        'status' => 200,
        'data' => [
            'total_kelas' => count($kelas),
            'total_tugas' => $total_tugas,
            'total_pengumpulan' => $total_pengumpulan,
        ]
    ]);
}

public function mahasiswa()
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
}