<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agencies', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // philhealth, sss, pagibig, tin
            $table->string('name');
            $table->string('full_name')->nullable();
            $table->text('summary')->nullable();
            $table->text('image_url')->nullable();
            $table->string('image_public_id')->nullable(); // cloudinary public_id
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agencies');
    }
};
