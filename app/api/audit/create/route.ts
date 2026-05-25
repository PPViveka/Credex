import { NextRequest, NextResponse } from 'next/server';
import { createAudit } from '../../../../lib/db';
import { AuditInput } from '../../../../lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AuditInput;
    
    // Basic server-side validation
    if (!body.teamSize || body.teamSize < 1) {
      return NextResponse.json(
        { message: 'Invalid team size. Must be at least 1.' },
        { status: 400 }
      );
    }
    
    if (!body.tools || body.tools.length === 0) {
      return NextResponse.json(
        { message: 'Please select at least one active AI tool.' },
        { status: 400 }
      );
    }

    // Process using our DB wrapper (stores calculations inside the database)
    const auditId = await createAudit(body);

    return NextResponse.json({ auditId });
  } catch (error: any) {
    console.error('Error creating spend audit:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred while calculating the spend audit.' },
      { status: 500 }
    );
  }
}
