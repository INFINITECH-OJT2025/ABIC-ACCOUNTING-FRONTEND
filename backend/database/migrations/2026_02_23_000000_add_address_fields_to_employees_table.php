<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('perm_house_number')->nullable()->after('zip_code');
            $table->string('perm_street')->nullable()->after('perm_house_number');
            $table->string('perm_village')->nullable()->after('perm_street');
            $table->string('perm_subdivision')->nullable()->after('perm_village');
            $table->string('perm_barangay')->nullable()->after('perm_subdivision');
            $table->string('perm_city_municipality')->nullable()->after('perm_barangay');
            $table->string('perm_province')->nullable()->after('perm_city_municipality');
            $table->string('perm_region')->nullable()->after('perm_province');
            $table->string('perm_zip_code')->nullable()->after('perm_region');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'perm_house_number',
                'perm_street',
                'perm_village',
                'perm_subdivision',
                'perm_barangay',
                'perm_city_municipality',
                'perm_province',
                'perm_region',
                'perm_zip_code',
            ]);
        });
    }
};
