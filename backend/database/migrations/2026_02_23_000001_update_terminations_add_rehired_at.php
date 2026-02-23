<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * - Changes termination_date from date → datetime (stores time too)
     * - Adds rehired_at (nullable datetime) to track when employee was rehired
     */
    public function up(): void
    {
        Schema::table('terminations', function (Blueprint $table) {
            // Change termination_date from date to datetime
            $table->dateTime('termination_date')->change();

            // Add rehired_at timestamp (null = still terminated)
            $table->dateTime('rehired_at')->nullable()->after('termination_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('terminations', function (Blueprint $table) {
            $table->date('termination_date')->change();
            $table->dropColumn('rehired_at');
        });
    }
};
