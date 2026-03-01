<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficeShiftSchedule extends Model
{
    protected $table = 'office_shift_schedules';

    protected $fillable = [
        'office_name',
        'shift_options',
    ];

    protected $casts = [
        'shift_options' => 'array',
    ];
}
