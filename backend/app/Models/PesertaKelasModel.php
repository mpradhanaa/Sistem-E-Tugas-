<?php

namespace App\Models;

use CodeIgniter\Model;

class PesertaKelasModel extends Model
{
    protected $table = 'peserta_kelas';
    protected $primaryKey = 'id';
    protected $allowedFields = ['mahasiswa_id', 'kelas_id', 'enrolled_at'];
    protected $returnType = 'array';
    protected $useTimestamps = false;
}