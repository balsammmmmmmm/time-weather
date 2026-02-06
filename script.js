/* ================== CONFIG & CONSTANTS ================== */
const CONFIG = {
  location: { lat: 30.3960, lon: -86.2288, name: "Santa Rosa Beach", zip: "32459" },
  timezones: { local: "auto", astana: "Asia/Almaty" },
  updateIntervals: { clock: 1000, weather: 10 * 60 * 1000, currency: 12 * 60 * 60 * 1000 },
  cacheDurations: { weather: 10 * 60 * 1000, stocks: 24 * 60 * 60 * 1000 },
  apis: {
    weather: `https://api.open-meteo.com/v1/forecast?latitude=30.3960&longitude=-86.2288&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,visibility,windspeed_10m,winddirection_10m&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=16&timezone=auto`,
    airQuality: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.3960&longitude=-86.2288&hourly=pm10,pm2_5&current=us_aqi&timezone=auto`,
    currency: `https://api.exchangerate.host/live?access_key=0d2423dc29bc1192277645ddbd5dd643&currencies=KZT,XAU`,
    stocks: `https://api.marketstack.com/v1/eod/latest?access_key=af15321c571265eb73ed531cd3a79538&symbols=SPY,VOO`
  }
};

/* ================== DOM ELEMENT CACHE ================== */
const DOM = {
  time: document.getElementById("time"),
  date: document.getElementById("date"),
  iPhoneTime: document.getElementById("iphone-time"),
  iPhoneDate: document.getElementById("iphone-date"),
  astanaDateTime: document.getElementById("astana-datetime"),
  
  mainTemp: document.getElementById("main-temp"),
  sideTemp: document.getElementById("side-temp"),
  iPhoneTemp: document.getElementById("iphone-temp"),
  iPhoneSub: document.getElementById("iphone-sub"),
  weatherDesc: document.getElementById("weather-desc"),
  weatherIcon: document.getElementById("weather-icon"),
  feels: document.getElementById("feels"),
  visibility: document.getElementById("visibility"),
  wind: document.getElementById("wind"),
  humidityBox: document.getElementById("humidity-box"),
  aqiBox: document.getElementById("aqi-box"),
  lastUpdate: document.getElementById("last-update"),
  refreshBtn: document.getElementById("refresh-btn"),
  forecast: document.getElementById("forecast"),
  
  usdKzt: document.getElementById("usd-kzt"),
  xauUsd: document.getElementById("xau-usd"),
  currencySource: document.getElementById("currency-source"),
  
  spy: document.getElementById("spy"),
  spyChg: document.getElementById("spy-chg"),
  gold: document.getElementById("gold"),
  goldChg: document.getElementById("gold-chg")
};

/* ================== AQI MAPPING (Consolidated) ================== */
const AQI_MAPPING = {
  pm25: [
    { max: 12, aqi: 50, category: 'Good', color: '#10b981' },
    { max: 35.4, aqi: 100, category: 'Moderate', color: '#eab308' },
    { max: 55.4, aqi: 150, category: 'Unhealthy for Sensitive', color: '#f97316' },
    { max: 150.4, aqi: 200, category: 'Unhealthy', color: '#ef4444' },
    { max: 250.4, aqi: 300, category: 'Very Unhealthy', color: '#a855f7' },
    { max: Infinity, aqi: 500, category: 'Hazardous', color: '#7f1d1d' }
  ],
  usAqi: [
    { max: 50, category: 'Good', color: '#10b981' },
    { max: 100, category: 'Moderate', color: '#eab308' },
    { max: 150, category: 'Unhealthy for Sensitive', color: '#f97316' },
    { max: 200, category: 'Unhealthy', color: '#ef4444' },
    { max: 300, category: 'Very Unhealthy', color: '#a855f7' },
    { max: Infinity, category: 'Hazardous', color: '#7f1d1d' }
  ]
};

function pm25ToAqi(pm25) {
  for (let range of AQI_MAPPING.pm25) {
    if (pm25 <= range.max) {
      const prevRange = AQI_MAPPING.pm25[AQI_MAPPING.pm25.indexOf(range) - 1] || { max: 0, aqi: 0 };
      const ratio = (pm25 - prevRange.max) / (range.max - prevRange.max);
      const aqi = Math.round(prevRange.aqi + ratio * (range.aqi - prevRange.aqi));
      return { aqi, category: range.category, color: range.color };
    }
  }
}

