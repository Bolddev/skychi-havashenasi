import { Profile, WeatherData } from './store';
import { calculateDecision, calculateHourlyRisk, getWeeklyBestDay, getDayName, getActivityEmoji } from './rules';
import { getCurrentHourIndex, formatHour } from './weather';

export interface ExportLevel {
  id: 1 | 2 | 3;
  title: string;
  description: string;
  icon: string;
}

export const exportLevels: ExportLevel[] = [
  {
    id: 1,
    title: 'سطح ۱: کامل',
    description: 'تمام اطلاعات هوا، پروفایل کاربر، پیشنهادات و داده‌های هفته',
    icon: '📋',
  },
  {
    id: 2,
    title: 'سطح ۲: اطلاعات برنامه',
    description: 'اطلاعات هواشناسی و پیشنهادات ارائه‌شده',
    icon: '🌤️',
  },
  {
    id: 3,
    title: 'سطح ۳: فقط پیشنهادات',
    description: 'پیشنهادات و تصمیمات امروز',
    icon: '💡',
  },
];

function toPersianNum(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

function getTransportLabel(t: string): string {
  switch (t) {
    case 'walk': return 'پیاده';
    case 'car': return 'ماشین';
    case 'bike': return 'دوچرخه';
    case 'motorcycle': return 'موتور';
    case 'public': return 'حمل‌ونقل عمومی';
    default: return t;
  }
}

function getEquipmentLabel(e: string): string {
  switch (e) {
    case 'umbrella': return 'چتر';
    case 'raincoat': return 'بارانی';
    case 'jacket': return 'کاپشن';
    case 'hat': return 'کلاه';
    case 'gloves': return 'دستکش';
    case 'sunscreen': return 'ضدآفتاب';
    default: return e;
  }
}

function getActivityLabel(a: string): string {
  switch (a) {
    case 'park': return 'پارک';
    case 'walk': return 'پیاده‌روی';
    case 'picnic': return 'پیک‌نیک';
    case 'shopping': return 'خرید';
    case 'exercise': return 'ورزش';
    case 'photography': return 'عکاسی';
    default: return a;
  }
}

export function generateExportText(
  level: 1 | 2 | 3,
  profile: Profile,
  weatherData: WeatherData
): string {
  const decision = calculateDecision(profile, weatherData);
  const currentIdx = getCurrentHourIndex(weatherData.hourly.time);
  const currentTemp = weatherData.hourly.apparent_temperature[currentIdx] || 0;
  const currentActualTemp = weatherData.hourly.temperature_2m[currentIdx] || 0;
  const currentHumidity = weatherData.hourly.relative_humidity_2m[currentIdx] || 0;
  const currentWind = weatherData.hourly.wind_speed_10m[currentIdx] || 0;
  const currentGusts = weatherData.hourly.wind_gusts_10m[currentIdx] || 0;
  const currentPrecipProb = weatherData.hourly.precipitation_probability[currentIdx] || 0;
  const currentCloud = weatherData.hourly.cloud_cover[currentIdx] || 0;
  const currentUV = weatherData.hourly.uv_index[currentIdx] || 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Afternoon hours
  const afternoonRisks: { hour: string; risk: number; level: string }[] = [];
  for (let i = currentIdx; i < weatherData.hourly.time.length && i < currentIdx + 24; i++) {
    const timeStr = weatherData.hourly.time[i];
    const hour = parseInt(timeStr.split('T')[1]?.substring(0, 2) || '0');
    if (hour >= 16 && hour <= 22) {
      const risk = calculateHourlyRisk(profile, weatherData, i);
      afternoonRisks.push({ hour: formatHour(timeStr), risk: risk.riskScore, level: risk.level });
    }
  }

  const goOutText = decision.goOut === 'go' ? '✅ برو!' : decision.goOut === 'caution' ? '⚠️ با احتیاط' : '🚫 نرو';
  const levelEmoji = (l: string) => l === 'green' ? '🟢' : l === 'yellow' ? '🟡' : '🔴';

  // Level 3: Only suggestions
  if (level === 3) {
    let text = `💡 پیشنهادات اسکایچی — ${dateStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `🚦 تصمیم: ${goOutText}\n`;
    text += `👕 بپوش: ${decision.clothing}\n`;
    text += `🎒 ببر: ${decision.equipment.length > 0 ? decision.equipment.map(getEquipmentLabel).join(' + ') : 'تجهیز خاصی لازم نیست'}\n\n`;

    if (decision.goldenWindow) {
      text += `☀️ پنجره طلایی: ${decision.goldenWindow.start} تا ${decision.goldenWindow.end}\n\n`;
    }

    if (decision.thermalShock.warning) {
      text += `⚠️ شوک دمایی: ${decision.thermalShock.diff > 0 ? '+' : ''}${toPersianNum(decision.thermalShock.diff)}° نسبت به دیروز\n\n`;
    }

    if (decision.rainNowcast.raining) {
      text += `🌧️ الان باران می‌بارد!\n\n`;
    } else if (decision.rainNowcast.startsIn !== null) {
      text += `🌧️ باران ${toPersianNum(decision.rainNowcast.startsIn)} دقیقه دیگر شروع می‌شود`;
      if (decision.rainNowcast.duration) {
        text += ` و ${toPersianNum(decision.rainNowcast.duration)} دقیقه طول می‌کشد`;
      }
      text += `\n\n`;
    }

    if (decision.activityScores.length > 0) {
      text += `📊 امتیاز فعالیت‌ها:\n`;
      decision.activityScores.forEach((a) => {
        const emoji = a.score === 'good' ? '✅' : a.score === 'caution' ? '⚠️' : '❌';
        text += `  ${getActivityEmoji(a.activity)} ${getActivityLabel(a.activity)}: ${emoji} ${a.label}\n`;
      });
      text += `\n`;
    }

    if (decision.carWash) {
      const carText = decision.carWash === 'wash' ? '✅ امروز بشور' :
                      decision.carWash === 'wait' ? '⏳ امروز نشور' : '🅿️ زیر سقف ببر';
      text += `🚗 کارواش: ${carText}\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر`;
    return text;
  }

  // Level 2: Weather info + suggestions
  if (level === 2) {
    let text = `🌤️ گزارش اسکایچی — ${dateStr}\n`;
    text += `📍 قرچک، تهران\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `🌡️ شرایط فعلی:\n`;
    text += `  دما: ${toPersianNum(Math.round(currentActualTemp))}° | احساسی: ${toPersianNum(Math.round(currentTemp))}°\n`;
    text += `  رطوبت: ${toPersianNum(currentHumidity)}%\n`;
    text += `  باد: ${toPersianNum(Math.round(currentWind))} km/h | وزش: ${toPersianNum(Math.round(currentGusts))} km/h\n`;
    text += `  احتمال بارش: ${toPersianNum(currentPrecipProb)}%\n`;
    text += `  ابر: ${toPersianNum(currentCloud)}% | UV: ${toPersianNum(Math.round(currentUV))}\n\n`;

    text += `📊 نوار تصمیم (۱۶-۲۲):\n`;
    afternoonRisks.forEach((h) => {
      text += `  ${levelEmoji(h.level)} ${h.hour}: خطر ${toPersianNum(h.risk)}\n`;
    });
    text += `\n`;

    text += `🚦 تصمیم: ${goOutText}\n`;
    text += `👕 بپوش: ${decision.clothing}\n`;
    text += `🎒 ببر: ${decision.equipment.length > 0 ? decision.equipment.map(getEquipmentLabel).join(' + ') : 'تجهیز خاصی لازم نیست'}\n\n`;

    if (decision.goldenWindow) {
      text += `☀️ پنجره طلایی: ${decision.goldenWindow.start} تا ${decision.goldenWindow.end}\n\n`;
    }

    if (decision.thermalShock.warning) {
      text += `⚠️ شوک دمایی: ${decision.thermalShock.diff > 0 ? '+' : ''}${toPersianNum(decision.thermalShock.diff)}° نسبت به دیروز\n\n`;
    }

    if (decision.rainNowcast.raining) {
      text += `🌧️ الان باران می‌بارد!\n\n`;
    } else if (decision.rainNowcast.startsIn !== null) {
      text += `🌧️ باران ${toPersianNum(decision.rainNowcast.startsIn)} دقیقه دیگر شروع می‌شود`;
      if (decision.rainNowcast.duration) {
        text += ` و ${toPersianNum(decision.rainNowcast.duration)} دقیقه طول می‌کند`;
      }
      text += `\n\n`;
    }

    if (decision.activityScores.length > 0) {
      text += `📊 امتیاز فعالیت‌ها:\n`;
      decision.activityScores.forEach((a) => {
        const emoji = a.score === 'good' ? '✅' : a.score === 'caution' ? '⚠️' : '❌';
        text += `  ${getActivityEmoji(a.activity)} ${getActivityLabel(a.activity)}: ${emoji} ${a.label}\n`;
      });
      text += `\n`;
    }

    if (decision.carWash) {
      const carText = decision.carWash === 'wash' ? '✅ امروز بشور' :
                      decision.carWash === 'wait' ? '⏳ امروز نشور' : '🅿️ زیر سقف ببر';
      text += `🚗 کارواش: ${carText}\n\n`;
    }

    // Weekly best day
    const bestDay = getWeeklyBestDay(weatherData, profile);
    text += `📅 بهترین روز هفته: ${getDayName(bestDay.day)} (خطر: ${toPersianNum(bestDay.risk)})\n`;

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر`;
    return text;
  }

  // Level 1: Full report
  let text = `📋 گزارش کامل اسکایچی\n`;
  text += `${dateStr}\n`;
  text += `📍 قرچک، استان تهران، ایران\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Profile info
  text += `👤 پروفایل: ${profile.name}\n`;
  text += `────────────────────\n`;
  text += `آستانه‌ها:\n`;
  text += `  • حساسیت سرما: ${toPersianNum(profile.thresholds.coldThreshold)}°C\n`;
  text += `  • حساسیت گرما: ${toPersianNum(profile.thresholds.heatThreshold)}°C\n`;
  text += `  • آستانه باد: ${toPersianNum(profile.thresholds.windThreshold)} km/h\n`;
  text += `  • نسیم آزاردهنده: ${toPersianNum(profile.thresholds.breezeThreshold)} km/h\n`;
  text += `  • حمل‌ونقل: ${getTransportLabel(profile.thresholds.transport)}\n`;
  text += `  • ترجیح زمانی: ${profile.thresholds.timePreference === 'day' ? 'روز' : profile.thresholds.timePreference === 'night' ? 'شب' : 'فرقی نمی‌کند'}\n`;
  text += `  • تجهیزات: ${profile.thresholds.equipment.map(getEquipmentLabel).join('، ') || 'ندارد'}\n`;
  text += `  • فعالیت‌ها: ${profile.thresholds.activities.map(getActivityLabel).join('، ')}\n`;
  if (profile.thresholds.hasCar) {
    text += `  • خودرو: بله (${profile.thresholds.parking === 'street' ? 'پارک خیابان' : 'پارکینگ سرپوشیده'})\n`;
  }
  if (profile.thresholds.hasAllergy) text += `  • آلرژی فصلی: بله\n`;
  if (profile.thresholds.hasJointPain) text += `  • درد مفاصل: بله\n`;
  text += `\n`;

  // Current conditions
  text += `🌡️ شرایط فعلی هوا:\n`;
  text += `────────────────────\n`;
  text += `  دمای واقعی: ${toPersianNum(Math.round(currentActualTemp))}°C\n`;
  text += `  دمای احساسی: ${toPersianNum(Math.round(currentTemp))}°C\n`;
  text += `  رطوبت: ${toPersianNum(currentHumidity)}%\n`;
  text += `  سرعت باد: ${toPersianNum(Math.round(currentWind))} km/h\n`;
  text += `  وزش باد: ${toPersianNum(Math.round(currentGusts))} km/h\n`;
  text += `  احتمال بارش: ${toPersianNum(currentPrecipProb)}%\n`;
  text += `  پوشش ابر: ${toPersianNum(currentCloud)}%\n`;
  text += `  شاخص UV: ${toPersianNum(Math.round(currentUV))}\n\n`;

  // Decision bar
  text += `📊 نوار تصمیم (۱۶:۰۰ تا ۲۲:۰۰):\n`;
  text += `────────────────────\n`;
  afternoonRisks.forEach((h) => {
    text += `  ${levelEmoji(h.level)} ${h.hour} — امتیاز خطر: ${toPersianNum(h.risk)}/۱۰۰\n`;
  });
  text += `\n`;

  // Decisions
  text += `🚦 تصمیمات:\n`;
  text += `────────────────────\n`;
  text += `  خروج: ${goOutText}\n`;
  text += `  پوشش: ${decision.clothing}\n`;
  text += `  تجهیزات: ${decision.equipment.length > 0 ? decision.equipment.map(getEquipmentLabel).join(' + ') : 'تجهیز خاصی لازم نیست'}\n\n`;

  if (decision.goldenWindow) {
    text += `☀️ پنجره طلایی: ${decision.goldenWindow.start} تا ${decision.goldenWindow.end}\n\n`;
  }

  if (decision.thermalShock.warning) {
    text += `⚠️ هشدار شوک دمایی:\n`;
    text += `  اختلاف با دیروز: ${decision.thermalShock.diff > 0 ? '+' : ''}${toPersianNum(decision.thermalShock.diff)}°C\n\n`;
  }

  // Rain nowcast
  text += `🌧️ وضعیت بارش لحظه‌ای:\n`;
  text += `────────────────────\n`;
  if (decision.rainNowcast.raining) {
    text += `  ⛈️ الان باران می‌بارد!\n`;
    if (decision.rainNowcast.duration) {
      text += `  مدت: ${toPersianNum(decision.rainNowcast.duration)} دقیقه\n`;
    }
  } else if (decision.rainNowcast.startsIn !== null) {
    text += `  شروع: ${toPersianNum(decision.rainNowcast.startsIn)} دقیقه دیگر\n`;
    if (decision.rainNowcast.duration) {
      text += `  مدت: ${toPersianNum(decision.rainNowcast.duration)} دقیقه\n`;
    }
  } else {
    text += `  ✨ بارشی در ساعات نزدیک پیش‌بینی نمی‌شود\n`;
  }
  text += `\n`;

  // Activities
  if (decision.activityScores.length > 0) {
    text += `📊 امتیاز فعالیت‌ها:\n`;
    text += `────────────────────\n`;
    decision.activityScores.forEach((a) => {
      const emoji = a.score === 'good' ? '✅' : a.score === 'caution' ? '⚠️' : '❌';
      text += `  ${getActivityEmoji(a.activity)} ${getActivityLabel(a.activity)}: ${emoji} ${a.label}\n`;
    });
    text += `\n`;
  }

  // Car wash
  if (decision.carWash) {
    text += `🚗 برنامه‌ریز کارواش:\n`;
    text += `────────────────────\n`;
    const carText = decision.carWash === 'wash' ? '✅ امروز بشور — ۷۲ ساعت بارش نداریم' :
                    decision.carWash === 'wait' ? '⏳ امروز نشور — باران نزدیک است' : '🅿️ ماشین را زیر سقف ببر';
    text += `  ${carText}\n\n`;
  }

  // Weekly forecast
  text += `📅 پیش‌بینی هفته:\n`;
  text += `────────────────────\n`;
  const bestDay = getWeeklyBestDay(weatherData, profile);
  text += `  بهترین روز: ${getDayName(bestDay.day)} (امتیاز خطر: ${toPersianNum(bestDay.risk)})\n\n`;

  const days = weatherData.daily.time;
  for (let d = 0; d < days.length; d++) {
    let maxTemp = -100;
    let minTemp = 100;
    let maxPrecip = 0;
    for (let i = d * 24; i < (d + 1) * 24 && i < weatherData.hourly.time.length; i++) {
      const temp = weatherData.hourly.temperature_2m[i];
      if (temp > maxTemp) maxTemp = temp;
      if (temp < minTemp) minTemp = temp;
      const precip = weatherData.hourly.precipitation_probability[i] || 0;
      if (precip > maxPrecip) maxPrecip = precip;
    }
    text += `  ${getDayName(days[d])}: ${toPersianNum(Math.round(minTemp))}° تا ${toPersianNum(Math.round(maxTemp))}° | بارش: ${toPersianNum(maxPrecip)}%\n`;
  }
  text += `\n`;

  // Day/Night
  text += `🌅 روز/شب:\n`;
  text += `────────────────────\n`;
  text += `  روز: ۱۶:۰۰ تا ${decision.dayNightInfo.twilight}\n`;
  text += `  شب: ${decision.dayNightInfo.nightStart} تا ۲۲:۰۰\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📱 اسکایچی — دستیار تصمیم هوای بعدازظهر\n`;
  text += `داده‌ها: Open-Meteo API\n`;
  text += `نسخه ۱.۰`;

  return text;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
