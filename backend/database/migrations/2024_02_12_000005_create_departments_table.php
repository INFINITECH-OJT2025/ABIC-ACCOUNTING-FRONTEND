<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_custom')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        // Insert default departments
        $defaultDepartments = [
            'IT DEPARTMENT',
            'SALES DEPARTMENT',
            'ADMIN DEPARTMENT',
            'MARKETING DEPARTMENT',
            'STUDIO DEPARTMENT',
            'ACCOUNTING DEPARTMENT',
            'MULTIMEDIA DEPARTMENT'
        ];

        foreach ($defaultDepartments as $department) {
            DB::table('departments')->insert([
                'name' => $department,
                'is_custom' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
