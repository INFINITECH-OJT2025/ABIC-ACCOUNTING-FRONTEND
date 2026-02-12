<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $fillable = ['name', 'is_custom'];
    protected $hidden = [];
    public $timestamps = true;
}
