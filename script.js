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
        let latitude, longitude;
        
        // Try to get user's location, fallback to default if denied
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 60000
                });
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        } catch (geoError) {
            console.log('Using default location');
            // Default to Santa Rosa Beach, FL
            latitude = 30.3935;
            longitude = -86.2518;
        }
        // Fetch weather data from WeatherAPI
        const weatherResponse = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=5f5d5e5f5e5d5e5d5e5d5e5d5e5d5e5d&q=${latitude},${longitude}&days=7&aqi=no&alerts=no`);
        const weatherData = await weatherResponse.json();
        
        if (!weatherResponse.ok) {
            throw new Error(weatherData.error?.message || 'Failed to fetch weather data');
        }
        // Update DOM with weather data
        document.getElementById('location').textContent = `${weatherData.location.name}, ${weatherData.location.country}`;
        document.getElementById('temperature').textContent = `${Math.round(weatherData.current.temp_c)}°`;
        document.getElementById('weather-description').textContent = weatherData.current.condition.text;
        document.getElementById('humidity').textContent = `${weatherData.current.humidity}%`;
        document.getElementById('wind').textContent = `${Math.round(weatherData.current.wind_kph)} km/h`;
        document.getElementById('feels-like').textContent = `${Math.round(weatherData.current.feelslike_c)}°`;
        document.getElementById('visibility').textContent = `${weatherData.current.vis_km} km`;
        
        // Update weather icon
        const icon = document.getElementById('weather-icon');
        icon.innerHTML = '';
        const weatherIcon = getWeatherIcon(weatherData.current.condition.code, weatherData.current.is_day);
        icon.appendChild(weatherIcon);
        
        // Display forecast
        displayForecast(weatherData.forecast.forecastday);
feather.replace();
    } catch (error) {
        console.error('Error fetching weather:', error);
        const weatherSection = document.querySelector('.bg-gray-800.bg-opacity-70');
        weatherSection.innerHTML = `
            <div class="text-center p-8">
                <div class="w-20 h-20 mx-auto mb-4">
                    <i data-feather="alert-triangle" class="w-full h-full text-yellow-400"></i>
                </div>
                <h2 class="text-2xl font-bold mb-2">Weather Unavailable</h2>
                <p class="text-gray-300 mb-4">We couldn't fetch weather data at this time.</p>
                <button onclick="fetchWeather()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    <i data-feather="refresh-cw" class="inline mr-2"></i> Try Again
                </button>
            </div>
        `;
        feather.replace();
}
}
function getWeatherIcon(weatherCode, isDay) {
    const conditionMap = {
        1000: isDay ? 'sun' : 'moon', // Sunny/Clear
        1003: 'cloud', // Partly cloudy
        1006: 'cloud', // Cloudy
        1009: 'cloud', // Overcast
        1030: 'cloud', // Mist
        1063: 'cloud-rain', // Patchy rain
        1066: 'cloud-snow', // Patchy snow
        1069: 'cloud-snow', // Patchy sleet
        1072: 'cloud-rain', // Patchy freezing drizzle
        1087: 'cloud-lightning', // Thundery outbreaks
        1114: 'cloud-snow', // Blowing snow
        1117: 'cloud-snow', // Blizzard
        1135: 'cloud', // Fog
        1147: 'cloud', // Freezing fog
        1150: 'cloud-rain', // Patchy light drizzle
        1153: 'cloud-rain', // Light drizzle
        1168: 'cloud-rain', // Freezing drizzle
        1171: 'cloud-rain', // Heavy freezing drizzle
        1180: 'cloud-rain', // Patchy light rain
        1183: 'cloud-rain', // Light rain
        1186: 'cloud-rain', // Moderate rain
        1189: 'cloud-rain', // Heavy rain
        1192: 'cloud-rain', // Heavy rain
        1195: 'cloud-rain', // Heavy rain
        1198: 'cloud-rain', // Light freezing rain
        1201: 'cloud-rain', // Moderate/heavy freezing rain
        1204: 'cloud-snow', // Light sleet
        1207: 'cloud-snow', // Moderate/heavy sleet
        1210: 'cloud-snow', // Patchy light snow
        1213: 'cloud-snow', // Light snow
        1216: 'cloud-snow', // Patchy moderate snow
        1219: 'cloud-snow', // Moderate snow
        1222: 'cloud-snow', // Patchy heavy snow
        1225: 'cloud-snow', // Heavy snow
        1237: 'cloud-snow', // Ice pellets
        1240: 'cloud-rain', // Light rain shower
        1243: 'cloud-rain', // Moderate/heavy rain shower
        1246: 'cloud-rain', // Torrential rain shower
        1249: 'cloud-snow', // Light sleet showers
        1252: 'cloud-snow', // Moderate/heavy sleet showers
        1255: 'cloud-snow', // Light snow showers
        1258: 'cloud-snow', // Moderate/heavy snow showers
        1261: 'cloud-snow', // Light showers of ice pellets
        1264: 'cloud-snow', // Moderate/heavy showers of ice pellets
        1273: 'cloud-lightning', // Patchy light rain with thunder
        1276: 'cloud-lightning', // Moderate/heavy rain with thunder
        1279: 'cloud-lightning', // Patchy light snow with thunder
        1282: 'cloud-lightning' // Moderate/heavy snow with thunder
    };
    
    const i = document.createElement('i');
    i.setAttribute('data-feather', conditionMap[weatherCode] || 'cloud');
    return i;
}
// Display forecast in the UI
function displayForecast(forecastDays) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const container = document.getElementById('forecast-container');
    container.innerHTML = '';
    forecastDays.forEach(dayData => {
        const date = new Date(dayData.date);
const forecastItem = document.createElement('div');
        forecastItem.className = 'bg-gray-700 bg-opacity-50 p-4 rounded-xl text-center';
        forecastItem.innerHTML = `
            <p class="font-semibold">${days[date.getDay()]}</p>
            <div class="my-3">
                <i data-feather="${getWeatherIcon(dayData.day.condition.code, 1).getAttribute('data-feather')}" class="w-8 h-8 mx-auto"></i>
            </div>
            <p class="text-xl font-semibold">${Math.round(dayData.day.avgtemp_c)}°</p>
            <p class="text-sm opacity-80">${dayData.day.condition.text}</p>
`;
        container.appendChild(forecastItem);
    });
    
    feather.replace();
}

// Initialize and update regularly
updateClock();
setInterval(updateClock, 1000);
// Initial fetch with error handling
function initializeWeather() {
    try {
        fetchWeather();
    } catch (error) {
        console.error('Initial weather fetch failed:', error);
    }
}

// Initialize
initializeWeather();
// Update weather every 30 minutes
setInterval(fetchWeather, 1800000);
// Add animation class to elements
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('#time, #date, #location, #temperature, #weather-icon');
    elements.forEach(el => {
        el.classList.add('animate-fade');
    });
});