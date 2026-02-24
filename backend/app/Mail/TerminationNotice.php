<?php

namespace App\Mail;

use App\Models\Employee;
use App\Models\Termination;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TerminationNotice extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Employee $employee,
        public Termination $termination
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Notice of Termination - ABIC Accounting',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.termination-notice',
            with: [
                'employee' => $this->employee,
                'termination' => $this->termination,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
