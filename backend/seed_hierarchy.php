<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Department;
use App\Models\Position;
use App\Models\Hierarchy;

Hierarchy::truncate();

$deps = Department::all()->keyBy('name');
$pos = Position::all()->keyBy('name');

$structure = [
    'ACCOUNTING DEPARTMENT' => [
        'Accounting Supervisor' => [
            'Accounting Assistant' => []
        ]
    ],
    'ADMIN DEPARTMENT' => [
        'Admin Head' => [
            'Admin Assistant' => []
        ]
    ],
    'IT DEPARTMENT' => [
        'Junior IT Manager' => [
            'IT Supervisor' => [
                'Senior Web Developer' => [
                    'Junior Web Developer' => []
                ]
            ]
        ]
    ],
    'SALES DEPARTMENT' => [
        'Sales Supervisor' => [
            'Senior Property Specialist' => [
                'Property Specialist' => []
            ]
        ]
    ],
    'MARKETING DEPARTMENT' => [
    ],
    'STUDIO DEPARTMENT' => [
        'Studio Manager' => [
            'Assistant Studio Manager' => [],
            'Marketing Staff' => []
        ]
    ],
    'MULTIMEDIA DEPARTMENT' => [
        'Multimedia Manager' => []
    ]
];

function seedLevel($level, $parentId, $deptId, $pos)
{
    foreach ($level as $posName => $children) {
        $p = $pos[$posName] ?? null;
        if (!$p) {
            echo "Skip " . $posName . "\n";
            continue;
        }
        $h = \App\Models\Hierarchy::create([
            'position_id' => $p->id,
            'department_id' => $deptId,
            'parent_id' => $parentId,
            'role' => $posName
        ]);
        seedLevel($children, $h->id, $deptId, $pos);
    }
}

foreach ($structure as $deptName => $level) {
    $d = $deps[$deptName] ?? null;
    if ($d) {
        seedLevel($level, null, $d->id, $pos);
    } else {
        echo "Skip Dept " . $deptName . "\n";
    }
}
echo "Success\n";