function getAqiInfo(value) {
  for (let range of AQI_MAPPING.usAqi) {
    if (value <= range.max) return { category: range.category, color: range.color };
  }
}

/* ================== WEATHER CODE MAP ================== */
const WEATHER_MAP = {
  0: ['Clear', 'sun'], 1: ['Mainly clear', 'sun'], 2: ['Partly cloudy', 'cloud'], 3: ['Overcast', 'cloud'],
  45: ['Fog', 'cloud'], 48: ['Depositing rime fog', 'cloud'], 51: ['Light drizzle', 'cloud-drizzle'],
  52: ['Moderate drizzle', 'cloud-drizzle'], 53: ['Dense drizzle', 'cloud-rain'], 56: ['Freezing drizzle', 'cloud-rain'],
  57: ['Dense freezing drizzle', 'cloud-rain'], 61: ['Slight rain', 'cloud-rain'], 63: ['Moderate rain', 'cloud-rain'],
  65: ['Heavy rain', 'cloud-rain'], 66: ['Freezing rain', 'cloud-rain'], 67: ['Heavy freezing rain', 'cloud-rain'],
  71: ['Slight snow', 'cloud-snow'], 73: ['Moderate snow', 'cloud-snow'], 75: ['Heavy snow', 'cloud-snow'],
  77: ['Snow grains', 'cloud-snow'], 80: ['Slight rain showers', 'cloud-rain'], 81: ['Moderate rain showers', 'cloud-rain'],
  82: ['Violent rain showers', 'cloud-rain'], 85: ['Slight snow showers', 'cloud-snow'], 86: ['Heavy snow showers', 'cloud-snow'],
  95: ['Thunderstorm', 'cloud-lightning'], 96: ['Thunderstorm w/ slight hail', 'cloud-lightning'],
  99: ['Severe thunderstorm', 'cloud-lightning']
};

/* ================== CACHE UTILITIES ================== */
function getCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const data = JSON.parse(cached);
    return Date.now() - data.timestamp < data.duration ? data.value : null;
  } catch (e) { return null; }
}

function setCache(key, value, duration) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now(), duration }));
  } catch (e) { console.warn('Cache write failed', e); }
}

/* ================== CLOCK ================== */
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  
  DOM.time.textContent = timeStr;
  DOM.iPhoneTime.textContent = timeStr;
  DOM.date.textContent = dateStr;
  DOM.iPhoneDate.textContent = dateStr;
}

function updateAstanaTime() {
  const now = new Date();
  const options = { timeZone: CONFIG.timezones.astana, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
  DOM.astanaDateTime.textContent = now.toLocaleString('en-US', options);
}

setInterval(updateClock, CONFIG.updateIntervals.clock);
setInterval(updateAstanaTime, CONFIG.updateIntervals.clock);
updateClock();
updateAstanaTime();

/* ================== HELPER: Find Nearest Hourly Index ================== */
function findNearestHourlyIndex(hourlyTimes, targetTime) {
  const idx = hourlyTimes.indexOf(targetTime);
  if (idx !== -1) return idx;
  
  const targetMs = new Date(targetTime).getTime();
  let minDiff = Infinity, nearest = 0;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const diff = Math.abs(new Date(hourlyTimes[i]).getTime() - targetMs);
    if (diff < minDiff) { minDiff = diff; nearest = i; }
  }
  return nearest;
}


/* ================== WEATHER + AQI ================== */
let forceRefresh = false;
let lastUpdateTime = null;

function updateLastUpdateTime() {
  lastUpdateTime = new Date();
  const timeStr = lastUpdateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (DOM.lastUpdate) DOM.lastUpdate.textContent = `Updated: ${timeStr}`;
}

function manualRefresh() {
  forceRefresh = true;
  loadWeatherAndAQI();
  loadStocks();
}

