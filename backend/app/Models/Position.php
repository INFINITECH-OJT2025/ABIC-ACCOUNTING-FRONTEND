<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $fillable = ['name', 'is_custom', 'department_id'];
    protected $hidden = [];
    public $timestamps = true;

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
