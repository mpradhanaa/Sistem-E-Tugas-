<?php

namespace App\Controllers;

use App\Models\PengumpulanModel;

class Pengumpulan extends BaseController
{
    public function index($tugas_id)
    {
        $model = new PengumpulanModel();
        $pengumpulan = $model->select('pengumpulan.*, users.name as mahasiswa_nama, users.username as npm')
            ->join('users', 'users.id = pengumpulan.mahasiswa_id')
            ->where('pengumpulan.tugas_id', $tugas_id)
            ->findAll();

        return $this->response->setJSON([
            'status' => 200,
            'data' => $pengumpulan
        ]);
    }

    public function update($id)
    {
        $data = $this->request->getJSON();
        $model = new PengumpulanModel();
        $pengumpulan = $model->find($id);

        if (!$pengumpulan) {
            return $this->response->setJSON([
                'status' => 404,
                'message' => 'Pengumpulan tidak ditemukan'
            ])->setStatusCode(404);
        }

        $updateData = [];
        if (isset($data->score)) $updateData['score'] = $data->score;
        if (isset($data->feedback)) $updateData['feedback'] = $data->feedback;

        $model->update($id, $updateData);

        return $this->response->setJSON([
            'status' => 200,
            'message' => 'Nilai berhasil disimpan'
        ]);
    }

 public function download($id)
{
    $model = new \App\Models\PengumpulanModel();
    $pengumpulan = $model->find($id);

    if (!$pengumpulan) {
        return $this->response->setJSON([
            'status' => 404,
            'message' => 'Data pengumpulan tidak ditemukan'
        ])->setStatusCode(404);
    }

    $filePath = WRITEPATH . $pengumpulan['file_path'];
    
    if (!file_exists($filePath)) {
        return $this->response->setJSON([
            'status' => 404,
            'message' => 'File tidak ditemukan di server: ' . $filePath
        ])->setStatusCode(404);
    }

    return $this->response->download($filePath, null);
}
}