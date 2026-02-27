<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resigned extends Model
{
    protected $table = 'resigned';

    protected $fillable = [
        'employee_id',
        'resignation_date',
        'rehired_at',
        'reason',
        'status',
        'notes',
    ];

    protected $casts = [
        'resignation_date' => 'datetime',
        'rehired_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
