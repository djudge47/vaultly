import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { exchangePublicToken, getInstitution } from '@/lib/plaid';
import { encrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { public_token, institution_id, institution_name } = await request.json();
    const exchangeData = await exchangePublicToken(public_token);
    const { access_token, item_id } = exchangeData;
    const encryptedToken = encrypt(access_token);

    let instName = institution_name;
    if (institution_id && !instName) {
      try {
        const inst = await getInstitution(institution_id);
        instName = inst.name;
      } catch { /* ignore */ }
    }

    const adminSupabase = createAdminClient();
    const { data: plaidItem, error } = await adminSupabase
      .from('plaid_items')
      .insert({
        user_id: user.id,
        plaid_item_id: item_id,
        access_token_encrypted: encryptedToken,
        institution_id: institution_id ?? null,
        institution_name: instName ?? null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Mark bank as connected in profile
    await adminSupabase
      .from('profiles')
      .update({ bank_connected: true })
      .eq('id', user.id);

    return NextResponse.json({ success: true, item_id: plaidItem.id, institution_name: instName });
  } catch (error) {
    console.error('Exchange token error:', error);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
