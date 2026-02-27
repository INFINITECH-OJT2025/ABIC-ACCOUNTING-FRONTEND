<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_shift_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('department');           // e.g. "Accounting"
            $table->string('schedule_label');       // e.g. "8:00 AM – 12:00 PM / 1:00 PM – 4:00 PM"
            $table->json('shift_options');          // e.g. ["8:00 AM – 12:00 PM", "1:00 PM – 4:00 PM"]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_shift_schedules');
    }
};
