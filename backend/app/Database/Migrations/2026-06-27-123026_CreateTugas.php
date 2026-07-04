<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTugas extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'auto_increment' => true],
            'judul' => ['type' => 'VARCHAR', 'constraint' => 100],
            'deskripsi' => ['type' => 'TEXT'],
            'deadline' => ['type' => 'DATETIME'],
            'lampiran' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'kelas_id' => ['type' => 'INT'],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('kelas_id', 'kelas', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('tugas');
    }

    public function down()
    {
        $this->forge->dropTable('tugas');
    }
}