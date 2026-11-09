# 📱 انتقال به اندروید (Android Port Guide)

این راهنما برای تیم اندروید تهیه شده تا منطق اسکای‌چی را به Kotlin منتقل کنند.

## معماری پیشنهادی

```
app/
├── domain/           # لایه منطق (خالص Kotlin، بدون وابستگی Android)
│   ├── model/        # Data classes (معادل types/)
│   └── engine/       # موتور قواعد (معادل engine/)
├── data/             # لایه داده
│   ├── remote/       # API calls (Retrofit/Ktor)
│   ├── local/        # Cache (DataStore/Room)
│   └── repository/   # Repository pattern
└── presentation/     # لایه UI
    ├── viewmodel/    # ViewModels
    ├── ui/           # Jetpack Compose
    └── widget/       # Glance widget
```

## نگاشت فایل‌ها

| TypeScript | Kotlin | توضیح |
|------------|--------|--------|
| `types/index.ts` | `domain/model/*.kt` | Data classes |
| `engine/index.ts` | `domain/engine/DecisionEngine.kt` | تابع اصلی evaluate |
| `engine/risk.ts` | `domain/engine/RiskCalculator.kt` | محاسبه ریسک ساعتی |
| `engine/goldenWindow.ts` | `domain/engine/GoldenWindowFinder.kt` | پیدا کردن پنجره طلایی |
| `engine/decision.ts` | `domain/engine/GoDecisionMaker.kt` | تصمیم خروج |
| `engine/nowcast.ts` | `domain/engine/NowcastEngine.kt` | پیش‌بینی لحظه‌ای |
| `engine/shock.ts` | `domain/engine/ShockDetector.kt` | تشخیص شوک دمایی |
| `engine/activities.ts` | `domain/engine/ActivityScorer.kt` | امتیاز فعالیت‌ها |
| `engine/carWash.ts` | `domain/engine/CarWashDecider.kt` | تصمیم کارواش |
| `engine/daylight.ts` | `domain/engine/DaylightCalculator.kt` | اطلاعات خورشید |
| `engine/wearGear.ts` | `domain/engine/WearGearAdvisor.kt` | توصیه پوشش |
| `engine/alerts.ts` | `domain/engine/AlertGenerator.kt` | تولید هشدارها |
| `engine/week.ts` | `domain/engine/WeekRanker.kt` | رتبه‌بندی هفته |
| `engine/compare.ts` | `domain/engine/ProfileComparer.kt` | مقایسه پروفایل‌ها |
| `engine/interpretations.ts` | `domain/engine/Interpreter.kt` | تفسیرها |
| `engine/nightSky.ts` | `domain/engine/NightSkyCalculator.kt` | آسمان شب |
| `engine/pressure.ts` | `domain/engine/PressureAnalyzer.kt` | فشار هوا |
| `engine/departure.ts` | `domain/engine/DepartureSuggester.kt` | زمان حرکت |
| `data/openMeteo.ts` | `data/remote/OpenMeteoApi.kt` | API calls |
| `data/normalizer.ts` | `data/mapper/WeatherMapper.kt` | تبدیل داده |
| `data/cache.ts` | `data/local/WeatherCache.kt` | کش |
| `data/wmoLabels.ts` | `data/model/WmoLabels.kt` | نگاشت WMO |
| `utils/date.ts` | `util/DateUtils.kt` | توابع تاریخ |
| `utils/format.ts` | `util/FormatUtils.kt` | فرمت‌بندی |
| `utils/moon.ts` | `util/MoonPhase.kt` | فاز ماه |

## Data Classes

```kotlin
// domain/model/UserProfile.kt
data class UserProfile(
    val id: String,
    val name: String,
    val coldComfortThreshold: Double,
    val heatThreshold: Double,
    val windAnnoyThreshold: Double,
    val breezeAnnoyThreshold: Double,
    val uvThreshold: Double,
    val weights: RiskWeights,
    val dayNightPreference: DayNightPreference,
    val transport: Transport,
    val activities: List<Activity>,
    val gear: List<Gear>,
    val hasCar: Boolean,
    // ... سایر فیلدها
)

// domain/model/DecisionOutput.kt
data class DecisionOutput(
    val current: CurrentConditions,
    val hourlyRisk: List<HourRisk>,
    val goldenWindow: TimeWindow?,
    val goldenWindowReason: String,
    val goDecision: GoDecision,
    val wearAdvice: AdviceWithReasons,
    val gearAdvice: GearAdvice,
    val nowcast: NowcastState,
    val temperatureShock: ShockWarning?,
    val activityScores: List<ActivityScore>,
    val carWash: CarWashDecision?,
    val daylightInfo: DaylightInfo,
    val alerts: List<Alert>,
    // ... سایر فیلدها
)
```

## موتور قواعد

