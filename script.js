// Get the clock element
const clockElement = document.getElementById('clock');

// Function to update the clock
function updateClock() {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    clockElement.innerText = `${hours}:${minutes}:${seconds}`;
}

// Update the clock every second
setInterval(updateClock, 1000);

// Get the weather elements
const temperatureElement = document.getElementById('weather-temp');
const descriptionElement = document.getElementById('weather-description');

// API endpoint for current weather
const apiEndpoint = 'https://api.openweathermap.org/data/2.5/weather';

// Function to get the current weather
function getCurrentWeather() {
    fetch(apiEndpoint, {
        params: {
            lat: 'YOUR_LATITUDE',
            lon: 'YOUR_LONGITUDE',
            units: 'metric',
            appid: 'YOUR_API_KEY',
        },
    })
        .then(response => response.json())
        .then(data => {
            const temperature = data.main.temp;
            const description = data.weather[0].description;

            temperatureElement.innerText = `${temperature}°C`;
            descriptionElement.innerText = description;
        });
}

// Get the current weather
getCurrentWeather();
