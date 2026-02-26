<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned', 'rehire_pending', 'rehired_employee', 'termination_pending', 'resignation_pending') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned', 'rehire_pending', 'rehired_employee') DEFAULT 'pending'");
    }
};
