import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getBearerToken } from '@/lib/supabase/auth-guard';

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: results, error: fetchError } = await supabase
    .from('personality_results')
    .select('id, dominant_color, secondary_color, result_data, created_at')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }

  return NextResponse.json({ results: results || [] });
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dominant, secondary, scores, percentages, health } = body;

    if (!dominant || !secondary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('personality_results').insert({
      user_id: userData.user.id,
      dominant_color: dominant,
      secondary_color: secondary,
      result_data: { scores, percentages, health },
    });

    if (insertError) {
      console.error('Failed to save personality result:', insertError);
      return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('results POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
