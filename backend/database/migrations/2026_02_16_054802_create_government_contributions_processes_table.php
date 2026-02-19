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
        if (!Schema::hasTable('government_contributions_processes')) {
            Schema::create('government_contributions_processes', function (Blueprint $table) {
                $table->id();
                $table->string('government_contribution_type')->comment('Type of government contribution, e.g., SSS, PhilHealth, Pag-IBIG');
                $table->string('process_type');
                $table->text('process');
                $table->integer('step_number');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('government_contributions_processes');
    }
};
