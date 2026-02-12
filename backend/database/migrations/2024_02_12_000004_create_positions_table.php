<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_custom')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        // Insert default positions
        $defaultPositions = [
            'Executive Assistant',
            'Admin Assistant',
            'Admin Head',
            'Accounting Supervisor',
            'Accounting Assistant',
            'Property Specialist',
            'Senior Property Specialist',
            'Junior Web Developer',
            'Senior Web Developer',
            'IT Supervisor',
            'Sales Supervisor',
            'Junior IT Manager',
            'Senior IT Manager',
            'Marketing Staff',
            'Assistant Studio Manager',
            'Studio Manager',
            'Multimedia Manager'
        ];

        foreach ($defaultPositions as $position) {
            DB::table('positions')->insert([
                'name' => $position,
                'is_custom' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
