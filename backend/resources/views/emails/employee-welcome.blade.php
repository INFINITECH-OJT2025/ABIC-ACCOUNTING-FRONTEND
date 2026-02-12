<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #1e40af;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: white;
            padding: 20px;
            border: 1px solid #ddd;
        }
        .credentials {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #1e40af;
        }
        .credentials p {
            margin: 10px 0;
        }
        .label {
            font-weight: bold;
            color: #1e40af;
        }
        .password-box {
            background-color: #fff3cd;
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 14px;
            word-break: break-all;
        }
        .button {
            display: inline-block;
            background-color: #1e40af;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
        .footer {
            background-color: #f0f0f0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ABIC Accounting System</h1>
        </div>

        <div class="content">
            <p>Dear <strong>{{ $employee->first_name }} {{ $employee->last_name }}</strong>,</p>

            <p>Your account has been successfully created in the ABIC Accounting System. Below are your login credentials:</p>

            <div class="credentials">
                <p><span class="label">Email:</span> {{ $employee->email }}</p>
                <p><span class="label">Temporary Password:</span></p>
                <div class="password-box">
                    {{ $password }}
                </div>
            </div>

            <p style="color: #d32f2f; font-weight: bold;">⚠️ Important Security Notice:</p>
            <ul>
                <li>This is a temporary password. <strong>Change it immediately</strong> after your first login.</li>
                <li>Do not share this password with anyone.</li>
                <li>Keep your credentials confidential.</li>
            </ul>

            <p>To change your password and complete your account setup, click the button below:</p>

            <center>
                <a href="{{ env('FRONTEND_URL') }}/employee/change_password?token={{ urlencode($employee->email) }}" class="button">
                    Change Your Password
                </a>
            </center>

            <p>Once you've changed your password, you can login to your dashboard:</p>
            
            <center>
                <a href="{{ env('FRONTEND_URL') }}/employee/login" class="button" style="background-color: #4caf50;">
                    Go to Login Page
                </a>
            </center>

            <p>If you didn't create this account or have any questions, please contact the HR department immediately.</p>

            <p>Best regards,<br>
            <strong>ABIC Accounting System</strong></p>
        </div>

        <div class="footer">
            <p>&copy; 2026 ABIC Accounting System. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
