<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('department')->nullable()->after('position');
            $table->date('onboarding_date')->nullable()->after('department');
            $table->string('access_level')->nullable()->after('onboarding_date');
            $table->text('equipment_issued')->nullable()->after('access_level');
            $table->boolean('training_completed')->default(false)->after('equipment_issued');
            $table->text('onboarding_notes')->nullable()->after('training_completed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'department',
                'onboarding_date',
                'access_level',
                'equipment_issued',
                'training_completed',
                'onboarding_notes'
            ]);
        });
    }
};
