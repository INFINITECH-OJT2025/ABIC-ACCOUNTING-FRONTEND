<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('onboarded_applicants', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->unsignedBigInteger('hiring_job_offer_id')->unique();
            $table->unsignedBigInteger('final_interview_id')->nullable();
            $table->string('applicant_name')->nullable();
            $table->string('position')->nullable();
            $table->string('department')->nullable();
            $table->decimal('salary', 12, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->timestamp('onboarded_at')->useCurrent();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('hiring_job_offer_id')->references('id')->on('hiring_job_offers')->cascadeOnDelete();
            $table->foreign('final_interview_id')->references('id')->on('hiring_interviews')->nullOnDelete();

            $table->index('employee_id');
            $table->index('start_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarded_applicants');
    }
};
