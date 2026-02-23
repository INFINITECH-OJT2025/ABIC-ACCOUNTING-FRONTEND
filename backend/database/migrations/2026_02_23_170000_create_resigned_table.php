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
        Schema::create('resigned', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->dateTime('resignation_date');
            $table->dateTime('rehired_at')->nullable();
            $table->text('reason');
            $table->string('status')->default('completed')->comment('Status: pending, completed, cancelled');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resigned');
    }
};
