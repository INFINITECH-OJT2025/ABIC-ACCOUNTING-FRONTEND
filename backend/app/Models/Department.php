<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = ['name', 'is_custom'];
    protected $hidden = [];
    public $timestamps = true;

    public function checklistTemplates(): HasMany
    {
        return $this->hasMany(DepartmentChecklistTemplate::class);
    }
}
