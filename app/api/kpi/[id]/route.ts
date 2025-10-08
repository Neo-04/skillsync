import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Kpi from '@/models/KPI';
import { authenticate, AuthRequest } from '@/middleware/auth';

// GET single KPI by ID
async function getHandler(req: AuthRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;

    const kpi = await Kpi.findById(id)
      .populate('assignedTo', 'name email designation department role')
      .populate('assignedBy', 'name email');

    if (!kpi) {
      return NextResponse.json({ success: false, error: 'KPI not found' }, { status: 404 });
    }

    // Check permissions
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      if (kpi.assignedTo.toString() !== req.user?.userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: kpi });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update KPI (progress, status, notes)
async function patchHandler(req: AuthRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();

    const kpi = await Kpi.findById(id);

    if (!kpi) {
      return NextResponse.json({ success: false, error: 'KPI not found' }, { status: 404 });
    }

    // Check permissions - employees can update their own KPIs, admins can update any
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const isAssignedUser = kpi.assignedTo.toString() === req.user?.userId;

    if (!isAdmin && !isAssignedUser) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own KPIs' },
        { status: 403 }
      );
    }

    // Update allowed fields
    if (body.achievedValue !== undefined) kpi.achievedValue = body.achievedValue;
    if (body.status) kpi.status = body.status;
    if (body.progressNotes !== undefined) kpi.progressNotes = body.progressNotes;
    if (body.qualitativeScore !== undefined) kpi.qualitativeScore = body.qualitativeScore;
    if (body.supervisorComments !== undefined && isAdmin) kpi.supervisorComments = body.supervisorComments;
    if (body.remarks !== undefined) kpi.remarks = body.remarks;

    kpi.lastUpdated = new Date();

    await kpi.save(); // This triggers the pre-save hook to calculate score and progress

    const updatedKpi = await Kpi.findById(id)
      .populate('assignedTo', 'name email designation department role')
      .populate('assignedBy', 'name email');

    return NextResponse.json({ success: true, data: updatedKpi });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE KPI
async function deleteHandler(req: AuthRequest, { params }: { params: { id: string } }) {
  try {
    // Only admins can delete KPIs
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete KPIs' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = params;

    const kpi = await Kpi.findByIdAndDelete(id);

    if (!kpi) {
      return NextResponse.json({ success: false, error: 'KPI not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'KPI deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Full update (admin only)
async function putHandler(req: AuthRequest, { params }: { params: { id: string } }) {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can fully update KPIs' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = params;
    const body = await req.json();

    const kpi = await Kpi.findByIdAndUpdate(
      id,
      { ...body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email designation department role')
      .populate('assignedBy', 'name email');

    if (!kpi) {
      return NextResponse.json({ success: false, error: 'KPI not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: kpi });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = authenticate(getHandler);
export const PATCH = authenticate(patchHandler);
export const DELETE = authenticate(deleteHandler);
export const PUT = authenticate(putHandler);