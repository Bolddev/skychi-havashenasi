// ============================================================
// اسکای‌چی نسخه ۲.۰ — کتابخانه تفسیرها
// ============================================================

// ----- interpretTemperature -----
export function interpretTemperature(temperature: number, apparentTemperature: number): string {
  const diff = apparentTemperature - temperature;
  if (Math.abs(diff) < 1) {
    return 'تقریباً برابر با دمای واقعی';
  }
  if (diff < 0) {
    return `${Math.round(Math.abs(diff))} درجه خنک‌تر از دمای واقعی — به‌خاطر باد و رطوبت`;
  }
  return `${Math.round(diff)} درجه گرم‌تر از دمای واقعی — به‌خاطر رطوبت`;
}

// ----- interpretHumidity -----
export function interpretHumidity(humidity: number): string {
  if (humidity < 30) return 'خشک';
  if (humidity < 50) return 'نسبتاً خشک';
  if (humidity < 70) return 'مطلوب';
  if (humidity < 85) return 'مرطوب';
  return 'شرجی';
}

// ----- interpretCloudCover -----
export function interpretCloudCover(cloudCover: number): string {
  if (cloudCover < 10) return 'صاف';
  if (cloudCover < 30) return 'تقریباً صاف';
  if (cloudCover < 60) return 'نیمه‌ابری';
  if (cloudCover < 85) return 'عمدتاً ابری';
  return 'ابری';
}

// ----- interpretWindGust -----
export function interpretWindGust(gust: number): string {
  if (gust < 10) return 'آرام';
  if (gust < 20) return 'نسیم';
  if (gust < 30) return 'ملایم';
  if (gust < 40) return 'نسبتاً شدید';
  if (gust < 60) return 'شدید';
  return 'خیلی شدید';
}

// ----- interpretWindDirection -----
export function interpretWindDirection(degrees: number): { label: string; shelter: string } {
  let label: string;
  let shelter: string;

  if (degrees >= 337.5 || degrees < 22.5) {
    label = 'شمال';
    shelter = 'جنوب';
  } else if (degrees < 67.5) {
    label = 'شمال‌شرق';
    shelter = 'جنوب‌غرب';
  } else if (degrees < 112.5) {
    label = 'شرق';
    shelter = 'غرب';
  } else if (degrees < 157.5) {
    label = 'جنوب‌شرق';
    shelter = 'شمال‌غرب';
  } else if (degrees < 202.5) {
    label = 'جنوب';
    shelter = 'شمال';
  } else if (degrees < 247.5) {
    label = 'جنوب‌غرب';
    shelter = 'شمال‌شرق';
  } else if (degrees < 292.5) {
    label = 'غرب';
    shelter = 'شرق';
  } else {
    label = 'شمال‌غرب';
    shelter = 'جنوب‌شرق';
  }

  return { label, shelter };
}

// ----- interpretUV -----
export function interpretUV(uv: number): { label: string; advice: string } {
  if (uv <= 2) return { label: 'کم', advice: 'نیازی نیست' };
  if (uv <= 5) return { label: 'متوسط', advice: 'ضدآفتاب برای پوست حساس' };
  if (uv <= 7) return { label: 'بالا', advice: 'ضدآفتاب، کلاه، سایه' };
  if (uv <= 10) return { label: 'خیلی بالا', advice: 'اجتناب از آفتاب مستقیم' };
  return { label: 'خطرناک', advice: 'در خانه بمان' };
}

// ----- interpretAQI -----
export function interpretAQI(aqi: number): { label: string; advice: string } {
  if (aqi <= 20) return { label: 'خوب', advice: 'مناسب' };
  if (aqi <= 40) return { label: 'متوسط', advice: 'مناسب' };
  if (aqi <= 60) return { label: 'متوسط', advice: 'افراد حساس احتیاط' };
  if (aqi <= 80) return { label: 'ضعیف', advice: 'پیاده‌روی طولانی نکن' };
  if (aqi <= 100) return { label: 'خیلی ضعیف', advice: 'ماسک، اجتناب' };
  return { label: 'خطرناک', advice: 'در خانه بمان' };
}

// ----- interpretRisk -----
export function interpretRisk(risk: number): string {
  if (risk < 20) return 'امن — همه چیز مطلوب';
  if (risk < 30) return 'امن — شرایط خوب';
  if (risk < 50) return 'احتیاط — یک عامل نامطلوب';
  if (risk < 70) return 'احتیاط — چند عامل نامطلوب';
  if (risk < 85) return 'خطر — برای تو مناسب نیست';
  return 'خطر بالا — بیرون نرو';
}

// ----- interpretWeatherCode -----
export function interpretWeatherCode(code: number): { label: string; icon: string } {
  const wmoMap: Record<number, { label: string; icon: string }> = {
    0: { label: 'آسمان صاف', icon: '☀️' },
    1: { label: 'عمدتاً صاف', icon: '🌤️' },
    2: { label: 'نیمه‌ابری', icon: '⛅' },
    3: { label: 'ابری', icon: '☁️' },
    45: { label: 'مه', icon: '🌫️' },
    48: { label: 'مه یخ‌زده', icon: '🌫️' },
    51: { label: 'نم‌نم باران سبک', icon: '🌦️' },
    53: { label: 'نم‌نم باران متوسط', icon: '🌦️' },
    55: { label: 'نم‌نم باران شدید', icon: '🌧️' },
    61: { label: 'باران سبک', icon: '🌧️' },
    63: { label: 'باران متوسط', icon: '🌧️' },
    65: { label: 'باران شدید', icon: '🌧️' },
    71: { label: 'برف سبک', icon: '🌨️' },
    73: { label: 'برف متوسط', icon: '🌨️' },
    75: { label: 'برف شدید', icon: '❄️' },
    77: { label: 'دانه‌های برف', icon: '🌨️' },
    80: { label: 'رگبار سبک', icon: '🌦️' },
    81: { label: 'رگبار متوسط', icon: '🌧️' },
    82: { label: 'رگبار شدید', icon: '⛈️' },
    85: { label: 'رگبار برف سبک', icon: '🌨️' },
    86: { label: 'رگبار برف شدید', icon: '❄️' },
    95: { label: 'رعدوبرق', icon: '⛈️' },
    96: { label: 'رعدوبرق با تگرگ سبک', icon: '⛈️' },
    99: { label: 'رعدوبرق با تگرگ شدید', icon: '⛈️' },
  };

  return wmoMap[code] || { label: 'نامشخص', icon: '❓' };
}

// ----- buildSummary -----
export function buildSummary(
  goDecisionAction: 'go' | 'go-until' | 'go-covered' | 'stay-indoor',
  untilTime?: Date | null
): string {
  switch (goDecisionAction) {
    case 'go':
      return 'شرایط مطلوب — می‌توانی بیرون بروی.';
    case 'go-until':
      if (untilTime) {
        const h = untilTime.getHours().toString().padStart(2, '0');
        const m = untilTime.getMinutes().toString().padStart(2, '0');
        return `می‌توانی بروی، اما تا ${h}:${m}.`;
      }
      return 'می‌توانی بروی، اما با احتیاط.';
    case 'go-covered':
      return 'جای سرپوشیده بهتر است.';
    case 'stay-indoor':
      return 'امروز برای بیرون رفتن مناسب نیست.';
    default:
      return '';
  }
}