```kotlin
// domain/engine/DecisionEngine.kt
class DecisionEngine {
    fun evaluate(
        weather: WeatherData,
        profile: UserProfile,
        now: LocalDateTime
    ): DecisionOutput {
        // 1. محاسبه شرایط فعلی
        val current = buildCurrentConditions(weather, now)
        
        // 2. محاسبه ریسک ساعتی
        val hourlyRisk = calculateAllHourRisks(weather, profile)
        
        // 3. پیدا کردن پنجره طلایی
        val goldenWindow = findGoldenWindow(hourlyRisk, weather.daily[0], profile)
        
        // 4. تصمیم خروج
        val goDecision = calculateGoDecision(goldenWindow, hourlyRisk, profile)
        
        // 5. سایر محاسبات...
        
        return DecisionOutput(
            current = current,
            hourlyRisk = hourlyRisk,
            goldenWindow = goldenWindow,
            goDecision = goDecision,
            // ...
        )
    }
}
```

## تست با Fixtures

از فایل `test-fixtures.json` برای تست استفاده کنید:

```kotlin
// domain/engine/DecisionEngineTest.kt
@Test
fun `sunny day scenario`() {
    val fixture = loadFixture("sunny-day")
    
    val result = engine.evaluate(
        weather = fixture.input.weather.toWeatherData(),
        profile = fixture.input.profile.toUserProfile(),
        now = fixture.input.now.toLocalDateTime()
    )
    
    assertEquals(fixture.expected.goldenWindow?.start, result.goldenWindow?.start?.format())
    assertEquals(fixture.expected.goDecision, result.goDecision.action.name)
}
```

## شبکه

```kotlin
// data/remote/OpenMeteoApi.kt
interface OpenMeteoApi {
    @GET("v1/forecast")
    suspend fun getForecast(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("timezone") timezone: String,
        @Query("hourly") hourly: String,
        @Query("daily") daily: String,
        @Query("minutely_15") minutely15: String,
        @Query("past_days") pastDays: Int,
        @Query("forecast_days") forecastDays: Int
    ): OpenMeteoResponse
}
```

## ذخیره‌سازی

```kotlin
// data/local/WeatherCache.kt
class WeatherCache @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore
    
    suspend fun saveWeather(data: WeatherData) {
        dataStore.edit { prefs ->
            prefs[WEATHER_KEY] = data.toJson()
            prefs[CACHED_AT_KEY] = System.currentTimeMillis()
        }
    }
    
    suspend fun getWeather(): WeatherData? {
        val prefs = dataStore.data.first()
        val cachedAt = prefs[CACHED_AT_KEY] ?: return null
        
        // TTL 15 دقیقه
        if (System.currentTimeMillis() - cachedAt > 15 * 60 * 1000) {
            return null
        }
        
        return prefs[WEATHER_KEY]?.toWeatherData()
    }
}
```

## تاریخ شمسی

```kotlin
// util/DateUtils.kt
object DateUtils {
    fun toJalali(date: LocalDate): JalaliDate {
        // استفاده از کتابخانه com.github.mfathi91:persian-date-time
        return date.toPersianDate()
    }
    
    fun formatJalali(date: LocalDate): String {
        val jalali = toJalali(date)
        return "${jalali.day} ${jalali.monthName} ${jalali.year}"
    }
}
```

## ویجت اندروید

```kotlin
// presentation/widget/SkyChiWidget.kt
@GlanceAppWidget
class SkyChiWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val engine = DecisionEngine()
        val decision = engine.evaluate(weather, profile, LocalDateTime.now())
        
        provideContent {
            SkyChiWidgetContent(decision)
        }
    }
}

@Composable
fun SkyChiWidgetContent(decision: DecisionOutput) {
    Column {
        Text("پنجره طلایی: ${decision.goldenWindow?.format()}")
        Text("تصمیم: ${decision.goDecision.message}")
    }
}
```

## اعلان‌ها

```kotlin
// presentation/notification/NotificationScheduler.kt
class NotificationScheduler @Inject constructor(
    private val context: Context
) {
    fun scheduleGoldenWindowNotification(time: LocalDateTime) {
        val workRequest = OneTimeWorkRequestBuilder<GoldenWorker>()
            .setInitialDelay(Duration.between(LocalDateTime.now(), time))
            .build()
        
        WorkManager.getInstance(context).enqueue(workRequest)
    }
}
```

## چک‌لیست انتقال

- [ ] ایجاد ماژول `:domain` با engine و model
- [ ] پیاده‌سازی همه فرمول‌ها مطابق `ENGINE.md`
- [ ] تست با `test-fixtures.json` (حداقل ۱۰ سناریو)
- [ ] ایجاد ماژول `:data` با API و cache
- [ ] پیاده‌سازی Repository pattern
- [ ] ایجاد ماژول `:app` با UI
- [ ] پیاده‌سازی Jetpack Compose UI
- [ ] ایجاد ویجت با Glance
- [ ] پیاده‌سازی اعلان‌ها با WorkManager
- [ ] تست روی دستگاه‌های مختلف

---

**مهم**: همه فرمول‌ها باید دقیقاً مطابق `ENGINE.md` پیاده‌سازی شوند. از `test-fixtures.json` برای اطمینان از صحت استفاده کنید.
