<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SentWarningLetter extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'employee_name',
        'type',           // 'late' or 'leave'
        'warning_level',
        'month',
        'year',
        'cutoff',
        'recipients',     // JSON array of email addresses
        'forms_included', // JSON array e.g. ['form1','form2']
        'form1_body',
        'form2_body',
        'sent_at',
    ];

    protected $casts = [
        'recipients'     => 'array',
        'forms_included' => 'array',
        'sent_at'        => 'datetime',
    ];
}
