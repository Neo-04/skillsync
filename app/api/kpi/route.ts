import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Kpi from '@/models/KPI';
import User from '@/models/User';
import { authenticate, AuthRequest } from '@/middleware/auth';

async function getHandler(req: AuthRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    const query: any = {};
    
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      if (userId) query.assignedTo = userId;
    } else {
      query.assignedTo = req.user?.userId;
    }
    
    const kpis = await Kpi.find(query)
      .populate('assignedTo', 'name email designation department role')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: kpis });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function postHandler(req: AuthRequest) {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can assign KPIs' },
        { status: 403 }
      );
    }
    
    await dbConnect();
    const body = await req.json();
    
    const kpiData = {
      ...body,
      assignedBy: req.user?.userId,
    };
    
    const kpi = await Kpi.create(kpiData);
    
    const populatedKpi = await Kpi.findById(kpi._id)
      .populate('assignedTo', 'name email designation department role')
      .populate('assignedBy', 'name email');
    
    return NextResponse.json({ success: true, data: populatedKpi }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);