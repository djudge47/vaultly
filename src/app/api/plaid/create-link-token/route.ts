import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLinkToken } from '@/lib/plaid';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await createLinkToken(user.id);
    return NextResponse.json({ link_token: data.link_token });
  } catch (error) {
    console.error('Create link token error:', error);
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}
