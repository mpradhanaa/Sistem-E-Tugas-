<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    protected $allowedFields = ['username', 'name', 'password', 'role', 'prodi', 'angkatan'];
    protected $returnType = 'array';
    protected $useTimestamps = false;

    /**
     * Ambil mahasiswa berdasarkan prodi, angkatan, dan range NPM
     * @param string $prodi
     * @param string $angkatan
     * @param string $kelas (A, B, C)
     * @return array
     */
    public function getMahasiswaByRange($prodi, $angkatan, $kelas)
    {
        // 🔥 Tentukan range nomor urut berdasarkan kelas (A/B/C)
        $ranges = [
            'A' => ['min' => 1, 'max' => 35],
            'B' => ['min' => 36, 'max' => 70],
            'C' => ['min' => 71, 'max' => 105],
            'D' => ['min' => 106, 'max' => 140],
            'E' => ['min' => 141, 'max' => 175],
        ];

        // Default ke A jika kelas tidak dikenal
        $min = $ranges[$kelas]['min'] ?? 1;
        $max = $ranges[$kelas]['max'] ?? 35;

        // 🔥 Ambil 3 digit terakhir dari NPM (nomor urut)
        // Contoh: 20230908001 → 001 → 1
        return $this->where('role', 'mahasiswa')
            ->where('prodi', $prodi)
            ->where('angkatan', $angkatan)
            ->where('CAST(SUBSTRING(username, 9, 3) AS UNSIGNED) >=', $min)
            ->where('CAST(SUBSTRING(username, 9, 3) AS UNSIGNED) <=', $max)
            ->findAll();
    }

    /**
     * Cari dan enroll mahasiswa ke kelas yang sesuai
     * @param int $mahasiswa_id
     * @return array ['enrolled' => int, 'kelas' => array|null, 'reason' => string]
     */
    public function autoEnrollToKelas($mahasiswa_id)
    {
        $mahasiswa = $this->find($mahasiswa_id);
        
        // Cek apakah mahasiswa valid
        if (!$mahasiswa || $mahasiswa['role'] !== 'mahasiswa') {
            return ['enrolled' => 0, 'kelas' => null, 'reason' => 'Bukan mahasiswa'];
        }

        // Ambil 3 digit terakhir NPM (nomor urut)
        // NPM: 20230908001 → 8 digit terakhir? 
        // Kita ambil dari posisi 9 (1-indexed) sebanyak 3 karakter
        $nomor_urut = (int) substr($mahasiswa['username'], 8, 3);

        // Tentukan kelas berdasarkan range
        $kelas_map = [
            1 => 'A', 
            36 => 'B', 
            71 => 'C', 
            106 => 'D', 
            141 => 'E'
        ];
        
        $kelas = 'A';
        foreach ($kelas_map as $min => $k) {
            if ($nomor_urut >= $min) {
                $kelas = $k;
            }
        }

        // Cari kelas yang sesuai (prodi + angkatan + kelas)
        $kelasModel = new KelasModel();
        $kelasData = $kelasModel->where('prodi', $mahasiswa['prodi'])
            ->where('angkatan', $mahasiswa['angkatan'])
            ->where('kelas', $kelas)
            ->first();

        if (!$kelasData) {
            return [
                'enrolled' => 0, 
                'kelas' => null, 
                'reason' => 'Kelas ' . $kelas . ' belum dibuka oleh dosen'
            ];
        }

        // Enroll mahasiswa ke kelas
        $pesertaModel = new PesertaKelasModel();
        $existing = $pesertaModel->where('mahasiswa_id', $mahasiswa_id)
            ->where('kelas_id', $kelasData['id'])
            ->first();

        if ($existing) {
            return [
                'enrolled' => 0, 
                'kelas' => $kelasData, 
                'reason' => 'Sudah terdaftar di kelas ' . $kelasData['nama']
            ];
        }

        $pesertaModel->insert([
            'mahasiswa_id' => $mahasiswa_id,
            'kelas_id' => $kelasData['id'],
            'enrolled_at' => date('Y-m-d H:i:s'),
        ]);

        return [
            'enrolled' => 1, 
            'kelas' => $kelasData, 
            'reason' => 'Berhasil terdaftar ke kelas ' . $kelasData['nama']
        ];
    }
}