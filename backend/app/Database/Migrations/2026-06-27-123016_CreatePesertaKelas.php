<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePesertaKelas extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'auto_increment' => true],
            'mahasiswa_id' => ['type' => 'INT'],
            'kelas_id' => ['type' => 'INT'],
            'enrolled_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('mahasiswa_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('kelas_id', 'kelas', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('peserta_kelas');
    }

    public function down()
    {
        $this->forge->dropTable('peserta_kelas');
    }
}