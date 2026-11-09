# 🧠 موتور قواعد اسکای‌چی (Decision Engine)

این سند توضیح کاملی از موتور قواعد اسکای‌چی ارائه می‌دهد. این مستند برای انتقال منطق به اندروید (Kotlin) ضروری است.

## معماری کلی

```
WeatherData + UserProfile → evaluate() → DecisionOutput
```

### ورودی‌ها

1. **WeatherData**: داده‌های هواشناسی نرمال‌شده از Open-Meteo
2. **UserProfile**: پروفایل کاربر با آستانه‌های شخصی

### خروجی

**DecisionOutput**: شامل تمام تصمیمات و توصیه‌ها

## فرمول‌های اصلی

### ۱. محاسبه ریسک ساعتی (HourRisk)

```typescript
Risk(hour) = clamp(
  w_rain × rainRisk(hour) +
  w_wind × windRisk(hour) +
  w_cold × coldRisk(hour) +
  w_shock × shockRisk(hour) +
  w_uv × uvRisk(hour) +
  w_air × airRisk(hour),
  0, 100
)
```

#### rainRisk(hour)
```
P = precipitationProbability / 100
I = precipitation (mm)
isRainy = weatherCode ∈ {51,53,55,61,63,65,80,81,82,95,96,99}
isSnowy = weatherCode ∈ {71,73,75,77,85,86}

baseRisk = 60 × P + 30 × min(I / 2, 1)
if (isRainy) baseRisk += 20
if (isSnowy) baseRisk += 30

// ضریب حمل‌ونقل
if (transport === 'walking') baseRisk *= 1.3
if (transport === 'car') baseRisk *= 0.7

score = clamp(baseRisk, 0, 100)
```

#### windRisk(hour)
```
G = windGusts
threshold = windAnnoyThreshold

if (G < threshold) score = (G / threshold) × 20
else if (G < threshold × 1.5) score = 30 + ((G - threshold) / (threshold × 0.5)) × 30
else if (G < threshold × 2) score = 60 + ((G - threshold × 1.5) / (threshold × 0.5)) × 25
else score = 85 + min((G - threshold × 2) / 20, 15)

if (precipitationProbability > 40 && G > 25) score += 15

score = clamp(score, 0, 100)
```

#### coldRisk(hour)
```
AT = apparentTemperature
T = coldComfortThreshold

if (AT >= T) score = 0
else if (AT >= T - 4) score = 20 + ((T - AT) / 4) × 20
else if (AT >= T - 10) score = 40 + ((T - 4 - AT) / 6) × 30
else score = 70 + min(((T - 10 - AT) / 5) × 10, 30)

if (relativeHumidity > 70 && windSpeed > 15) score += 10

score = clamp(score, 0, 100)
```

#### shockRisk(hour)
```
diff = apparentTempYesterday - apparentTempToday

if (diff >= 8) score = 100
else if (diff >= 5) score = 60 + ((diff - 5) / 3) × 40
else if (diff >= 3) score = 20 + ((diff - 3) / 2) × 40
else if (diff <= -8) score = max(score, 50)
else score = 0

score = clamp(score, 0, 100)
```

#### uvRisk(hour)
```
UV = uvIndex
threshold = uvThreshold

if (UV <= threshold) score = 0
else score = min(((UV - threshold) / (11 - threshold)) × 80, 100)

score = clamp(score, 0, 100)
```

#### airRisk(hour)
```
AQI = europeanAqi

if (AQI <= 40) score = 0
else if (AQI <= 60) score = 20
else if (AQI <= 80) score = 40
else if (AQI <= 100) score = 60
else score = 80 + min(((AQI - 100) / 50) × 20, 20)

if (respiratoryIssue || seasonalAllergy) score *= 1.3

score = clamp(score, 0, 100)
```

### ۲. پنجره طلایی (Golden Window)

```
1. ساعت‌های 16-22 با risk < 30 را پیدا کن
2. آن‌ها را به بازه‌های پیوسته گروه‌بندی کن
3. طولانی‌ترین بازه را انتخاب کن
4. اگر dayNightPreference === 'day':
   - بازه باید حداقل 90 دقیقه قبل از غروب تمام شود
5. اگر طول بازه >= 60 دقیقه: پنجره طلایی
6. در غیر این صورت: پنجره قابل قبول (risk 30-60, >= 90 دقیقه)
```

### ۳. تصمیم خروج (Go Decision)

```
if (goldenWindow && duration >= 60):
  if (dayNightPreference === 'day' && goldenWindow.end < sunset - 90min):
    action = 'go-until', until = goldenWindow.end
  else:
    action = 'go'

else if (acceptableWindow && duration >= 90):
  if (transport === 'walking' && activities.includes('park')):
    action = 'go-covered'
  else:
    action = 'go-until', until = acceptableWindow.end

else:
  action = 'stay-indoor'
```

