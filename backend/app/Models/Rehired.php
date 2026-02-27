<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rehired extends Model
{
    protected $table = 'rehired';

    protected $fillable = [
        'employee_id',
        'previous_employee_id',
        'rehired_at',
        'source_type',
        'profile_snapshot',
        'profile_updated_at',
    ];

    protected $casts = [
        'rehired_at' => 'datetime',
        'profile_updated_at' => 'datetime',
        'profile_snapshot' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}

