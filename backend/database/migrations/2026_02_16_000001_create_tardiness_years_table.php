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
        Schema::create('tardiness_years', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique();
            $table->timestamps();
        });

        // Seed initial years
        DB::table('tardiness_years')->insert([
            ['year' => 2025, 'created_at' => now(), 'updated_at' => now()],
            ['year' => 2026, 'created_at' => now(), 'updated_at' => now()],
            ['year' => 2027, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tardiness_years');
    }
};
