import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Apar from '@/models/APAR';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const apar = await Apar.findById(params.id)
      .populate('employee', 'name email department position')
      .populate('userId', 'name email department position')
      .populate('reviewer', 'name email position');

    if (!apar) {
      return NextResponse.json(
        {
          success: false,
          error: 'APAR not found',
        },
        { status: 404 }
      );
    }

    // Transform data to ensure consistent shapes - convert unpopulated refs to null
    const aparObj = apar.toObject();
    
    // Ensure employee is either a populated object or null
    if (!aparObj.employee || typeof aparObj.employee === 'string' || aparObj.employee._id === undefined) {
      console.warn(`APAR ${params.id} has missing or unpopulated employee data. Employee ID: ${aparObj.employee}`);
      aparObj.employee = null;
    }
    
    // Ensure userId is either a populated object or null
    if (aparObj.userId && (typeof aparObj.userId === 'string' || aparObj.userId._id === undefined)) {
      aparObj.userId = null;
    }
    
    // Ensure reviewer is either a populated object or null
    if (aparObj.reviewer && (typeof aparObj.reviewer === 'string' || aparObj.reviewer._id === undefined)) {
      console.warn(`APAR ${params.id} has unpopulated reviewer data. Reviewer ID: ${aparObj.reviewer}`);
      aparObj.reviewer = null;
    }

    return NextResponse.json({
      success: true,
      data: aparObj,
    });
  } catch (error: any) {
    console.error(`Error fetching APAR ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch APAR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { selfAppraisal, reviewer, reviewerComments, reviewerScore, status } = body;

    const updateData: any = {};
    
    if (selfAppraisal) {
      updateData.selfAppraisal = selfAppraisal;
    }
    
    if (reviewer) {
      updateData.reviewer = reviewer;
    }
    
    if (reviewerComments !== undefined) {
      updateData.reviewerComments = reviewerComments;
    }
    
    if (reviewerScore !== undefined) {
      updateData.reviewerScore = reviewerScore;
    }
    
    if (status) {
      updateData.status = status;
      
      // Recalculate final score when finalizing
      if (status === 'finalized' || status === 'reviewed') {
        const apar = await Apar.findById(params.id);
        if (apar) {
          const kpis = await (await import('@/models/KPI')).default.find({
            assignedTo: apar.employee,
            status: { $in: ['completed', 'Completed'] },
          });

          if (kpis.length > 0) {
            const avgKpiScore = kpis.reduce((sum: number, kpi: any) => sum + kpi.score, 0) / kpis.length;
            updateData.finalScore = avgKpiScore + (reviewerScore !== undefined ? reviewerScore : apar.reviewerScore);
          } else {
            updateData.finalScore = reviewerScore !== undefined ? reviewerScore : apar.reviewerScore;
          }
        }
      }
    }

    const updatedApar = await Apar.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employee', 'name email department position')
      .populate('userId', 'name email department position')
      .populate('reviewer', 'name email position');

    if (!updatedApar) {
      return NextResponse.json(
        {
          success: false,
          error: 'APAR not found',
        },
        { status: 404 }
      );
    }

    // Transform data to ensure consistent shapes - convert unpopulated refs to null
    const aparObj = updatedApar.toObject();
    
    // Ensure employee is either a populated object or null
    if (!aparObj.employee || typeof aparObj.employee === 'string' || aparObj.employee._id === undefined) {
      console.warn(`Updated APAR ${params.id} has missing or unpopulated employee data. Employee ID: ${aparObj.employee}`);
      aparObj.employee = null;
    }
    
    // Ensure userId is either a populated object or null
    if (aparObj.userId && (typeof aparObj.userId === 'string' || aparObj.userId._id === undefined)) {
      aparObj.userId = null;
    }
    
    // Ensure reviewer is either a populated object or null
    if (aparObj.reviewer && (typeof aparObj.reviewer === 'string' || aparObj.reviewer._id === undefined)) {
      console.warn(`Updated APAR ${params.id} has unpopulated reviewer data. Reviewer ID: ${aparObj.reviewer}`);
      aparObj.reviewer = null;
    }

    return NextResponse.json({
      success: true,
      data: aparObj,
    });
  } catch (error: any) {
    console.error(`Error updating APAR ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update APAR',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PATCH(request, { params });
}
