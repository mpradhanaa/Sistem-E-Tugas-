<?php

namespace App\Models;

use CodeIgniter\Model;

class KelasModel extends Model
{
    protected $table = 'kelas';
    protected $primaryKey = 'id';
    protected $allowedFields = ['nama', 'kode', 'deskripsi', 'prodi', 'angkatan', 'kelas', 'dosen_id', 'status'];
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $createdField = 'created_at';
    protected $updatedField = false;
}