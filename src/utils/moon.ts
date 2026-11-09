// ============================================================
// اسکای‌چی نسخه ۲.۰ — فاز ماه
// ============================================================

// مرجع: ماه نو ۶ ژانویه ۲۰۰۰ ساعت ۱۸:۱۴ UTC
const NEW_MOON_REFERENCE = new Date('2000-01-06T18:14:00Z');
const LUNAR_CYCLE_DAYS = 29.53059;

export function getMoonPhase(date: Date): number {
  const daysSinceNewMoon = (date.getTime() - NEW_MOON_REFERENCE.getTime()) / 86400000;
  let phase = (daysSinceNewMoon % LUNAR_CYCLE_DAYS) / LUNAR_CYCLE_DAYS;
  if (phase < 0) phase += 1;
  return phase;
}

export function getMoonIllumination(phase: number): number {
  return (1 - Math.cos(2 * Math.PI * phase)) / 2 * 100;
}

export function getMoonPhaseName(phase: number): string {
  if (phase < 0.0625) return 'ماه نو';
  if (phase < 0.1875) return 'هلال اول';
  if (phase < 0.3125) return 'تربیع اول';
  if (phase < 0.4375) return 'ماه برآمده';
  if (phase < 0.5625) return 'ماه کامل';
  if (phase < 0.6875) return 'ماه کاسته';
  if (phase < 0.8125) return 'تربیع آخر';
  if (phase < 0.9375) return 'هلال آخر';
  return 'ماه نو';
}