async function loadWeatherAndAQI() {
  try {
    const cached = getCache('weather_cache');
    if (cached && !forceRefresh) {
      displayWeather(cached.weather);
      displayAQI(cached.aqi);
      return;
    }

    const [rWeather, rAir] = await Promise.allSettled([
      fetch(CONFIG.apis.weather, { cache: 'no-store' }),
      fetch(CONFIG.apis.airQuality, { cache: 'no-store' })
    ]);

    if (!rWeather || rWeather.status !== 'fulfilled' || !rWeather.value.ok) throw new Error('Weather fetch failed');
    const weatherData = await rWeather.value.json();
    displayWeather(weatherData);

    let aqiData = null;
    if (rAir && rAir.status === 'fulfilled' && rAir.value.ok) {
      try {
        aqiData = await rAir.value.json();
        displayAQI(aqiData);
      } catch (err) { console.warn('Air parse failed', err); }
    }

    setCache('weather_cache', { weather: weatherData, aqi: aqiData }, CONFIG.cacheDurations.weather);
    updateLastUpdateTime();
    forceRefresh = false;
  } catch (err) {
    console.error('Weather load error', err);
    setErrorFallback();
  }
}

function displayWeather(data) {
  const cw = data.current_weather || {};
  const temp = cw.temperature;
  const windspeed = cw.windspeed;
  const winddir = cw.winddirection;

  const hIdx = data.hourly && data.hourly.time ? findNearestHourlyIndex(data.hourly.time, cw.time) : 0;

  DOM.mainTemp.textContent = (typeof temp === 'number') ? `${Math.round(temp)}°` : '--°';
  DOM.sideTemp.textContent = (typeof temp === 'number') ? `${Math.round(temp)}°C` : '--°';
  DOM.iPhoneTemp.textContent = (typeof temp === 'number') ? `${Math.round(temp)}°C` : '--°';
  DOM.feels.textContent = (data.hourly?.apparent_temperature?.[hIdx] !== undefined) ? `${Math.round(data.hourly.apparent_temperature[hIdx])}°C` : '--°C';
  DOM.visibility.textContent = (data.hourly?.visibility?.[hIdx] !== undefined) ? `${(data.hourly.visibility[hIdx]/1000).toFixed(1)} km` : '-- km';
  DOM.wind.textContent = (typeof windspeed === 'number') ? `${Math.round(windspeed)} m/s ${winddir}°` : '--';
  DOM.humidityBox.textContent = (data.hourly?.relativehumidity_2m?.[hIdx] !== undefined) ? `${Math.round(data.hourly.relativehumidity_2m[hIdx])}%` : '--%';

  const code = cw.weathercode;
  const info = WEATHER_MAP[code] || ['Unknown', 'cloud'];
  DOM.weatherDesc.textContent = info[0];
  DOM.weatherIcon.innerHTML = `<i data-feather="${info[1]}" width="48" height="48"></i>`;
  if (typeof feather !== 'undefined') feather.replace();

  if (data.daily?.time && Array.isArray(data.daily.time)) {
    const forecastHtml = Array.from({ length: 6 })
      .map((_, idx) => {
        const i = idx + 2;
        if (i >= data.daily.time.length) return '';
        const dateStr = new Date(data.daily.time[i]).toLocaleDateString(undefined, { weekday: 'short' });
        const max = Math.round(data.daily.temperature_2m_max[i]);
        const min = Math.round(data.daily.temperature_2m_min[i]);
        const wcode = data.daily.weathercode?.[i] || 0;
        const info2 = WEATHER_MAP[wcode] || ['Clear', 'sun'];
        return `<div class="thin-border rounded-lg p-3 text-center"><div class="text-sm text-black mb-2 font-bold">${dateStr}</div><div class="my-2"><i data-feather="${info2[1]}" width="32" height="32" class="mx-auto"></i></div><div class="text-lg font-medium">${max}°</div><div class="text-sm text-black font-bold">${min}°</div></div>`;
      })
      .join('');
    DOM.forecast.innerHTML = forecastHtml;
    if (typeof feather !== 'undefined') feather.replace();
  }
}

function displayAQI(data) {
  let aqiValue = null, aqiCat = '', aqiColor = '';

  if (data?.current?.us_aqi !== undefined) {
    aqiValue = data.current.us_aqi;
    const info = getAqiInfo(aqiValue);
    aqiCat = info.category;
    aqiColor = info.color;
  } else if (data?.hourly?.pm2_5) {
    const cw = data.current_weather || {};
    const hIdx = data.hourly.time ? findNearestHourlyIndex(data.hourly.time, cw.time) : 0;
    const pm25 = data.hourly.pm2_5[hIdx];
    if (typeof pm25 === 'number') {
      const aqiObj = pm25ToAqi(pm25);
      aqiValue = aqiObj.aqi;
      aqiCat = aqiObj.category;
      aqiColor = aqiObj.color;
    }
  }

  if (aqiValue !== null) {
    DOM.aqiBox.textContent = `${aqiValue} · ${aqiCat}`;
    DOM.aqiBox.style.color = aqiColor;
  } else {
    DOM.aqiBox.textContent = '—';
    DOM.aqiBox.style.color = '';
  }
}

