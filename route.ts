import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { issueOtp } from '@/lib/otp';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: 'Account already verified' }, { status: 400 });

  await issueOtp(user.id, 'REGISTER_VERIFY', user.email);
  return NextResponse.json({ ok: true });
}
