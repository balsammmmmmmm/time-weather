// PM2.5 (µg/m³) to AQI converter and color mapping
function pm25ToAqi(pm25) {
    // US EPA AQI breakpoints for PM2.5 (24-hour avg)
    if (pm25 <= 12) return { aqi: Math.round(pm25 / 12 * 50), category: 'Good', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)' };
    if (pm25 <= 35.4) return { aqi: Math.round(50 + (pm25 - 12) / 23.4 * 50), category: 'Moderate', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.2)' };
    if (pm25 <= 55.4) return { aqi: Math.round(100 + (pm25 - 35.4) / 20 * 50), category: 'Unhealthy for Sensitive', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.2)' };
    if (pm25 <= 150.4) return { aqi: Math.round(150 + (pm25 - 55.4) / 95 * 50), category: 'Unhealthy', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)' };
    if (pm25 <= 250.4) return { aqi: Math.round(200 + (pm25 - 150.4) / 100 * 50), category: 'Very Unhealthy', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.2)' };
    return { aqi: 500, category: 'Hazardous', color: '#7f1d1d', bgColor: 'rgba(127, 29, 29, 0.4)' };
}

// Clock Functionality
function updateClock() {
    const now = new Date();
    
    // Time
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('time').textContent = `${hours}:${minutes}`;
    
    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);
}