function setErrorFallback() {
  DOM.weatherDesc.textContent = 'Weather Unavailable';
  DOM.mainTemp.textContent = '--°';
  DOM.iPhoneTemp.textContent = '--°';
  DOM.sideTemp.textContent = '--°';
  DOM.humidityBox.textContent = '--%';
  DOM.feels.textContent = '--°C';
  DOM.visibility.textContent = '-- km';
  DOM.wind.textContent = '--';
  DOM.aqiBox.textContent = '—';
}

loadWeatherAndAQI();
setInterval(loadWeatherAndAQI, CONFIG.updateIntervals.weather);

/* ================== CURRENCY ================== */
async function loadCurrency(retries = 1) {
  try {
    const r = await fetch(CONFIG.apis.currency);
    if (r.ok) {
      const j = await r.json();
      if (j?.quotes) {
        const usdKzt = j.quotes.USDKZT;
        const usdXau = j.quotes.USDXAU;
        
        if (typeof usdKzt === 'number') DOM.usdKzt.textContent = `$1.00 = ${usdKzt.toFixed(2)}₸`;
        if (typeof usdXau === 'number' && usdXau > 0) {
          DOM.xauUsd.textContent = `XAU = $${(1 / usdXau).toFixed(2)}`;
        } else {
          DOM.xauUsd.textContent = 'XAU = $ -';
        }
        DOM.currencySource.textContent = "Source: exchangerate.host";
        return;
      }
    }
  } catch (e) { console.warn('Currency fetch failed', e); }

  if (retries > 0) {
    setTimeout(() => loadCurrency(retries - 1), 1500);
  } else {
    DOM.usdKzt.textContent = '$ 1 = - ₸';
    DOM.xauUsd.textContent = 'XAU = $ -';
    DOM.currencySource.textContent = "Source: unavailable";
  }
}

loadCurrency();
setInterval(loadCurrency, CONFIG.updateIntervals.currency);

/* ================== STOCKS (Single Display Function) ================== */
function displayStockData(stocks) {
  const displayStock = (symbol, priceId, chgId) => {
    if (stocks?.[symbol]) {
      const s = stocks[symbol];
      document.getElementById(priceId).textContent = s.price ? s.price.toFixed(2) : '—';
      const chgText = s.changePercent ? `${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%` : '—';
      const chgEl = document.getElementById(chgId);
      chgEl.textContent = chgText;
      chgEl.style.color = s.changePercent >= 0 ? '#10b981' : '#ef4444';
    } else {
      document.getElementById(priceId).textContent = '—';
      document.getElementById(chgId).textContent = 'unavailable';
    }
  };
  
  displayStock('SPY', 'spy', 'spy-chg');
  displayStock('VOO', 'gold', 'gold-chg');
}

async function loadStocks() {
  const cached = getCache('stock_cache');
  if (cached) {
    console.log('Using cached stock data');
    displayStockData(cached);
    return;
  }

  try {
    const r = await fetch(CONFIG.apis.stocks);
    if (!r.ok) throw new Error(`Marketstack returned ${r.status}`);

    const j = await r.json();
    if (!j?.data) throw new Error('Invalid response');

    const result = {};
    j.data.forEach(stock => {
      const changePercent = stock.close && stock.open ? ((stock.close - stock.open) / stock.open * 100) : null;
      result[stock.symbol] = { price: stock.close || stock.adj_close, changePercent };
    });

    displayStockData(result);
    setCache('stock_cache', result, CONFIG.cacheDurations.stocks);
  } catch (err) {
    console.warn('Stock load error', err);
    DOM.spy.textContent = '—';
    DOM.spyChg.textContent = 'error';
    DOM.gold.textContent = '—';
    DOM.goldChg.textContent = 'error';
  }
}

loadStocks();

/* ================== Icon initialization ================== */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof feather !== 'undefined') feather.replace();
  
  // Setup refresh button
  if (DOM.refreshBtn) {
    DOM.refreshBtn.addEventListener('click', manualRefresh);
  }
  
  // Show initial update time
  updateLastUpdateTime();
});