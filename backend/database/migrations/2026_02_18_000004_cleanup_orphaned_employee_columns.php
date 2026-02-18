<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Drop orphaned columns that were added before field_type was tracked properly
        $orphaned = ['height', 'height_1', 'birthdate'];
        foreach ($orphaned as $col) {
            if (Schema::hasColumn('employees', $col)) {
                Schema::table('employees', function (Blueprint $table) use ($col) {
                    $table->dropColumn($col);
                });
            }
        }
    }

    public function down(): void
    {
        // No rollback needed for cleanup
    }
};