### ۴. Nowcast (پیش‌بینی لحظه‌ای)

```
1. اگر minutely15 خالی یا < 8 آیتم: no-data
2. next2h = آیتم‌های 2 ساعت آینده
3. اگر next2h[0].precipitation > 0.05:
   - raining-now
   - پیدا کردن اولین آیتم خشک برای endsAt
4. در غیر این صورت:
   - پیدا کردن اولین آیتم بارش برای startsAt
   - rain-starting-soon
5. اگر هیچ بارشی نیست: dry-next-2h

قاعده سخت: هیچ عددی > 120 دقیقه نباشد
```

### ۵. شوک دمایی (Temperature Shock)

```
for hour in 16-22:
  diff = yesterdayTemp[hour] - todayTemp[hour]
  if |diff| > |maxShock|: maxShock = diff, shockHour = hour

if |maxShock| < 5: return null

severity = |maxShock| >= 8 ? 'high' : 'medium'
direction = maxShock > 0 ? 'colder' : 'warmer'
```

### ۶. امتیاز فعالیت‌ها

#### پیک‌نیک
```
avgAT ∈ [18, 28]
maxRain < 20%
maxGust < 25 km/h
maxUV < 7
pastRain (3h) < 0.5mm
```

#### پیاده‌روی
```
avgAT ∈ [10, 28]
maxRain < 25% (walking) یا < 40% (car)
maxGust < 30 km/h
visibility >= 1000m
```

#### عکاسی
```
ساعت طلایی در بازه 16-22
cloudCover ∈ [30, 70]
maxGust <= 30 km/h
```

### ۷. کارواش

```
maxRain48 = max(precipitationProbability) در 48 ساعت آینده
maxRain72 = max(precipitationProbability) در 72 ساعت آینده

if (maxRain48 > 40): dont-wash
else if (maxRain72 <= 30): wash
else: dont-wash

if (parking === 'street' && hoursUntilRain < 24):
  parkingAdvice = 'زیر سقف پارک کن'
```

### ۸. هشدارها

| نوع | آستانه | شدت |
|-----|---------|------|
| تندباد | gust >= 50 | warning |
| تندباد شدید | gust >= 70 | danger |
| مه | visibility < 1000 | warning |
| مه غلیظ | visibility < 500 | danger |
| یخ‌زدگی | temp < 2 && precip > 0 | warning |
| آلودگی | AQI > 80 | warning |
| آلودگی شدید | AQI > 120 | danger |
| UV بالا | UV >= 8 | warning |

### ۹. اطلاعات خورشید

```
sunrise, sunset: از API
civilTwilightStart = sunrise - 30min
civilTwilightEnd = sunset + 30min
goldenHourMorning = {start: sunrise, end: sunrise + 60min}
goldenHourEvening = {start: sunset - 60min, end: sunset}
isDay = now >= sunrise && now <= sunset
```

### ۱۰. فاز ماه

```
newMoonReference = 2000-01-06T18:14:00Z
daysSinceNewMoon = (now - newMoonReference) / 86400000
phase = (daysSinceNewMoon mod 29.53059) / 29.53059
illumination = (1 - cos(2π × phase)) / 2 × 100
```

### ۱۱. فشار هوا

```
current = surfacePressure(now)
past = average(surfacePressure of last 3 hours)
future = average(surfacePressure of next 3 hours)

if (future - current > 2 && current - past > 2): trend = 'rising'
else if (future - current < -2 && current - past < -2): trend = 'falling'
else: trend = 'steady'
```

## وزن‌های پیش‌فرض

```typescript
weights = {
  rain: 1.5,   // برای پیاده‌رو
  wind: 1.3,
  cold: 1.5,
  shock: 1.2,
  uv: 0.8,
  air: 0.6
}
```

## آستانه‌های پیش‌فرض

```typescript
coldComfortThreshold: 18°C  // برای کاربر سرمایی
heatThreshold: 26°C
windAnnoyThreshold: 21 km/h
breezeAnnoyThreshold: 10 km/h
uvThreshold: 6
```

## تست با Fixtures

فایل `test-fixtures.json` شامل ۱۰ سناریوی تست است. برای هر سناریو:

1. ورودی (profile + weather + now) را بساز
2. `evaluate()` را صدا بزن
3. خروجی را با `expected` مقایسه کن

این fixtures برای تست نسخه اندروید نیز قابل استفاده است.

---

**این سند برای انتقال به Kotlin ضروری است. همه فرمول‌ها باید دقیقاً مطابق پیاده‌سازی شوند.**
