<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    // Use guarded instead of fillable so dynamically-added additional info
    // columns are automatically accepted without needing to update this file.
    protected $guarded = ['id'];

    protected $hidden = [
        'password',
    ];
}
