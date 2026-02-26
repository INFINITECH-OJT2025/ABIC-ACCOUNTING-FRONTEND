<?php

namespace Database\Seeders;

use App\Models\DepartmentShiftSchedule;
use Illuminate\Database\Seeder;

class DepartmentShiftScheduleSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data to allow re-seeding
        DepartmentShiftSchedule::truncate();

        $schedules = [
            // Group 1: 8am–12pm / 1pm–4pm
            [
                'departments'    => ['Accounting', 'Sales', 'Admin'],
                'schedule_label' => 'ABIC (8:00 AM – 12:00 PM / 1:00 PM – 4:00 PM)',
                'shift_options'  => ['8:00 AM – 12:00 PM', '1:00 PM – 4:00 PM'],
            ],
            // Group 2: 10am–2pm / 3pm–7pm
            [
                'departments'    => ['Multimedia', 'Marketing', 'Studio'],
                'schedule_label' => 'Multimedia (10:00 AM – 2:00 PM / 3:00 PM – 7:00 PM)',
                'shift_options'  => ['10:00 AM – 2:00 PM', '3:00 PM – 7:00 PM'],
            ],
            // Group 3: 9am–1pm / 2pm–6pm
            [
                'departments'    => ['IT'],
                'schedule_label' => 'Infinitech (9:00 AM – 1:00 PM / 2:00 PM – 6:00 PM)',
                'shift_options'  => ['9:00 AM – 1:00 PM', '2:00 PM – 6:00 PM'],
            ],
        ];

        foreach ($schedules as $group) {
            foreach ($group['departments'] as $dept) {
                DepartmentShiftSchedule::create([
                    'department'     => $dept,
                    'schedule_label' => $group['schedule_label'],
                    'shift_options'  => $group['shift_options'],
                ]);
            }
        }
    }
}
