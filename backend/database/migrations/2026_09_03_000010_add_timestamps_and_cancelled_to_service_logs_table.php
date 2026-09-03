<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Alter status column in MySQL to allow 'cancelled'
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE service_logs MODIFY COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'completed'");
        }

        // 2. Add transition timestamp columns if they do not exist
        Schema::table('service_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('service_logs', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('service_logs', 'in_progress_at')) {
                $table->timestamp('in_progress_at')->nullable()->after('scheduled_at');
            }
            if (!Schema::hasColumn('service_logs', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('in_progress_at');
            }
            if (!Schema::hasColumn('service_logs', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('service_logs', function (Blueprint $table) {
            if (Schema::hasColumn('service_logs', 'scheduled_at')) {
                $table->dropColumn(['scheduled_at', 'in_progress_at', 'completed_at', 'cancelled_at']);
            }
        });
    }
};
