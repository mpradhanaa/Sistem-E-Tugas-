<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateKelas extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'auto_increment' => true],
            'nama' => ['type' => 'VARCHAR', 'constraint' => 100],
            'kode' => ['type' => 'VARCHAR', 'constraint' => 20, 'unique' => true],
            'deskripsi' => ['type' => 'TEXT', 'null' => true],
            'prodi' => ['type' => 'VARCHAR', 'constraint' => 50],
            'angkatan' => ['type' => 'VARCHAR', 'constraint' => 4],
            'kelas' => ['type' => 'VARCHAR', 'constraint' => 10],
            'dosen_id' => ['type' => 'INT'],
            'status' => ['type' => 'ENUM("aktif","ditutup")', 'default' => 'aktif'],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('dosen_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('kelas');
    }

    public function down()
    {
        $this->forge->dropTable('kelas');
    }
}