// Clock Function
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    document.getElementById('time').textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById('date').textContent = `${day}, ${date}`;
}

// Weather Function
async function fetchWeather() {
    const city = 'London'; // Change this to your city
    const apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=en`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const cityElement = document.getElementById('city');
        const tempElement = document.getElementById('temp');
        const descElement = document.getElementById('desc');

        cityElement.textContent = data.name;
        tempElement.textContent = Math.round(data.main.temp) + '°C';
        descElement.textContent = data.weather[0].description;

    } catch (error) {
        console.error('Weather fetch failed:', error);
        document.getElementById('city').textContent = 'Error loading weather';
        document.getElementById('temp').textContent = '—°C';
        document.getElementById('desc').textContent = 'Check your API key';
    }
}

// Initialize
function init() {
    updateClock();
    setInterval(updateClock, 1000); // Update every second
    fetchWeather(); // Load weather once
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
