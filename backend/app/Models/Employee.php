<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        // Basic authentication
        'email',
        'password',
        'status',
        
        // Employee Details
        'position',
        'date_hired',
        
        // Personal Information
        'last_name',
        'first_name',
        'middle_name',
        'suffix',
        'birthday',
        'birthplace',
        'civil_status',
        'gender',
        
        // Government ID Numbers
        'sss_number',
        'philhealth_number',
        'pagibig_number',
        'tin_number',
        
        // Family Information
        'mlast_name',
        'mfirst_name',
        'mmiddle_name',
        'msuffix',
        'flast_name',
        'ffirst_name',
        'fmiddle_name',
        'fsuffix',
        
        // Contact Information
        'mobile_number',
        'house_number',
        'street',
        'village',
        'subdivision',
        'barangay',
        'region',
        'province',
        'city_municipality',
        'zip_code',
        'email_address',
    ];

    protected $hidden = [
        'password',
    ];
}

