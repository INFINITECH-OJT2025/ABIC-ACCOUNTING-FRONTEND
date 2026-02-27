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
        } = body

        if (!employee_name || !category || !start_date || !leave_end_date || !approved_by || !remarks) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            )
        }

        const result: any = await query(
            `INSERT INTO leave_entries
        (employee_id, employee_name, department, category, shift, start_date, leave_end_date,
         number_of_days, approved_by, remarks, cite_reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id || null,
                employee_name,
                department || '',
                category,
                shift || null,
                start_date,
                leave_end_date,
                number_of_days ?? 0,
                approved_by,
                remarks,
                cite_reason || '',
                approved_by, // Sync initial status with approved_by
            ]
        )

        return NextResponse.json(
            { success: true, message: 'Leave entry saved successfully', id: result.insertId },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Leave POST Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to save leave entry: ' + error.message },
            { status: 500 }
        )
    }
}

// PUT /api/admin-head/attendance/leave
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            id,
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
        } = body

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Missing record ID' },
                { status: 400 }
            )
        }

        const result: any = await query(
            `UPDATE leave_entries
             SET employee_id = ?, employee_name = ?, department = ?, category = ?, 
                 shift = ?, start_date = ?, leave_end_date = ?, number_of_days = ?, 
                 approved_by = ?, remarks = ?, cite_reason = ?, status = ?
             WHERE id = ?`,
            [
                employee_id || null,
                employee_name,
                department || '',
                category,
                shift || null,
                start_date,
                leave_end_date,
                number_of_days ?? 0,
                approved_by,
                remarks,
                cite_reason || '',
                approved_by, // Keep status in sync
                id
            ]
        )

        if (result && result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, message: 'No record found with ID: ' + id },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, message: 'Leave entry updated successfully' })
    } catch (error: any) {
        console.error('Leave PUT Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update leave entry: ' + error.message },
            { status: 500 }
        )
    }
}

// DELETE /api/admin-head/attendance/leave
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Missing record ID' },
                { status: 400 }
            )
        }

        await query('DELETE FROM leave_entries WHERE id = ?', [id])
        return NextResponse.json({ success: true, message: 'Leave entry deleted successfully' })
    } catch (error: any) {
        console.error('Leave DELETE Error:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete leave entry' },
            { status: 500 }
        )
    }
}
