<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run()
    {
        $data = [
            // Admin
            [
                'username' => 'admin',
                'name' => 'Admin Sistem',
                'password' => password_hash('admin123', PASSWORD_BCRYPT),
                'role' => 'admin',
                'prodi' => null,
                'angkatan' => null,
            ],
            // Dosen
            [
                'username' => 'DOS001',
                'name' => 'Dr. Budi Santoso',
                'password' => password_hash('dosen123', PASSWORD_BCRYPT),
                'role' => 'dosen',
                'prodi' => null,
                'angkatan' => null,
            ],
            [
                'username' => 'DOS002',
                'name' => 'Dr. Siti Rahayu',
                'password' => password_hash('dosen123', PASSWORD_BCRYPT),
                'role' => 'dosen',
                'prodi' => null,
                'angkatan' => null,
            ],
            // Mahasiswa
            [
                'username' => '20230908001',
                'name' => 'Ani Wijaya',
                'password' => password_hash('mhs123', PASSWORD_BCRYPT),
                'role' => 'mahasiswa',
                'prodi' => 'TI',
                'angkatan' => '2023',
            ],
            [
                'username' => '20230908002',
                'name' => 'Budi Santoso',
                'password' => password_hash('mhs123', PASSWORD_BCRYPT),
                'role' => 'mahasiswa',
                'prodi' => 'TI',
                'angkatan' => '2023',
            ],
        ];

        $this->db->table('users')->insertBatch($data);
    }
}