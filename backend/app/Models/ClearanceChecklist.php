<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClearanceChecklist extends Model
{
    protected $fillable = [
        'employee_name',
        'position',
        'department',
        'start_date',
        'resignation_date',
        'last_day',
        'tasks',
        'status'
    ];
}
