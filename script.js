document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const weatherInfoDiv = document.getElementById('weather-info');

    const cityNameEl = document.getElementById('city-name');
    const tempEl = document.getElementById('temp');
    const weatherDescEl = document.getElementById('weather-desc');
    const windEl = document.getElementById('wind');

    async function fetchWeather(city) {
        try {
            // Hide previous results and errors, show loading
            weatherInfoDiv.classList.add('hidden');
            errorDiv.classList.add('hidden');
            loadingDiv.classList.remove('hidden');

            const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);

            if (!response.ok) {
                throw new Error('City not found or API error. Please try again.');
            }

            const data = await response.json();

            if (!data || !data.current_condition || data.current_condition.length === 0) {
                throw new Error('No weather data found for this city.');
            }

            const current = data.current_condition[0];
            const area = data.nearest_area[0];

            // Update UI
            cityNameEl.textContent = `${area.areaName[0].value}, ${area.country[0].value}`;
            tempEl.textContent = current.temp_C;
            weatherDescEl.textContent = current.weatherDesc[0].value;
            windEl.textContent = `${current.windspeedKmph} km/h`;

            // Hide loading, show weather info
            loadingDiv.classList.add('hidden');
            weatherInfoDiv.classList.remove('hidden');

        } catch (error) {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    }

    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeather(city);
            }
        }
    });
});
