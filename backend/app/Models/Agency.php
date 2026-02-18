<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Agency extends Model
{
    protected $fillable = [
        'code',
        'name',
        'full_name',
        'summary',
        'image_url',
        'image_public_id',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(AgencyContact::class)->orderBy('sort_order')->orderBy('id');
    }

    public function processes(): HasMany
    {
        return $this->hasMany(GovernmentContributionsProcess::class)->orderBy('step_number')->orderBy('id');
    }
}
