<?php

namespace App\Controllers;

use App\Models\UserModel;
use Firebase\JWT\JWT;

class Auth extends BaseController
{
    public function login()
    {
        $username = $this->request->getVar('username');
        $password = $this->request->getVar('password');

        if (!$username || !$password) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Username dan password wajib diisi'
            ])->setStatusCode(400);
        }

        $model = new UserModel();
        $user = $model->where('username', $username)->first();

        if (!$user || !password_verify($password, $user['password'])) {
            return $this->response->setJSON([
                'status' => 401,
                'message' => 'Username atau password salah'
            ])->setStatusCode(401);
        }

        $key = getenv('JWT_SECRET');
        $payload = [
            'id' => $user['id'],
            'role' => $user['role'],
            'exp' => time() + (60 * 60 * 24) // 24 jam
        ];

        $token = JWT::encode($payload, $key, 'HS256');

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Login berhasil',
            'token' => $token,
            'role' => $user['role'],
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'role' => $user['role'],
                'prodi' => $user['prodi'],
                'angkatan' => $user['angkatan'],
            ]
        ]);
    }

    public function me()
    {
        $token = $this->request->getHeader('Authorization')->getValue();
        $token = str_replace('Bearer ', '', $token);
        $key = getenv('JWT_SECRET');
        $decoded = JWT::decode($token, new \Firebase\JWT\Key($key, 'HS256'));

        $model = new UserModel();
        $user = $model->find($decoded->id);

        return $this->response->setJSON([
            'status' => 200,
            'data' => $user
        ]);
    }

    // ========== UBAH PASSWORD ==========
public function changePassword()
{
    $user = $this->request->user;
    $data = $this->request->getJSON();

    // 🔥 VALIDASI
    if (!isset($data->old_password) || !isset($data->new_password)) {
        return $this->response->setJSON([
            'status' => 400,
            'message' => 'Password lama dan baru wajib diisi'
        ])->setStatusCode(400);
    }

    // 🔥 CEK PASSWORD LAMA
    $model = new UserModel();
    $userData = $model->find($user->id);

    if (!password_verify($data->old_password, $userData['password'])) {
        return $this->response->setJSON([
            'status' => 400,
            'message' => 'Password lama salah'
        ])->setStatusCode(400);
    }

    // 🔥 CEK PASSWORD BARU (minimal 6 karakter)
    if (strlen($data->new_password) < 6) {
        return $this->response->setJSON([
            'status' => 400,
            'message' => 'Password baru minimal 6 karakter'
        ])->setStatusCode(400);
    }

    // 🔥 UPDATE PASSWORD
    $model->update($user->id, [
        'password' => password_hash($data->new_password, PASSWORD_BCRYPT)
    ]);

    return $this->response->setJSON([
        'status' => 200,
        'message' => 'Password berhasil diubah'
    ]);
}

}