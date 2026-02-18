<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employee_additional_fields', function (Blueprint $table) {
            // field_type: text | number | date | textarea | time | email | url
            $table->string('field_type')->default('text')->after('field_key');
            // field_unit: optional unit label (e.g. cm, kg, lbs, inches)
            $table->string('field_unit')->nullable()->after('field_type');
        });
    }

    public function down(): void
    {
        Schema::table('employee_additional_fields', function (Blueprint $table) {
            $table->dropColumn(['field_type', 'field_unit']);
        });
    }
};
