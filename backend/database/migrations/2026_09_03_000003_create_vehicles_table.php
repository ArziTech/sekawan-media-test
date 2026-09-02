<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('license_plate')->unique();
            $table->enum('type', ['passenger', 'cargo']); // angkutan orang vs angkutan barang
            $table->enum('ownership_type', ['owned', 'rented']); // milik perusahaan vs sewa
            $table->foreignId('rental_company_id')->nullable()->constrained('rental_companies')->nullOnDelete();
            $table->foreignId('region_id')->constrained('regions')->cascadeOnDelete();
            $table->enum('status', ['available', 'in_use', 'in_service'])->default('available');
            $table->string('fuel_type')->default('Solar Dexlite');
            $table->unsignedInteger('current_odometer')->default(0);
            $table->date('last_service_date')->nullable();
            $table->date('next_service_date')->nullable();
            $table->unsignedInteger('next_service_odometer')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
