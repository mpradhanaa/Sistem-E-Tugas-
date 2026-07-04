<?php

namespace App\Controllers;

use App\Models\TugasModel;
use App\Models\KelasModel;

class Tugas extends BaseController
{
    public function index($kelas_id)
    {
        $model = new TugasModel();
        $tugas = $model->where('kelas_id', $kelas_id)->findAll();

        return $this->response->setJSON([
            'status' => 200,
            'data' => $tugas
        ]);
    }

    public function create($kelas_id)
    {
        $user = $this->request->user;

        $kelasModel = new KelasModel();
        $kelas = $kelasModel->find($kelas_id);

        if (!$kelas) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Kelas tidak ditemukan'
            ])->setStatusCode(404);
        }

        if ($user->role !== 'admin' && $kelas['dosen_id'] != $user->id) {
            return $this->response->setJSON([
                'status' => 403,
                'message' => 'Anda bukan pengampu kelas ini'
            ])->setStatusCode(403);
        }

        if ($kelas['status'] === 'ditutup') {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Kelas sudah ditutup, tidak bisa menambahkan tugas'
            ])->setStatusCode(400);
        }

        // 🔥 AMBIL DATA DARI FORM-DATA (BUKAN JSON)
        $judul = $this->request->getPost('judul');
        $deskripsi = $this->request->getPost('deskripsi');
        $deadline = $this->request->getPost('deadline');
        $lampiran = $this->request->getFile('lampiran');

        // Validasi
        if (!$judul || !$deadline) {
            return $this->response->setJSON([
                'status' => 400,
                'message' => 'Judul dan deadline wajib diisi'
            ])->setStatusCode(400);
        }

        // Proses upload lampiran (jika ada)
        $lampiranPath = null;
        if ($lampiran && $lampiran->isValid() && !$lampiran->hasMoved()) {
            // 🔥 CEK UKURAN FILE (max 5MB)
            $maxSize = 5 * 1024 * 1024; // 5MB dalam bytes
            if ($lampiran->getSize() > $maxSize) {
                return $this->response->setJSON([
                    'status' => 400,
                    'message' => 'Ukuran file maksimal 5MB'
                ])->setStatusCode(400);
            }

            // 🔥 CEK EKSTENSI FILE
            $allowedExtensions = ['pdf', 'doc', 'docx', 'zip', 'rar'];
            $extension = $lampiran->getExtension();
            if (!in_array(strtolower($extension), $allowedExtensions)) {
                return $this->response->setJSON([
                    'status' => 400,
                    'message' => 'Format file tidak didukung. Gunakan: PDF, DOC, DOCX, ZIP, RAR'
                ])->setStatusCode(400);
            }

            $newName = 'tugas_' . $kelas_id . '_' . time() . '.' . $extension;
            $lampiran->move(WRITEPATH . 'uploads', $newName);
            $lampiranPath = 'uploads/' . $newName;
        }

        $tugasData = [
            'kelas_id' => $kelas_id,
            'judul' => $judul,
            'deskripsi' => $deskripsi ?? '',
            'deadline' => $deadline,
            'lampiran' => $lampiranPath,
            'created_at' => date('Y-m-d H:i:s'),
        ];

        $model = new TugasModel();
        $tugas_id = $model->insert($tugasData);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Tugas berhasil dikirim',
            'data' => ['id' => $tugas_id]
        ]);
    }

    public function update($id)
    {
        $data = $this->request->getJSON();
        $model = new TugasModel();
        $tugas = $model->find($id);

        if (!$tugas) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Tugas tidak ditemukan'
            ])->setStatusCode(404);
        }

        $updateData = [];
        if (isset($data->judul)) $updateData['judul'] = $data->judul;
        if (isset($data->deskripsi)) $updateData['deskripsi'] = $data->deskripsi;
        if (isset($data->deadline)) $updateData['deadline'] = $data->deadline;

        $model->update($id, $updateData);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Tugas berhasil diupdate'
        ]);
    }

    public function delete($id)
    {
        $model = new TugasModel();
        $tugas = $model->find($id);

        if (!$tugas) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Tugas tidak ditemukan'
            ])->setStatusCode(404);
        }

        $model->delete($id);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Tugas berhasil dihapus'
        ]);
    }
}