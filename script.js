document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const langSelect = document.getElementById('lang-select');

    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const dashboard = document.getElementById('weather-dashboard');

    // Current weather elements
    const cityNameEl = document.getElementById('city-name');
    const localTimeEl = document.getElementById('local-time');
    const tempEl = document.getElementById('temp');
    const weatherIconEl = document.getElementById('weather-icon');
    const weatherDescEl = document.getElementById('weather-desc');
    const feelsLikeEl = document.getElementById('feels-like');
    const windEl = document.getElementById('wind');
    const humidityEl = document.getElementById('humidity');
    const pressureEl = document.getElementById('pressure');
    const uvIndexEl = document.getElementById('uv-index');

    // Containers
    const hourlyContainer = document.getElementById('hourly-container');
    const dailyContainer = document.getElementById('daily-container');

    // Localization strings
    const translations = {
        ru: {
            appTitle: "Прогноз погоды",
            placeholder: "Поиск города...",
            loading: "Загрузка...",
            feelsLike: "Ощущается как",
            windUnit: "км/ч",
            pressureUnit: "мбар",
            uvLabel: "УФ-индекс:",
            hourlyTitle: "Прогноз на 24 часа",
            dailyTitle: "Прогноз на 3 дня",
            errorNotFound: "Город не найден или ошибка API.",
            errorNoData: "Нет данных для этого города."
        },
        en: {
            appTitle: "Weather App",
            placeholder: "Search city...",
            loading: "Loading...",
            feelsLike: "Feels like",
            windUnit: "km/h",
            pressureUnit: "mbar",
            uvLabel: "UV Index:",
            hourlyTitle: "24-Hour Forecast",
            dailyTitle: "3-Day Forecast",
            errorNotFound: "City not found or API error.",
            errorNoData: "No weather data found for this city."
        }
    };

    let currentLang = 'ru';

    function updateLanguage() {
        const t = translations[currentLang];
        document.getElementById('app-title').textContent = t.appTitle;
        cityInput.placeholder = t.placeholder;
        document.getElementById('loading-text').textContent = t.loading;
        document.getElementById('feels-like-label').textContent = t.feelsLike;
        document.getElementById('wind-unit').textContent = t.windUnit;
        document.getElementById('pressure-unit').textContent = t.pressureUnit;
        document.getElementById('uv-label').textContent = t.uvLabel;
        document.getElementById('hourly-title').textContent = t.hourlyTitle;
        document.getElementById('daily-title').textContent = t.dailyTitle;
        document.documentElement.lang = currentLang;
    }

    // Helper to format time "300" -> "03:00"
    function formatTime(timeStr) {
        if (timeStr === "0") return "00:00";
        let padded = timeStr.padStart(4, '0');
        return `${padded.substring(0, 2)}:00`;
    }

    // Helper to format Date
    function formatDate(dateStr, lang) {
        const date = new Date(dateStr);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', options);
    }

    // Helper to get description based on language
    function getDesc(weatherObj, lang) {
        if (lang === 'ru' && weatherObj.lang_ru && weatherObj.lang_ru.length > 0) {
            return weatherObj.lang_ru[0].value;
        }
        if (weatherObj.weatherDesc && weatherObj.weatherDesc.length > 0) {
            return weatherObj.weatherDesc[0].value;
        }
        return '';
    }

    async function fetchWeather(city) {
        try {
            dashboard.classList.add('hidden');
            errorDiv.classList.add('hidden');
            loadingDiv.classList.remove('hidden');

            const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=${currentLang}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(translations[currentLang].errorNotFound);
            }

            const data = await response.json();

            if (!data || !data.current_condition || data.current_condition.length === 0) {
                throw new Error(translations[currentLang].errorNoData);
            }

            renderWeather(data);

            loadingDiv.classList.add('hidden');
            dashboard.classList.remove('hidden');

        } catch (error) {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    }

    function renderWeather(data) {
        const current = data.current_condition[0];
        const area = data.nearest_area[0];

        // Current Main
        cityNameEl.textContent = `${area.areaName[0].value}, ${area.country[0].value}`;

        // Use device current time for "local time" display for simplicity,
        // or observation time from API
        const now = new Date();
        localTimeEl.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        tempEl.textContent = current.temp_C;
        weatherIconEl.src = current.weatherIconUrl[0].value;

        weatherDescEl.textContent = getDesc(current, currentLang);
        feelsLikeEl.textContent = current.FeelsLikeC;

        // Current Details
        windEl.textContent = current.windspeedKmph;
        humidityEl.textContent = current.humidity;
        pressureEl.textContent = current.pressure; // mbar
        uvIndexEl.textContent = current.uvIndex;

        // Hourly Forecast (Today)
        hourlyContainer.innerHTML = '';
        if (data.weather && data.weather.length > 0) {
            const todayHourly = data.weather[0].hourly;
            todayHourly.forEach(hour => {
                const item = document.createElement('div');
                item.className = 'hourly-item';

                const time = formatTime(hour.time);
                const icon = hour.weatherIconUrl[0].value;
                const temp = hour.tempC;

                item.innerHTML = `
                    <span class="h-time">${time}</span>
                    <img src="${icon}" class="h-icon" alt="icon">
                    <span class="h-temp">${temp}°</span>
                `;
                hourlyContainer.appendChild(item);
            });
        }

        // Daily Forecast (3 days)
        dailyContainer.innerHTML = '';
        if (data.weather) {
            data.weather.forEach(day => {
                const item = document.createElement('div');
                item.className = 'daily-item';

                const dateStr = formatDate(day.date, currentLang);

                // Use midday icon/desc as representative for the day
                const midday = day.hourly.find(h => h.time === "1200") || day.hourly[0];
                const icon = midday.weatherIconUrl[0].value;
                const desc = getDesc(midday, currentLang);

                const maxT = day.maxtempC;
                const minT = day.mintempC;

                item.innerHTML = `
                    <div class="d-date">${dateStr}</div>
                    <div class="d-icon-wrap">
                        <img src="${icon}" class="d-icon" alt="icon">
                        <span class="d-desc">${desc}</span>
                    </div>
                    <div class="d-temps">
                        <span class="t-max">${maxT}°</span>
                        <span class="t-min">${minT}°</span>
                    </div>
                `;
                dailyContainer.appendChild(item);
            });
        }
    }

    // Event Listeners
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

    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        updateLanguage();
        // Refetch weather if city is already entered
        const city = cityInput.value.trim();
        if (city && !dashboard.classList.contains('hidden')) {
            fetchWeather(city);
        }
    });

    // Initialize
    updateLanguage();
});