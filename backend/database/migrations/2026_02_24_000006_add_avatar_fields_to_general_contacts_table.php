<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('general_contacts')) {
            return;
        }

        Schema::table('general_contacts', function (Blueprint $table): void {
            if (!Schema::hasColumn('general_contacts', 'avatar_url')) {
                $table->text('avatar_url')->nullable()->after('value');
            }
            if (!Schema::hasColumn('general_contacts', 'avatar_public_id')) {
                $table->string('avatar_public_id')->nullable()->after('avatar_url');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('general_contacts')) {
            return;
        }

        Schema::table('general_contacts', function (Blueprint $table): void {
            if (Schema::hasColumn('general_contacts', 'avatar_public_id')) {
                $table->dropColumn('avatar_public_id');
            }
            if (Schema::hasColumn('general_contacts', 'avatar_url')) {
                $table->dropColumn('avatar_url');
            }
        });
    }
};

