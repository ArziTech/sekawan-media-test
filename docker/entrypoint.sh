#!/bin/sh
set -e

echo "=== Memulai Aplikasi Nickel Fleet Monitoring ==="

# Wait for MySQL database if DB_HOST is configured
if [ -n "$DB_HOST" ]; then
    echo "[*] Menunggu koneksi basis data di $DB_HOST:${DB_PORT:-3306}..."
    until php -r "
        try {
            \$pdo = new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: 3306) . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'), [PDO::ATTR_TIMEOUT => 3]);
            echo \"Basis data terhubung.\n\";
            exit(0);
        } catch (Throwable \$e) {
            exit(1);
        }
    " 2>/dev/null; do
        echo "[*] Basis data belum siap, mencoba kembali dalam 2 detik..."
        sleep 2
    done
fi

echo "[*] Menyiapkan storage symlink..."
php artisan storage:link --quiet || true

echo "[*] Memeriksa migrasi basis data..."
USER_COUNT=$(php -r "
    try {
        require __DIR__.'/vendor/autoload.php';
        \$app = require_once __DIR__.'/bootstrap/app.php';
        \$kernel = \$app->make(Illuminate\Contracts\Console\Kernel::class);
        \$kernel->bootstrap();
        echo \App\Models\User::count();
    } catch (Throwable \$e) {
        echo -1;
    }
" 2>/dev/null || echo -1)

if [ "$USER_COUNT" = "0" ] || [ "$USER_COUNT" = "-1" ]; then
    echo "[*] Database kosong/baru. Menjalankan fresh migration dan seeder..."
    php artisan migrate:fresh --force --seed
else
    echo "[*] Database sudah terinisialisasi. Menjalankan migrasi update..."
    php artisan migrate --force
fi

echo "[*] Mengoptimalkan cache konfigurasi dan route Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[*] Aplikasi berjalan pada http://0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
