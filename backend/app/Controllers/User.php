<?php

namespace App\Controllers;

use App\Models\UserModel;

class User extends BaseController
{
    public function index()
    {
        $model = new UserModel();
        $users = $model->findAll();
        return $this->response->setJSON([
            'status' => 200,
            'data' => $users
        ]);
    }

    public function createDosen()
    {
        $data = $this->request->getJSON();

        if (!isset($data->username) || !isset($data->name) || !isset($data->password)) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Semua field wajib diisi'
            ])->setStatusCode(400);
        }

        $model = new UserModel();
        $existing = $model->where('username', $data->username)->first();
        if ($existing) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Username sudah digunakan'
            ])->setStatusCode(400);
        }

        $newUser = [
            'username' => $data->username,
            'name' => $data->name,
            'password' => password_hash($data->password, PASSWORD_BCRYPT),
            'role' => 'dosen',
            'prodi' => null,
            'angkatan' => null,
            'created_at' => date('Y-m-d H:i:s'),
        ];

        $model->insert($newUser);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Dosen berhasil ditambahkan'
        ]);
    }

   public function createMahasiswa()
{
    $data = $this->request->getJSON();

    if (!isset($data->username) || !isset($data->name) || !isset($data->password) || !isset($data->prodi) || !isset($data->angkatan)) {
        return $this->response->setJSON([
            'status' => 400,
            'message' => 'Semua field wajib diisi'
        ])->setStatusCode(400);
    }

    $model = new UserModel();
    $existing = $model->where('username', $data->username)->first();
    if ($existing) {
        return $this->response->setJSON([
            'status' => 400,
            'message' => 'NPM sudah digunakan'
        ])->setStatusCode(400);
    }

    $newUser = [
        'username' => $data->username,
        'name' => $data->name,
        'password' => password_hash($data->password, PASSWORD_BCRYPT),
        'role' => 'mahasiswa',
        'prodi' => $data->prodi,
        'angkatan' => $data->angkatan,
    ];

    $model->insert($newUser);
    $user_id = $model->getInsertID();

    // 🔥 AUTO-ENROLL KE KELAS YANG SESUAI
    $result = $model->autoEnrollToKelas($user_id);

    $message = 'Mahasiswa berhasil ditambahkan';
    if ($result['enrolled'] === 1) {
        $message .= ' dan otomatis terdaftar ke kelas ' . $result['kelas']['nama'];
    } elseif ($result['enrolled'] === 0) {
        $message .= '. ' . $result['reason'];
    }

    return $this->response->setJSON([
        'status' => 200,
        'message' => $message,
        'data' => [
            'user_id' => $user_id,
            'auto_enroll' => $result
        ]
    ]);
}

    public function update($id)
    {
        $data = $this->request->getJSON();
        $model = new UserModel();
        $user = $model->find($id);

        if (!$user) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'User tidak ditemukan'
            ])->setStatusCode(404);
        }

        $updateData = [];
        if (isset($data->username)) $updateData['username'] = $data->username;
        if (isset($data->angkatan)) $updateData['angkatan'] = $data->angkatan;
        if (isset($data->name)) $updateData['name'] = $data->name;
        if (isset($data->password)) $updateData['password'] = password_hash($data->password, PASSWORD_BCRYPT);
        if (isset($data->role) && $user['role'] !== 'admin') $updateData['role'] = $data->role;

        $model->update($id, $updateData);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'User berhasil diupdate'
        ]);
    }

    public function delete($id)
    {
        $model = new UserModel();
        $user = $model->find($id);

        if (!$user) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'User tidak ditemukan'
            ])->setStatusCode(404);
        }

        if ($user['role'] === 'admin') {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Tidak bisa menghapus admin'
            ])->setStatusCode(400);
        }

        $model->delete($id);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'User berhasil dihapus'
        ]);
    }
}