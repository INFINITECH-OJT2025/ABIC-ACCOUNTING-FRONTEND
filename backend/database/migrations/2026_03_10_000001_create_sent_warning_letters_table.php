<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sent_warning_letters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->string('employee_name');
            $table->string('type');           // 'late' or 'leave'
            $table->unsignedTinyInteger('warning_level')->default(1);
            $table->string('month');
            $table->unsignedSmallInteger('year');
            $table->string('cutoff');         // 'cutoff1' or 'cutoff2'
            $table->json('recipients');       // array of email strings
            $table->json('forms_included');   // e.g. ['form1','form2']
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamps();

            $table->index(['employee_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sent_warning_letters');
    }
};
