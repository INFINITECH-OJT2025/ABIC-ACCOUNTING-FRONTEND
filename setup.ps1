# ABIC Accounting System - Complete Setup Script for Windows

Write-Host "======================================" -ForegroundColor Green
Write-Host "ABIC Accounting System - Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if PHP is installed
try {
    php --version | Out-Null
    Write-Host "✅ PHP is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ PHP is not installed. Please install PHP 8.2 or higher." -ForegroundColor Red
    exit 1
}

# Check if Composer is installed
try {
    composer --version 2>$null | Out-Null
    Write-Host "✅ Composer is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Composer is not installed. Please install Composer." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
    Write-Host "✅ Node.js is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting setup..." -ForegroundColor Cyan
Write-Host ""

# Setup Frontend
Write-Host "📦 Setting up Frontend (Next.js)..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "   Dependencies already installed"
} else {
    npm install
}
Write-Host "✅ Frontend setup complete" -ForegroundColor Green
Write-Host ""

# Setup Backend
Write-Host "📦 Setting up Backend (Laravel)..." -ForegroundColor Cyan
Set-Location "backend"
if (Test-Path "vendor") {
    Write-Host "   Dependencies already installed"
} else {
    composer install
}

# Generate APP_KEY if not set
$envContent = Get-Content .env
if (-not ($envContent -match "APP_KEY=base64:")) {
    Write-Host "   Generating application key..." -ForegroundColor Yellow
    php artisan key:generate --force
}

Write-Host "✅ Backend setup complete" -ForegroundColor Green
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Laravel Backend:"
Write-Host "   cd backend"
Write-Host "   php artisan migrate"
Write-Host "   php artisan serve" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. In a new terminal, start Next.js Frontend:"
Write-Host "   npm run serve" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor Yellow
Write-Host ""
