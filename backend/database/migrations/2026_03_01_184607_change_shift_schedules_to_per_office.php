<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('department_shift_schedules', function (Blueprint $table) {
            $table->renameColumn('department', 'office_name');
        });

        Schema::rename('department_shift_schedules', 'office_shift_schedules');
    }

    public function down(): void
    {
        Schema::rename('office_shift_schedules', 'department_shift_schedules');

        Schema::table('department_shift_schedules', function (Blueprint $table) {
            $table->renameColumn('office_name', 'department');
        });
    }
};
