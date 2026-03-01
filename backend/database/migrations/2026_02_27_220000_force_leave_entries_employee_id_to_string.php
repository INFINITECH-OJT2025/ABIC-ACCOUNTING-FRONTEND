<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('leave_entries') || !Schema::hasColumn('leave_entries', 'employee_id')) {
            return;
        }

        // Keep this migration resilient even if prior migration history is out-of-sync.
        DB::statement('ALTER TABLE leave_entries MODIFY employee_id VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('leave_entries') || !Schema::hasColumn('leave_entries', 'employee_id')) {
            return;
        }

        DB::statement('ALTER TABLE leave_entries MODIFY employee_id BIGINT UNSIGNED NULL');
    }
};

