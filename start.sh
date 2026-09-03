#!/usr/bin/env bash
set -e

echo "=== MEMULAI APLIKASI NICKEL FLEET MONITORING ==="
echo ""

if [ "$1" == "docker" ]; then
    echo "[*] Menjalankan via Docker Compose..."
    docker compose up -d --build
    echo ""
    echo "Aplikasi siap diakses melalui Caddy Reverse Proxy di: https://link-app.gunawan05.pro (atau http://localhost:8000)"
    exit 0
fi

echo "Pilihan cara menjalankan aplikasi:"
echo "1. Jalankan via Docker Compose: ./start.sh docker"
echo "2. Jalankan Standalone: cd backend && php artisan serve (Terminal 1) dan cd frontend && npm run dev (Terminal 2)"
echo ""
echo "Dokumentasi lengkap dan daftar akun tersedia pada README.md"
