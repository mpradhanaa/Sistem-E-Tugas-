<?php

namespace App\Models;

use CodeIgniter\Model;

class TugasModel extends Model
{
    protected $table = 'tugas';
    protected $primaryKey = 'id';
    protected $allowedFields = ['judul', 'deskripsi', 'deadline', 'lampiran', 'kelas_id'];
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $createdField = 'created_at';
    protected $updatedField = false;
}