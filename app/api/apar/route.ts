import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import APAR from '@/models/APAR';
import { authenticate, AuthRequest } from '@/middleware/auth';

async function getHandler(req: AuthRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    const filter = userId ? { userId } : {};
    
    const apars = await APAR.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ apars });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function postHandler(req: AuthRequest) {
  try {
    await dbConnect();
    
    const { year, period, achievements, challenges, goals, draft, status } = await req.json();
    
    const apar = await APAR.create({
      userId: req.user?.userId,
      year,
      period,
      achievements,
      challenges,
      goals,
      draft,
      status: status || 'draft'
    });
    
    return NextResponse.json({ apar }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = authenticate(getHandler);
export const POST = authenticate(postHandler);
