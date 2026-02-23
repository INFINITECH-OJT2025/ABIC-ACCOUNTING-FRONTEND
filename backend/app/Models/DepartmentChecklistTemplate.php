<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepartmentChecklistTemplate extends Model
{
    protected $fillable = [
        'department_id',
        'checklist_type',
        'updated_by',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(DepartmentChecklistTemplateTask::class, 'template_id')->orderBy('sort_order');
    }
}
