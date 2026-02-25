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
        Schema::create('leave_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->string('employee_name');
            $table->string('department')->default('');
            $table->string('category');          // e.g. "Half-Day", "Whole-Day"
            $table->string('shift')->nullable();  // e.g. "AM", "PM" — only used for Half-Day
            $table->date('start_date');
            $table->date('leave_end_date');
            $table->decimal('number_of_days', 5, 1)->default(0);
            $table->string('approved_by');
            $table->string('remarks');            // leave type label
            $table->text('cite_reason')->nullable();
            $table->string('status')->default('Pending'); // Pending | Approved | Rejected
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_entries');
    }
};
