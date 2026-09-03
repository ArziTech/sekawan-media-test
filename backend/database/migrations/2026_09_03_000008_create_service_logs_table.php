<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->date('service_date');
            $table->enum('service_type', ['routine', 'repair', 'overhaul'])->default('routine');
            $table->decimal('cost', 14, 2)->default(0);
            $table->string('workshop_name');
            $table->unsignedInteger('odometer_at_service');
            $table->date('next_service_date')->nullable();
            $table->unsignedInteger('next_service_odometer')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('completed');
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_logs');
    }
};
