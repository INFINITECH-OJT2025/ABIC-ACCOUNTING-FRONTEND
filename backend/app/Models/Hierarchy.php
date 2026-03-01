<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hierarchy extends Model
{
    protected $fillable = ['position_id', 'department_id', 'parent_id', 'role'];

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function parent()
    {
        return $this->belongsTo(Hierarchy::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Hierarchy::class, 'parent_id');
    }
}
