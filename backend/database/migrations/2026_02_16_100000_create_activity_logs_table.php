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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            
            // Activity classification
            $table->string('activity_type')->comment('Type: employee, department, position, attendance, system, auth');
            $table->string('action')->comment('Action: created, updated, deleted, onboarded, terminated, login, etc.');
            $table->string('status')->comment('Status: success, warning, error, info');
            
            // Activity details
            $table->string('title');
            $table->text('description');
            
            // User who performed the action
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            
            // Target resource
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_type')->nullable()->comment('Employee, Department, Position, etc.');
            
            // Additional data
            $table->json('metadata')->nullable()->comment('Additional data like old/new values');
            
            // Request information
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes for better query performance
            $table->index('activity_type');
            $table->index('action');
            $table->index('status');
            $table->index('user_id');
            $table->index('target_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
