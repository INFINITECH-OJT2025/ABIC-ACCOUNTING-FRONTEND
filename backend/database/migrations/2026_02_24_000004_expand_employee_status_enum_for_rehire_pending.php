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
            "ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned', 'rehire_pending', 'rehired_employee') NOT NULL DEFAULT 'pending'"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Map rehire_pending to pending before shrinking enum.
        DB::table('employees')
            ->where('status', 'rehire_pending')
            ->update(['status' => 'pending']);

        DB::statement(
            "ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned', 'rehired_employee') NOT NULL DEFAULT 'pending'"
        );
    }
};

