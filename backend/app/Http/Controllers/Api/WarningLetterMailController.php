<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\WarningLetterMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class WarningLetterMailController extends Controller
{
    /**
     * POST /api/warning-letter/send-email
     *
     * Expected JSON body:
     * {
     *   "recipients":    ["email1@gmail.com"],
     *   "employee_name": "Jay Joy",
     *   "letter_type":   "late",          // 'late' | 'leave'
     *   "pdf_base64":    "<base64 string>" // PDF generated client-side
     * }
     */
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'recipients'    => 'required|array|min:1',
            'recipients.*'  => 'required|email',
            'employee_name' => 'required|string',
            'letter_type'   => 'required|in:late,leave',
            'pdf_base64'    => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $recipients   = $request->input('recipients');
        $employeeName = $request->input('employee_name');
        $letterType   = $request->input('letter_type');
        $pdfBase64    = $request->input('pdf_base64');

        // Decode the base64 PDF
        $pdfContent = base64_decode($pdfBase64);
        if ($pdfContent === false || strlen($pdfContent) < 100) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PDF data received.',
            ], 422);
        }

        $typeLabel = $letterType === 'late' ? 'Tardiness' : 'Extended Leave';
        $subject   = "Warning Letter – {$employeeName} ({$typeLabel})";
        $emailBody = $this->buildEmailBody($employeeName, $typeLabel);

        $errors = [];
        foreach ($recipients as $to) {
            try {
                Mail::to($to)->send(
                    new WarningLetterMail($employeeName, $letterType, $pdfContent, $subject, $emailBody)
                );
            } catch (\Exception $e) {
                $errors[$to] = $e->getMessage();
            }
        }

        if (!empty($errors)) {
            $firstError = array_values($errors)[0];
            return response()->json([
                'success' => false,
                'message' => 'Email delivery failed: ' . $firstError,
                'errors'  => $errors,
            ], 500);
        }

        return response()->json([
            'success'    => true,
            'message'    => 'Warning letter sent to: ' . implode(', ', $recipients),
            'recipients' => $recipients,
        ]);
    }

    /**
     * Builds a clean, branded HTML shell used as the email body.
     */
    private function buildEmailBody(string $employeeName, string $typeLabel): string
    {
        $fromName = config('mail.from.name', 'ABIC Admin Supervisor/HR');
        $year     = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body{margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#333;}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.10);}
    .hdr{background:linear-gradient(135deg,#A4163A 0%,#7B0F2B 100%);padding:36px 40px 28px;}
    .hdr h1{color:#fff;font-size:20px;margin:0 0 6px;letter-spacing:.5px;}
    .hdr p{color:rgba(255,255,255,.78);font-size:13px;margin:0;}
    .body{padding:36px 40px;}
    .body p{font-size:14px;line-height:1.75;margin:0 0 16px;}
    .pill{display:inline-block;background:#fff5f7;border:1px solid #f0b3c0;color:#A4163A;
          font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;margin:12px 0;}
    .attach-box{background:#f0f4ff;border:1px solid #c7d3ff;border-radius:8px;
                padding:14px 18px;margin:20px 0;display:flex;align-items:flex-start;gap:14px;}
    .attach-box .ico{font-size:26px;line-height:1;}
    .attach-box p{margin:0;font-size:13px;color:#3b4cca;line-height:1.5;}
    .ftr{background:#f9f9f9;border-top:1px solid #eee;padding:18px 40px;
         font-size:12px;color:#aaa;text-align:center;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>Warning Letter Notification</h1>
      <p>ABIC Realty &amp; Consultancy Corp.</p>
    </div>
    <div class="body">
      <p>Good day,</p>
      <p>Please find attached the official <strong>{$typeLabel} Warning Letter</strong> issued to:</p>
      <div class="pill">&#128203;&nbsp;&nbsp;{$employeeName}</div>
      <div class="attach-box">
        <div class="ico">&#128206;</div>
        <p>The warning letter is attached as a <strong>PDF</strong> to this email.<br/>
           Please review it and complete the acknowledgment section as directed.</p>
      </div>
      <p>If you have any questions about this letter, please contact the HR&nbsp;/&nbsp;Admin Department at your earliest convenience.</p>
      <p style="margin-top:24px;">Respectfully,<br/>
        <strong>{$fromName}</strong><br/>
        ABIC Realty &amp; Consultancy Corp.</p>
    </div>
    <div class="ftr">
      &copy; {$year} ABIC Realty &amp; Consultancy Corp. &mdash; Automated notification. Do not reply.
    </div>
  </div>
</body>
</html>
HTML;
    }
}
