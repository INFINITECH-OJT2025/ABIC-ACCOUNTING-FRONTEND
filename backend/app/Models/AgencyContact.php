<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class AgencyContact extends Model
{
    protected $fillable = [
        'agency_id',
        'type',
        'label',
        'value',
        'sort_order',
    ];

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }
}
