<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnboardingChecklist extends Model
{
        protected $fillable = [
            'employee_name',
            'position',
            'department',
            'start_date',
            'tasks',
            'status'
        ];

        protected $casts = [
            'start_date' => 'date',
            'tasks' => 'array',
        ];
}
