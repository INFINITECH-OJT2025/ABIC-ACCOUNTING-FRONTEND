<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GovernmentContributionsProcess extends Model
{
    protected $fillable = [
        'contribution_type',
        'process_type',
        'process',
        'step_number'
    ];
}
