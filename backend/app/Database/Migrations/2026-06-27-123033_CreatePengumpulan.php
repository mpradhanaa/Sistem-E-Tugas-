<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePengumpulan extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'auto_increment' => true],
            'file_path' => ['type' => 'VARCHAR', 'constraint' => 255],
            'submitted_at' => ['type' => 'DATETIME', 'null' => true],
            'score' => ['type' => 'INT', 'null' => true],
            'feedback' => ['type' => 'TEXT', 'null' => true],
            'tugas_id' => ['type' => 'INT'],
            'mahasiswa_id' => ['type' => 'INT'],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('tugas_id', 'tugas', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('mahasiswa_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('pengumpulan');
    }

    public function down()
    {
        $this->forge->dropTable('pengumpulan');
    }
}