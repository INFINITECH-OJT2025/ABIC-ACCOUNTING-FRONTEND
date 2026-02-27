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
        // 1. Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // 2. Drop foreign keys if they exist (using try-catch for robustness)
        try {
            DB::statement('ALTER TABLE terminations DROP FOREIGN KEY terminations_employee_id_foreign');
        } catch (\Exception $e) {
        }
        try {
            DB::statement('ALTER TABLE tardiness_entries DROP FOREIGN KEY tardiness_entries_employee_id_foreign');
        } catch (\Exception $e) {
        }
        try {
            DB::statement('ALTER TABLE employee_additional_values DROP FOREIGN KEY employee_additional_values_employee_id_foreign');
        } catch (\Exception $e) {
        }

        // 3. Change employees.id to string
        DB::statement('ALTER TABLE employees MODIFY id VARCHAR(255) NOT NULL');

        // 4. Change employee_id in referencing tables to string (safely)
        if (Schema::hasTable('terminations')) {
            DB::statement('ALTER TABLE terminations MODIFY employee_id VARCHAR(255) NOT NULL');
            DB::statement('ALTER TABLE terminations ADD CONSTRAINT terminations_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE');
        }

        if (Schema::hasTable('tardiness_entries')) {
            DB::statement('ALTER TABLE tardiness_entries MODIFY employee_id VARCHAR(255) NOT NULL');
            DB::statement('ALTER TABLE tardiness_entries ADD CONSTRAINT tardiness_entries_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE');
        }

        if (Schema::hasTable('employee_additional_values')) {
            DB::statement('ALTER TABLE employee_additional_values MODIFY employee_id VARCHAR(255) NOT NULL');
            DB::statement('ALTER TABLE employee_additional_values ADD CONSTRAINT employee_additional_values_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE');
        }

        // 5. Change target_id and user_id in activity_logs
        if (Schema::hasTable('activity_logs')) {
            DB::statement('ALTER TABLE activity_logs MODIFY target_id VARCHAR(255) NULL');
            DB::statement('ALTER TABLE activity_logs MODIFY user_id VARCHAR(255) NULL');
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        Schema::table('employees', function (Blueprint $table) {
            $table->bigIncrements('id')->change();
        });

        Schema::table('terminations', function (Blueprint $table) {
            $table->unsignedBigInteger('employee_id')->change();
        });

        Schema::table('tardiness_entries', function (Blueprint $table) {
            $table->unsignedBigInteger('employee_id')->change();
        });

        Schema::table('employee_additional_values', function (Blueprint $table) {
            $table->unsignedBigInteger('employee_id')->change();
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('target_id')->nullable()->change();
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
};
