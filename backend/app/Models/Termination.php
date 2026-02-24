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
        'recommended_by',
        'notice_mode',
        'notice_date',
        'reviewed_by',
        'approved_by',
        'approval_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'termination_date' => 'datetime',
        'rehired_at' => 'datetime',
        'notice_date' => 'datetime',
        'approval_date' => 'datetime',
    ];

    /**
     * Get the employee that was terminated.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
