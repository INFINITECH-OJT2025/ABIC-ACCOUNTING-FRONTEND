<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('general_contacts')) {
            return;
        }

        Schema::table('general_contacts', function (Blueprint $table): void {
            if (!Schema::hasColumn('general_contacts', 'establishment_name')) {
                $table->string('establishment_name')->nullable()->after('type');
            }
            if (!Schema::hasColumn('general_contacts', 'services')) {
                $table->string('services')->nullable()->after('establishment_name');
            }
            if (!Schema::hasColumn('general_contacts', 'contact_person')) {
                $table->string('contact_person')->nullable()->after('services');
            }
        });

        DB::table('general_contacts')
            ->whereNull('establishment_name')
            ->update([
                'establishment_name' => DB::raw("COALESCE(NULLIF(`label`, ''), NULLIF(`type`, ''), 'General Contact')"),
            ]);

    }

    public function down(): void
    {
        if (!Schema::hasTable('general_contacts')) {
            return;
        }

        Schema::table('general_contacts', function (Blueprint $table): void {
            if (Schema::hasColumn('general_contacts', 'contact_person')) {
                $table->dropColumn('contact_person');
            }
            if (Schema::hasColumn('general_contacts', 'services')) {
                $table->dropColumn('services');
            }
            if (Schema::hasColumn('general_contacts', 'establishment_name')) {
                $table->dropColumn('establishment_name');
            }
        });
    }
};
