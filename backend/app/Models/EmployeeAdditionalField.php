<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeAdditionalField extends Model
{
    protected $fillable = [
        'field_label',
        'field_key',
        'field_type',
        'field_unit',
    ];
}
