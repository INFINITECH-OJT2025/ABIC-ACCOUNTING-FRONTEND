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
        if (Schema::hasTable('rehired')) {
            return;
        }

        Schema::create('rehired', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->string('previous_employee_id')->nullable();
            $table->dateTime('rehired_at');
            $table->string('source_type')->nullable()->comment('terminated|resigned');
            $table->json('profile_snapshot')->nullable();
            $table->dateTime('profile_updated_at')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->index('rehired_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rehired');
    }
};

