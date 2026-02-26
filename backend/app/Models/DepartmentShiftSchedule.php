<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentShiftSchedule extends Model
{
    protected $fillable = [
        'department',
        'schedule_label',
        'shift_options',
    ];

    protected $casts = [
        'shift_options' => 'array',
    ];
}