// Weather Functionality
async function fetchWeather() {
    try {
        // Use fixed coordinates for Santa Rosa Beach, FL
        const LAT = 30.3938;
        const LON = -86.2683;
        // Fetch weather data from Open-Meteo (no API key required)
        const urlWeather = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const rWeather = await fetch(urlWeather, {cache: 'no-store'});
        if (!rWeather.ok) throw new Error('Open-Meteo request failed: ' + rWeather.status);
        const d = await rWeather.json();

        // Fetch air quality from Open-Meteo Air Quality API
        const urlAir = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.396&longitude=-86.2288&hourly=pm10,pm2_5&current=us_aqi&timezone=America%2FChicago`;
        let air = null;
        try {
            const rAir = await fetch(urlAir, {cache: 'no-store'});
            if (rAir.ok) air = await rAir.json();
        } catch (e) {
            air = null;
        }

        // Small mapping from Open-Meteo weathercode -> [label, feather-icon]
        const OM = {
            0: ['Clear', 'sun'],
            1: ['Mainly clear', 'sun'],
            2: ['Partly cloudy', 'cloud'],
            3: ['Overcast', 'cloud'],
            45: ['Fog', 'cloud'],
            48: ['Depositing rime fog', 'cloud'],
            51: ['Light drizzle', 'cloud-rain'],
            52: ['Moderate drizzle', 'cloud-rain'],
            53: ['Dense drizzle', 'cloud-rain'],
            56: ['Freezing drizzle', 'cloud-rain'],
            57: ['Dense freezing drizzle', 'cloud-rain'],
            61: ['Slight rain', 'cloud-rain'],
            63: ['Moderate rain', 'cloud-rain'],
            65: ['Heavy rain', 'cloud-rain'],
            66: ['Freezing rain', 'cloud-rain'],
            67: ['Heavy freezing rain', 'cloud-rain'],
            71: ['Slight snow', 'cloud-snow'],
            73: ['Moderate snow', 'cloud-snow'],
            75: ['Heavy snow', 'cloud-snow'],
            77: ['Snow grains', 'cloud-snow'],
            80: ['Slight rain showers', 'cloud-rain'],
            81: ['Moderate rain showers', 'cloud-rain'],
            82: ['Violent rain showers', 'cloud-rain'],
            85: ['Slight snow showers', 'cloud-snow'],
            86: ['Heavy snow showers', 'cloud-snow'],
            95: ['Thunderstorm', 'cloud-lightning'],
            96: ['Thunderstorm w/ slight hail', 'cloud-lightning'],
            99: ['Severe thunderstorm', 'cloud-lightning']
        };

        const cw = d.current_weather || {};
        const code = cw.weathercode;
        const info = OM[code] || ['Unknown', 'cloud'];

        // Update DOM with weather data (fixed location label, no coordinates)
        const elLocation = document.getElementById('location'); if (elLocation) elLocation.textContent = 'Santa Rosa Beach, FL';
        const elTemp = document.getElementById('temperature'); if (elTemp) elTemp.textContent = (typeof cw.temperature === 'number') ? `${Math.round(cw.temperature)}°` : '--°';
        const elDesc = document.getElementById('weather-description'); if (elDesc) elDesc.textContent = info[0];

            // Also populate mobile temperature/icon if present
            const mobileTemp = document.getElementById('mobile-temperature');
            const mobileIconWrap = document.getElementById('mobile-weather-icon');
            if (mobileTemp) mobileTemp.textContent = (typeof cw.temperature === 'number') ? `${Math.round(cw.temperature)}°` : '--°';
            if (mobileIconWrap) {
                // clear then insert the same feather icon
                mobileIconWrap.innerHTML = '';
                const mi = document.createElement('i');
                mi.setAttribute('data-feather', info[1]);
                mobileIconWrap.appendChild(mi);
            }

        // Humidity / wind / feels-like / visibility / air quality
        const elHum = document.getElementById('humidity');
        const elWind = document.getElementById('wind');
        const elFeels = document.getElementById('feels-like');
        const elVis = document.getElementById('visibility');
        const elAir = document.getElementById('air-quality');
        const aqiEl = document.getElementById('air-quality-aqi');

        if (elWind) elWind.textContent = (typeof cw.windspeed === 'number') ? `${Math.round(cw.windspeed)} km/h` : '-- km/h';

        let hIdx = 0;
        if (d.hourly && Array.isArray(d.hourly.time)) {
            if (cw && cw.time) {
                hIdx = d.hourly.time.indexOf(cw.time);
                if (hIdx === -1) {
                    // find closest hour
                    const cwMs = new Date(cw.time).getTime();
                    let minDiff = Infinity;
                    for (let i=0;i<d.hourly.time.length;i++){
                        const tMs = new Date(d.hourly.time[i]).getTime();
                        const diff = Math.abs(tMs - cwMs);
                        if (diff < minDiff) { minDiff = diff; hIdx = i; }
                    }
                }
            }

            // humidity
            const humArr = d.hourly.relativehumidity_2m;
            if (humArr && humArr.length > hIdx && elHum) elHum.textContent = `${Math.round(humArr[hIdx])}%`;

            // apparent temperature (feels-like)
            const appArr = d.hourly.apparent_temperature;
            if (appArr && appArr.length > hIdx && elFeels) elFeels.textContent = `${Math.round(appArr[hIdx])}°`;

            // visibility (meters -> km)
            const visArr = d.hourly.visibility;
            if (visArr && visArr.length > hIdx && elVis) {
                const v = visArr[hIdx];
                if (typeof v === 'number') {
                    const km = (v / 1000);
                    elVis.textContent = `${Math.round(km*10)/10} km`;
                }
            }
        } else {
            if (elHum) elHum.textContent = '--%';
            if (elFeels) elFeels.textContent = '--°';
            if (elVis) elVis.textContent = '-- km';
        }

        // Air quality (отдельный fetch)
        let aqiValue = null, aqiCat = '', aqiColor = '', aqiBg = '';
        if (air && air.current && typeof air.current.us_aqi === 'number') {
            aqiValue = air.current.us_aqi;
            // Категория и цвет по EPA
            if (aqiValue <= 50) { aqiCat = 'Good'; aqiColor = '#10b981'; aqiBg = 'rgba(16,185,129,0.2)'; }
            else if (aqiValue <= 100) { aqiCat = 'Moderate'; aqiColor = '#eab308'; aqiBg = 'rgba(234,179,8,0.2)'; }
            else if (aqiValue <= 150) { aqiCat = 'Unhealthy for Sensitive'; aqiColor = '#f97316'; aqiBg = 'rgba(249,115,22,0.2)'; }
            else if (aqiValue <= 200) { aqiCat = 'Unhealthy'; aqiColor = '#ef4444'; aqiBg = 'rgba(239,68,68,0.2)'; }
            else if (aqiValue <= 300) { aqiCat = 'Very Unhealthy'; aqiColor = '#a855f7'; aqiBg = 'rgba(168,85,247,0.2)'; }
            else { aqiCat = 'Hazardous'; aqiColor = '#7f1d1d'; aqiBg = 'rgba(127,29,29,0.4)'; }
        } else if (air && air.hourly && air.hourly.pm2_5 && Array.isArray(air.hourly.pm2_5)) {
            // Найти ближайший час к текущему
            let idx = 0;
            if (air.hourly.time && Array.isArray(air.hourly.time) && cw && cw.time) {
                idx = air.hourly.time.indexOf(cw.time);
                if (idx === -1) idx = 0;
            }
            const pm25 = air.hourly.pm2_5[idx];
            if (typeof pm25 === 'number') {
                const aqiObj = pm25ToAqi(pm25);
                aqiValue = aqiObj.aqi;
                aqiCat = aqiObj.category;
                aqiColor = aqiObj.color;
                aqiBg = aqiObj.bgColor;
            }
        }
        if (elAir) {
            if (aqiValue !== null) {
                elAir.textContent = `${aqiValue}`;
                // Use only text color to indicate AQI; avoid colored background
                elAir.style.color = aqiColor;
                elAir.style.background = '';
            } else {
                elAir.textContent = '—';
                elAir.style.color = '';
                elAir.style.background = '';
            }
        }
        if (aqiEl) aqiEl.textContent = aqiCat || '';

        // Update weather icon
        const icon = document.getElementById('weather-icon');
        if (icon) {
            icon.innerHTML = '';
            const ii = document.createElement('i');
            ii.setAttribute('data-feather', info[1]);
            icon.appendChild(ii);
        }

        // ensure mobile icon renders if present
        if (typeof feather !== 'undefined') feather.replace();

        // Build forecast array from Open-Meteo daily fields
        const forecastDays = [];
        if (d.daily && Array.isArray(d.daily.time)) {
            const times = d.daily.time;
            for (let i = 0; i < times.length; i++) {
                forecastDays.push({
                    date: times[i],
                    weathercode: d.daily.weathercode ? d.daily.weathercode[i] : null,
                    max: d.daily.temperature_2m_max ? d.daily.temperature_2m_max[i] : null,
                    min: d.daily.temperature_2m_min ? d.daily.temperature_2m_min[i] : null,
                    sunrise: d.daily.sunrise ? d.daily.sunrise[i] : null,
                    sunset: d.daily.sunset ? d.daily.sunset[i] : null
                });
            }
        }

        displayForecast(forecastDays, OM);
        feather.replace();
    } catch (error) {
        console.error('Error fetching weather:', error);
        // Show friendly messages in the existing UI elements (safe)
        const elDesc = document.getElementById('weather-description'); if (elDesc) elDesc.textContent = 'Weather Unavailable';
        const elLocation = document.getElementById('location'); if (elLocation) elLocation.textContent = 'Santa Rosa Beach, FL';
        const elTemp = document.getElementById('temperature'); if (elTemp) elTemp.textContent = '--°';
        const elHum = document.getElementById('humidity'); if (elHum) elHum.textContent = '--%';
        const elWind = document.getElementById('wind'); if (elWind) elWind.textContent = '-- km/h';
        const elFeels = document.getElementById('feels-like'); if (elFeels) elFeels.textContent = '--°';
        const elVis = document.getElementById('visibility'); if (elVis) elVis.textContent = '-- km';
        const elAir = document.getElementById('air-quality'); if (elAir) elAir.textContent = '—';

        const forecastContainer = document.getElementById('forecast-container');
        if (forecastContainer) {
            forecastContainer.innerHTML = `
                <div class="col-span-1 sm:col-span-2 md:col-span-7 p-6 text-center bg-gray-700 bg-opacity-50 rounded-xl">
                    <div class="mb-3"><i data-feather="alert-triangle" class="text-yellow-400 w-8 h-8 inline-block"></i></div>
                    <div class="font-semibold">Weather data unavailable</div>
                    <div class="text-sm opacity-80 mb-3">Check API key or network. Click to retry.</div>
                    <button onclick="fetchWeather()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Retry</button>
                </div>
            `;
            feather.replace();
        }
    }
}

// Display forecast in the UI
function displayForecast(forecastDays, omMap) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const container = document.getElementById('forecast-container');
    if (!container) return;
    container.innerHTML = '';
    forecastDays.forEach(dayData => {
        const date = new Date(dayData.date);
        const dayName = days[date.getDay()];
        const code = dayData.weathercode;
        const info = omMap && omMap[code] ? omMap[code] : ['Unknown', 'cloud'];
        const temp = (dayData.max !== null && dayData.min !== null) ? Math.round((dayData.max + dayData.min) / 2) : null;
        const tempText = temp !== null ? `${temp}°` : '--°';

        const forecastItem = document.createElement('div');
        forecastItem.className = 'bg-gray-700 bg-opacity-50 p-4 rounded-xl text-center';
        forecastItem.innerHTML = `
            <p class="font-semibold">${dayName}</p>
            <div class="my-3">
                <i data-feather="${info[1]}" class="w-8 h-8 mx-auto"></i>
            </div>
            <p class="text-xl font-semibold">${tempText}</p>
            <p class="text-sm opacity-80">${info[0]}</p>
        `;
        container.appendChild(forecastItem);
    });
    feather.replace();
}

// Initialize and update once DOM is ready to avoid null element errors
document.addEventListener('DOMContentLoaded', () => {
    // Safe update helpers
    const safeText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

    // Start clock
    updateClock();
    setInterval(() => {
        try { updateClock(); } catch (e) { console.error('Clock update failed:', e); }
    }, 1000);

    // Initial weather fetch (safe)
    (async () => {
        try {
            await fetchWeather();
        } catch (err) {
            console.error('Initial weather fetch failed:', err);
            safeText('weather-description', 'Weather unavailable');
        }
    })();

    // On load also copy temperature/icon into mobile block in case CSS shows it
    const copyMobileFromMain = () => {
        const mainTemp = document.getElementById('temperature');
        const mobileTemp = document.getElementById('mobile-temperature');
        const mainIcon = document.getElementById('weather-icon');
        const mobileIconWrap = document.getElementById('mobile-weather-icon');
        if (mainTemp && mobileTemp) mobileTemp.textContent = mainTemp.textContent;
        if (mainIcon && mobileIconWrap) {
            mobileIconWrap.innerHTML = mainIcon.innerHTML;
            if (typeof feather !== 'undefined') feather.replace();
        }
    };
    copyMobileFromMain();

    // Periodic weather updates (30 minutes)
    setInterval(() => {
        fetchWeather().catch(e => console.error('Periodic weather fetch failed:', e));
    }, 1800000);

    // Add animation class to elements if present
    const elements = document.querySelectorAll('#time, #date, #location, #temperature, #weather-icon');
    elements.forEach(el => { if (el) el.classList.add('animate-fade'); });
});