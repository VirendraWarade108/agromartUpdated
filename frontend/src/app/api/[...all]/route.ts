import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'API catch-all route' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'API catch-all route' });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ message: 'API catch-all route' });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ message: 'API catch-all route' });
}
