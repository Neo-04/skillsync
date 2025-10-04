import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import KPI from '@/models/KPI';
import { authenticate, AuthRequest } from '@/middleware/auth';

async function getHandler(req: AuthRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    const filter = userId ? { userId } : {};
    
    const kpis = await KPI.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ kpis });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function postHandler(req: AuthRequest) {
  try {
    await dbConnect();
    
    const { metric, value, target, unit, period } = await req.json();
    
    const kpi = await KPI.create({
      userId: req.user?.userId,
      metric,
      value,
      target,
      unit,
      period
    });
    
    return NextResponse.json({ kpi }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
