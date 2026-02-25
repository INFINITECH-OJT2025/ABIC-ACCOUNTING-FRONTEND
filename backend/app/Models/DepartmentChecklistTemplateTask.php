<?php
//DepartmentChecklistTemplateTask.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentChecklistTemplateTask extends Model
{
    protected $fillable = [
        'template_id',
        'task',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(DepartmentChecklistTemplate::class, 'template_id');
    }
}