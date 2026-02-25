import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/admin-head/attendance/leave
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')
        const year = searchParams.get('year')

        let sql = 'SELECT * FROM leave_entries ORDER BY start_date DESC, created_at DESC'
        let params: any[] = []

        if (month && year) {
            sql = `SELECT * FROM leave_entries WHERE MONTH(start_date) = ? AND YEAR(start_date) = ? ORDER BY start_date DESC`
            params = [parseInt(month), parseInt(year)]
        }

        const results = await query(sql, params)
        return NextResponse.json({ success: true, data: results })
    } catch (error: any) {
        console.error('Leave GET Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch leave entries' },
            { status: 500 }
        )
    }
}

// POST /api/admin-head/attendance/leave
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            employee_id,
            employee_name,
            department,
            category,
            shift,
            start_date,
            leave_end_date,
            number_of_days,
            approved_by,
            remarks,
            cite_reason,
            status,
        } = body

        if (!employee_name || !category || !start_date || !leave_end_date || !approved_by || !remarks) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            )
        }

        const result = await query(
            `INSERT INTO leave_entries
        (employee_id, employee_name, department, category, shift, start_date, leave_end_date,
         number_of_days, approved_by, remarks, cite_reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id ?? null,
                employee_name,
                department ?? '',
                category,
                shift ?? null,
                start_date,
                leave_end_date,
                number_of_days ?? 0,
                approved_by,
                remarks,
                cite_reason ?? '',
                status ?? 'Pending',
            ]
        )

        return NextResponse.json(
            { success: true, message: 'Leave entry saved successfully', data: result },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Leave POST Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to save leave entry' },
            { status: 500 }
        )
    }
}
