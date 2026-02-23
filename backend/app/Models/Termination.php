<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Termination extends Model
{
    protected $fillable = [
        'employee_id',
        'termination_date',
        'rehired_at',
        'reason',
        'status',
        'notes',
    ];

    protected $casts = [
        'termination_date' => 'datetime',
        'rehired_at' => 'datetime',
    ];

    /**
     * Get the employee that was terminated.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
