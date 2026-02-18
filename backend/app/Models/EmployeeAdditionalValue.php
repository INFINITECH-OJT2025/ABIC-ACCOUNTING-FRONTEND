<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAdditionalValue extends Model
{
    protected $fillable = [
        'employee_id',
        'field_id',
        'value',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function field()
    {
        return $this->belongsTo(EmployeeAdditionalField::class, 'field_id');
    }
}
