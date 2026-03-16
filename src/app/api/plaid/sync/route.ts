import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { syncTransactions } from '@/lib/plaid';
import { decrypt } from '@/lib/encryption';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createAdminClient();

    const { data: plaidItems } = await adminSupabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!plaidItems?.length) {
      return NextResponse.json({ synced: 0, message: 'No Plaid items found' });
    }

    let totalSynced = 0;

    for (const item of plaidItems) {
      try {
        const accessToken = decrypt(item.access_token_encrypted);
        let cursor = item.cursor ?? undefined;
        let hasMore = true;
        const allAdded: unknown[] = [];

        while (hasMore) {
          const syncData = await syncTransactions(accessToken, cursor);
          allAdded.push(...syncData.added);
          cursor = syncData.next_cursor;
          hasMore = syncData.has_more;
        }

        if (allAdded.length > 0) {
          const rows = (allAdded as Array<{
            transaction_id: string;
            merchant_name?: string;
            name?: string;
            amount: number;
            iso_currency_code?: string;
            date: string;
            category?: string[];
            pending?: boolean;
          }>).map(tx => ({
            user_id: user.id,
            plaid_item_id: item.id,
            plaid_transaction_id: tx.transaction_id,
            merchant_name: tx.merchant_name ?? null,
            name: tx.name ?? tx.merchant_name ?? 'Unknown',
            amount: tx.amount,
            currency: tx.iso_currency_code ?? 'USD',
            date: tx.date,
            category: tx.category ?? null,
            pending: tx.pending ?? false,
            is_recurring: false,
          }));

          const { error } = await adminSupabase
            .from('transactions')
            .upsert(rows, { onConflict: 'plaid_transaction_id', ignoreDuplicates: true });

          if (error) console.error('Transaction insert error:', error);
          totalSynced += rows.length;
        }

        await adminSupabase
          .from('plaid_items')
          .update({ cursor, last_synced_at: new Date().toISOString() })
          .eq('id', item.id);

      } catch (itemError) {
        console.error(`Error syncing item ${item.id}:`, itemError);
        await adminSupabase
          .from('plaid_items')
          .update({ status: 'error', error_code: 'SYNC_FAILED' })
          .eq('id', item.id);
      }
    }

    return NextResponse.json({ synced: totalSynced });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
