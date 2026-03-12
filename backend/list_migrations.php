<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$migrations = DB::table('migrations')->get();
foreach ($migrations as $m) {
    echo $m->migration . " (" . $m->batch . ")" . PHP_EOL;
}
