// ============================================================
// اسکای‌چی نسخه ۲.۰ — خطاهای تایپ‌شده
// ============================================================

export class SkyChiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkyChiError';
  }
}

export class NetworkError extends SkyChiError {
  constructor() {
    super('اتصال به اینترنت برقرار نیست.');
    this.name = 'NetworkError';
  }
}

export class ServerError extends SkyChiError {
  constructor(status: number) {
    super(`سرور هواشناسی پاسخ نداد (کد: ${status}). لطفاً چند دقیقه دیگر تلاش کن.`);
    this.name = 'ServerError';
  }
}

export class ParseError extends SkyChiError {
  constructor() {
    super('خطا در پردازش داده.');
    this.name = 'ParseError';
  }
}

export class NoDataError extends SkyChiError {
  constructor(hour?: number) {
    const msg = hour
      ? `داده کافی برای ساعت ${hour}:00 در دسترس نیست.`
      : 'داده کافی در دسترس نیست.';
    super(msg);
    this.name = 'NoDataError';
  }
}
