<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WarningLetterMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $employeeName;
    public string $letterType;
    public string $pdfContent;   // raw PDF binary
    public string $mailSubject;  // renamed to avoid Mailable::$subject conflict
    public string $bodyHtml;

    public function __construct(
        string $employeeName,
        string $letterType,
        string $pdfContent,
        string $mailSubject,
        string $bodyHtml,
    ) {
        $this->employeeName = $employeeName;
        $this->letterType   = $letterType;
        $this->pdfContent   = $pdfContent;
        $this->mailSubject  = $mailSubject;
        $this->bodyHtml     = $bodyHtml;
    }

    public function build(): static
    {
        $filename = 'Warning_Letter_' . str_replace(' ', '_', $this->employeeName) . '.pdf';

        return $this
            ->subject($this->mailSubject)
            ->html($this->bodyHtml)
            ->attachData($this->pdfContent, $filename, [
                'mime' => 'application/pdf',
            ]);
    }
}
