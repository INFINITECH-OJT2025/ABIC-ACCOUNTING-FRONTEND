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
        Schema::table('terminations', function (Blueprint $table) {
            $table->string('recommended_by')->nullable()->after('reason');
            $table->string('notice_mode')->nullable()->after('recommended_by');
            $table->dateTime('notice_date')->nullable()->after('notice_mode');
            $table->string('reviewed_by')->nullable()->after('notice_date');
            $table->string('approved_by')->nullable()->after('reviewed_by');
            $table->dateTime('approval_date')->nullable()->after('approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('terminations', function (Blueprint $table) {
            $table->dropColumn([
                'recommended_by',
                'notice_mode',
                'notice_date',
                'reviewed_by',
                'approved_by',
                'approval_date',
            ]);
        });
    }
};
