import { NextResponse, NextRequest } from 'next/server';
import { personalityProfiles, ColorKey } from '@/lib/personality-data';
import { getCareerInsight } from '@/lib/career-data';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limiting: 30 requests per minute per IP
  const rateLimit = checkRateLimit(request, 'career-match', { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const color = searchParams.get('color') as ColorKey | null;

  if (!color || !personalityProfiles[color]) {
    return NextResponse.json(
      { error: 'Invalid color. Use: red, blue, white, or yellow.' },
      { status: 400 },
    );
  }

  const profile = personalityProfiles[color];
  const insight = getCareerInsight(color);

  return NextResponse.json({
    color,
    name: profile.name,
    motive: profile.motive,
    careerStyle: profile.careerStyle,
    idealEnvironment: insight.idealEnvironment,
    naturalStrengths: insight.naturalStrengths,
    developmentAreas: insight.developmentAreas,
    categories: insight.categories,
  });
}
