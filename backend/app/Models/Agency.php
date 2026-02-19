<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agency extends Model
{
    protected $guarded = [];

    public function contacts(): HasMany
    {
        return $this->hasMany(AgencyContact::class)->orderBy('sort_order');
    }

    public function processes(): HasMany
    {
        return $this->hasMany(AgencyProcess::class)->orderBy('step_number');
    }
}
