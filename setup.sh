#!/usr/bin/env bash

# ABIC Accounting System - Complete Setup Script

echo "========================================"
echo "ABIC Accounting System - Setup"
echo "========================================"
echo ""

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP 8.2 or higher."
    exit 1
fi

echo "✅ PHP is installed"

# Check if Composer is installed
if ! command -v composer &> /dev/null; then
    echo "❌ Composer is not installed. Please install Composer."
    exit 1
fi

echo "✅ Composer is installed"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js."
    exit 1
fi

echo "✅ Node.js is installed"

echo ""
echo "Starting setup..."
echo ""

# Setup Frontend
echo "📦 Setting up Frontend (Next.js)..."
cd backend
if [ -d "node_modules" ]; then
    echo "   Dependencies already installed"
else
    npm install
fi

echo "✅ Frontend setup complete"
echo ""

# Setup Backend
echo "📦 Setting up Backend (Laravel)..."
cd ../backend
if [ -d "vendor" ]; then
    echo "   Dependencies already installed"
else
    composer install
fi

# Generate APP_KEY if not set
if ! grep -q "APP_KEY=base64:" .env; then
    echo "   Generating application key..."
    php artisan key:generate --force
fi

echo "✅ Backend setup complete"
echo ""

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start Laravel Backend:"
echo "   cd backend"
echo "   php artisan migrate"
echo "   php artisan serve"
echo ""
echo "2. In a new terminal, start Next.js Frontend:"
echo "   npm run serve"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
