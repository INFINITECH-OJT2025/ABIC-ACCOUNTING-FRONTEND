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
        Schema::table('sent_warning_letters', function (Blueprint $table) {
            $table->longText('form1_body')->nullable()->after('forms_included');
            $table->longText('form2_body')->nullable()->after('form1_body');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sent_warning_letters', function (Blueprint $table) {
            $table->dropColumn(['form1_body', 'form2_body']);
        });
    }
};
