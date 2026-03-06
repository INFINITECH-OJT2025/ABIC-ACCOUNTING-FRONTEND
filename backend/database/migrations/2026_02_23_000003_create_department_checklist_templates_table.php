<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('department_checklist_templates')) {
            Schema::create('department_checklist_templates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
                $table->string('checklist_type'); // ONBOARDING, CLEARANCE
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->unique(['department_id', 'checklist_type'], 'department_checklist_type_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('department_checklist_templates');
    }
};
