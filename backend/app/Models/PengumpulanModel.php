<?php

namespace App\Models;

use CodeIgniter\Model;

class PengumpulanModel extends Model
{
    protected $table = 'pengumpulan';
    protected $primaryKey = 'id';
    protected $allowedFields = ['file_path', 'submitted_at', 'score', 'feedback', 'tugas_id', 'mahasiswa_id'];
    protected $returnType = 'array';
    protected $useTimestamps = false;
}