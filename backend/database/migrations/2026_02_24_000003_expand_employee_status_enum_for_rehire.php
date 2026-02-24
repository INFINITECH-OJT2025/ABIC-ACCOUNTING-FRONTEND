<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned', 'rehired_employee') NOT NULL DEFAULT 'pending'"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Map rehired_employee back to employed before shrinking enum.
        DB::table('employees')
            ->where('status', 'rehired_employee')
            ->update(['status' => 'employed']);

        DB::statement(
            "ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned') NOT NULL DEFAULT 'pending'"
        );
    }
};

