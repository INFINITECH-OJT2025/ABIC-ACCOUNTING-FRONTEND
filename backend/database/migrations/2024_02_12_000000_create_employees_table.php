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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            
            // Basic authentication
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Employee Details
            $table->string('position')->nullable();
            $table->date('date_hired')->nullable();
            
            // Personal Information
            $table->string('last_name')->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('suffix')->nullable();
            $table->date('birthday')->nullable();
            $table->string('birthplace')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('gender')->nullable();
            
            // Government ID Numbers
            $table->string('sss_number')->nullable();
            $table->string('philhealth_number')->nullable();
            $table->string('pagibig_number')->nullable();
            $table->string('tin_number')->nullable();
            
            // Family Information
            $table->string('mothers_maiden_name')->nullable();
            $table->string('mlast_name')->nullable();
            $table->string('mfirst_name')->nullable();
            $table->string('mmiddle_name')->nullable();
            $table->string('msuffix')->nullable();
            $table->string('fathers_name')->nullable();
            $table->string('flast_name')->nullable();
            $table->string('ffirst_name')->nullable();
            $table->string('fmiddle_name')->nullable();
            $table->string('fsuffix')->nullable();
            
            // Contact Information
            $table->string('mobile_number')->nullable();
            $table->string('house_number')->nullable();
            $table->string('street')->nullable();
            $table->string('village')->nullable();
            $table->string('subdivision')->nullable();
            $table->string('barangay')->nullable();
            $table->string('region')->nullable();
            $table->string('province')->nullable();
            $table->string('city_municipality')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('email_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
