<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['name', 'is_custom'];
    protected $hidden = [];
    public $timestamps = true;
}
