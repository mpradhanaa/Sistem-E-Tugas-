<?php

namespace App\Controllers;

use App\Models\KelasModel;
use App\Models\UserModel;
use App\Models\PesertaKelasModel;

class Kelas extends BaseController
{
    public function index()
    {
        $model = new KelasModel();
        $user = $this->request->user;

        if ($user->role === 'admin') {
            $kelas = $model->findAll();
        } else if ($user->role === 'dosen') {
            $kelas = $model->where('dosen_id', $user->id)->findAll();
        } else {
            return $this->response->setJSON([
                'status' => 403,
                'message' => 'Akses ditolak'
            ])->setStatusCode(403);
        }

        return $this->response->setJSON([
            'status' => 200,
            'data' => $kelas
        ]);
    }

    public function create()
    {
        $data = $this->request->getJSON();
        $user = $this->request->user;

        if ($user->role !== 'dosen' && $user->role !== 'admin') {
            return $this->response->setJSON([
                'status' => 403,
                'message' => 'Akses ditolak'
            ])->setStatusCode(403);
        }

        $model = new KelasModel();

        $existing = $model->where('kode', $data->kode)->first();
        if ($existing) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Kode kelas sudah digunakan'
            ])->setStatusCode(400);
        }

        $kelasData = [
            'nama' => $data->nama,
            'kode' => $data->kode,
            'deskripsi' => $data->deskripsi ?? '',
            'prodi' => $data->prodi,
            'angkatan' => $data->angkatan,
            'kelas' => $data->kelas,
            'dosen_id' => $user->role === 'admin' ? ($data->dosen_id ?? $user->id) : $user->id,
            'status' => 'aktif',
           'created_at' => date('Y-m-d H:i:s'),
        ];

        $kelas_id = $model->insert($kelasData);

        $userModel = new UserModel();
        $mahasiswa = $userModel->getMahasiswaByRange($data->prodi, $data->angkatan, $data->kelas);

        $pesertaModel = new PesertaKelasModel();
        foreach ($mahasiswa as $mhs) {
            $pesertaModel->insert([
                'mahasiswa_id' => $mhs['id'],
                'kelas_id' => $kelas_id,
                'enrolled_at' => date('Y-m-d H:i:s'),
            ]);
        }

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Kelas berhasil dibuka',
            'data' => ['id' => $kelas_id, 'total_mahasiswa' => count($mahasiswa)]
        ]);
    }

    public function show($id)
    {
        $model = new KelasModel();
        $kelas = $model->find($id);

        if (!$kelas) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Kelas tidak ditemukan'
            ])->setStatusCode(404);
        }

        $pesertaModel = new PesertaKelasModel();
        $mahasiswa = $pesertaModel->select('users.id, users.username, users.name')
            ->join('users', 'users.id = peserta_kelas.mahasiswa_id')
            ->where('peserta_kelas.kelas_id', $id)
            ->findAll();

        return $this->response->setJSON([
            'status' => 200,
            'data' => [
                'kelas' => $kelas,
                'mahasiswa' => $mahasiswa
            ]
        ]);
    }

    public function update($id)
    {
        $data = $this->request->getJSON();
        $model = new KelasModel();
        $kelas = $model->find($id);

        if (!$kelas) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Kelas tidak ditemukan'
            ])->setStatusCode(404);
        }

        $user = $this->request->user;
        if ($user->role !== 'admin' && $kelas['dosen_id'] != $user->id) {
            return $this->response->setJSON([
                'status' => 403,
                'message' => 'Anda bukan pengampu kelas ini'
            ])->setStatusCode(403);
        }

        $updateData = [];
        if (isset($data->nama)) $updateData['nama'] = $data->nama;
        if (isset($data->deskripsi)) $updateData['deskripsi'] = $data->deskripsi;
        if (isset($data->status)) $updateData['status'] = $data->status;

        $model->update($id, $updateData);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Kelas berhasil diupdate'
        ]);
    }

    public function delete($id)
    {
        $model = new KelasModel();
        $kelas = $model->find($id);

        if (!$kelas) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Kelas tidak ditemukan'
            ])->setStatusCode(404);
        }

        $user = $this->request->user;
        if ($user->role !== 'admin' && $kelas['dosen_id'] != $user->id) {
            return $this->response->setJSON([
                'status' => 403,
                'message' => 'Anda bukan pengampu kelas ini'
            ])->setStatusCode(403);
        }

        $model->delete($id);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Kelas berhasil dihapus'
        ]);
    }
}