import { NextResponse } from 'next/server';

/**
 * Proxies the weekly digest request to the Supabase Edge Function from the server.
 * This avoids CORS issues when calling the Edge Function from the browser.
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing Supabase env' },
      { status: 500 }
    );
  }

  const functionUrl = `${url}/functions/v1/send-weekly-digest`;

  let testEmail: string | undefined;
  try {
    const body = await request.json();
    testEmail = typeof body?.email === 'string' ? body.email : undefined;
  } catch {
    // no body
  }

  try {
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ force: true, ...(testEmail && { testEmail }) }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { error?: string }).error || 'Edge function failed' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to call weekly digest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
