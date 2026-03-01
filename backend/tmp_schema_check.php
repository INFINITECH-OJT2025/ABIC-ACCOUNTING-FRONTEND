<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
print_r(Illuminate\Support\Facades\DB::select('SHOW CREATE TABLE leave_entries'));
