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
        // Step 1: Expand the enum to include both 'approved' and 'employed'
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'approved', 'employed', 'terminated') NOT NULL DEFAULT 'pending'");

        // Step 2: Update existing 'approved' records to 'employed'
        DB::table('employees')
            ->where('status', 'approved')
            ->update(['status' => 'employed']);

        // Step 3: Remove 'approved' from the enum now that no rows use it
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Expand enum to include both values
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'approved', 'employed', 'terminated') NOT NULL DEFAULT 'pending'");

        // Step 2: Revert 'employed' back to 'approved'
        DB::table('employees')
            ->where('status', 'employed')
            ->update(['status' => 'approved']);

        // Step 3: Remove 'employed' from the enum
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'approved', 'terminated') NOT NULL DEFAULT 'pending'");
    }
};
