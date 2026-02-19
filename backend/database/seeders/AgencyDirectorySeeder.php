<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Agency;

class AgencyDirectorySeeder extends Seeder
{
    public function run(): void
    {
        // Check if agencies exist
        if (Agency::count() > 0) {
            return;
        }

        $agencies = [
            [
                'code' => 'sss',
                'name' => 'SSS',
                'full_name' => 'Social Security System',
                'summary' => 'The Social Security System (SSS) is a state-run, social insurance program in the Philippines to workers in the private, professional and informal sectors.',
            ],
            [
                'code' => 'philhealth',
                'name' => 'PhilHealth',
                'full_name' => 'Philippine Health Insurance Corporation',
                'summary' => 'PhilHealth was created to implement universal health coverage in the Philippines.',
            ],
            [
                'code' => 'pagibig',
                'name' => 'Pag-IBIG',
                'full_name' => 'Home Development Mutual Fund',
                'summary' => 'The Home Development Mutual Fund, commonly known as the Pag-IBIG Fund, is a government-owned and controlled corporation under the Department of Human Settlements and Urban Development.',
            ],
            [
                'code' => 'tin',
                'name' => 'TIN (BIR)',
                'full_name' => 'Bureau of Internal Revenue',
                'summary' => 'The Bureau of Internal Revenue (BIR) is the primary agency in the Philippines responsible for the collection of internal revenue taxes.',
            ],
        ];

        foreach ($agencies as $agency) {
            Agency::create($agency);
        }
    }
}
