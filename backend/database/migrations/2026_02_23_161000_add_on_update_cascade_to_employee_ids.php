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
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Drop current foreign keys and recreate with ON UPDATE CASCADE
        if (Schema::hasTable('terminations')) {
            try {
                DB::statement('ALTER TABLE terminations DROP FOREIGN KEY terminations_employee_id_foreign');
            } catch (\Exception $e) {
            }
            DB::statement('ALTER TABLE terminations ADD CONSTRAINT terminations_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE');
        }

        if (Schema::hasTable('tardiness_entries')) {
            try {
                DB::statement('ALTER TABLE tardiness_entries DROP FOREIGN KEY tardiness_entries_employee_id_foreign');
            } catch (\Exception $e) {
            }
            DB::statement('ALTER TABLE tardiness_entries ADD CONSTRAINT tardiness_entries_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE');
        }

        if (Schema::hasTable('employee_additional_values')) {
            try {
                DB::statement('ALTER TABLE employee_additional_values DROP FOREIGN KEY employee_additional_values_employee_id_foreign');
            } catch (\Exception $e) {
            }
            DB::statement('ALTER TABLE employee_additional_values ADD CONSTRAINT employee_additional_values_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE');
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        if (Schema::hasTable('terminations')) {
            try {
                DB::statement('ALTER TABLE terminations DROP FOREIGN KEY terminations_employee_id_foreign');
            } catch (\Exception $e) {
            }
            DB::statement('ALTER TABLE terminations ADD CONSTRAINT terminations_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE');
        }

        if (Schema::hasTable('tardiness_entries')) {
            try {
                DB::statement('ALTER TABLE tardiness_entries DROP FOREIGN KEY tardiness_entries_employee_id_foreign');
            } catch (\Exception $e) {
            }
            DB::statement('ALTER TABLE tardiness_entries ADD CONSTRAINT tardiness_entries_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE');
        }

        if (Schema::hasTable('employee_additional_values')) {
            try {
                DB::statement('ALTER TABLE employee_additional_values DROP FOREIGN KEY employee_additional_values_employee_id_foreign');
            } catch (\Exception $e) {
            }
            DB::statement('ALTER TABLE employee_additional_values ADD CONSTRAINT employee_additional_values_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE');
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }
};
