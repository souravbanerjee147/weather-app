document.addEventListener('DOMContentLoaded', function () {

    //====================== next 5 days weather forecast=========================//
    const config = {
        apiKey: 'cc516ed66cd051a653b30c0a0dfca56f', // openweathermap API key
        url: 'https://api.openweathermap.org/data/2.5',    
        units: 'metric',
        recentSearchesKey: 'weatherRecentSearches',
        maxRecentSearches: 5
    };

    //====================== default location =======================================//
    let state = {
        currentCity: 'Kolkata',
        currentUnit: 'metric',
        recentSearche: JSON.parse(localStorage.getItem(config.recentSearchesKey)) || [],
        isCelsius: true
    };

    //(============================) DOM Elements ============================//
    const elements = {
        cityInput: document.getElementById('city'),
        searchBtn: document.getElementById('searchBtn'),
        locationBtn: document.getElementById('locationBtn'),
        unitToggle: document.getElementById('unit'),
        currentCity: document.getElementById('currentCity'),
        currentDate: document.getElementById('currentDate'),
        currentTemp: document.getElementById('currentTemp'),
        tempUnit: document.getElementById('tempUnit'),
        weatherIcon: document.getElementById('weatherIcon'),
        weatherDesc: document.getElementById('weatherDesc'),
        windSpeed: document.getElementById('windSpeed'),
        humidity: document.getElementById('humidity'),
        weatherAlert: document.getElementById('weatherAlert'),
        alertMessage: document.getElementById('alertMessage'),
        forecastContainer: document.getElementById('forecastContainer'),
        recentSearchesDiv: document.getElementById('recentSearche'),
        clearHistory: document.getElementById('clearHistory'),
        loading: document.getElementById('loading'),
        errorDisplay: document.getElementById('errorDisplay'),
        errorMessage: document.getElementById('errorMessage'),
        retryBtn: document.getElementById('retryBtn'),
        dayDetails: document.getElementById('dayDetails'),
        detailsDay: document.getElementById('detailsDay'),
        tempHigh: document.getElementById('tempHigh'),
        tempLow: document.getElementById('tempLow'),
        tempFeels: document.getElementById('tempFeels'),
        windSpeedDetail: document.getElementById('windSpeedDetail'),
        windDir: document.getElementById('windDir'),
        windGust: document.getElementById('windGust'),
        humidityDetail: document.getElementById('humidityDetail'),
        pressure: document.getElementById('pressure'),
        visibility: document.getElementById('visibility'),
        sunrise: document.getElementById('sunrise'),
        sunset: document.getElementById('sunset'),
        dayLength: document.getElementById('dayLength'),
        weatherDescription: document.getElementById('weatherDescription'),
        closeDetails: document.getElementById('closeDetails')

    };

    //========================= initialize ============================//
    init();

    //(=======================) event listeners ========================//
    elements.searchBtn.addEventListener('click', searchByCity);
    elements.cityInput.addEventListener('keypress', function (event) {   
        if (event.key === 'Enter') searchByCity(); 
    });
    elements.locationBtn.addEventListener('click', getLocationWeather);
    elements.unitToggle.addEventListener('click', toggleTemperatureUnit);
    elements.clearHistory.addEventListener('click', clearRecentSearches);
    elements.retryBtn.addEventListener('click', function () {
        weatherData(state.currentCity);       
    });

    elements.closeDetails.addEventListener('click', function () {
        elements.dayDetails.classList.add('hidden');
    });


    function init() {
        updateRecentSearchesUI();
        weatherData(state.currentCity);
    }

    function searchByCity() {
        const city = elements.cityInput.value.trim();

        if (!city) {
            showError('Enter Your City');       
            return;
        }

        weatherData(city);
        addToRecentSearches(city);
        elements.cityInput.value = '';
    }

    function getLocationWeather() {
        if (!navigator.geolocation) {
            showError('Geolocation is not supported by your browser');
            return;
        }

        showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const data = await fetch(`${config.url}/weather?lat=${latitude}&lon=${longitude}&appid=${config.apiKey}&units=${state.currentUnit}`);
                    const weatherData = await data.json();

                    if (weatherData.cod === 200) {
                        const cityName = weatherData.name;
                        updateWeatherUI(weatherData);
                        fetchForecastData(latitude, longitude);
                        addToRecentSearches(cityName);
                    } else {
                        showError('Unable to weather report of your location');   
                    }
                } catch (error) {
                    showError('Failed to fetch location weather');
                }
            },
            (error) => {
                showError('Unable to get your location Please enable location services.');      
            }
        );
    }

    async function weatherData(city) {
        showLoading();

        try {
            const response = await fetch(
                `${config.url}/weather?q=${encodeURIComponent(city)}&appid=${config.apiKey}&units=${state.currentUnit}`
            );
            const data = await response.json();

            if (data.cod === 200) {
                updateWeatherUI(data);
                fetchForecastData(data.coord.lat, data.coord.lon);
            } else {
                showError(`City not found: "${city}". Please check spelling.`);
            }
        } catch (error) {
            showError('Network Error. Please check your internet');     
        }
    }

    async function fetchForecastData(lat, lon) {
        try {
            const response = await fetch(
                `${config.url}/forecast?lat=${lat}&lon=${lon}&appid=${config.apiKey}&units=${state.currentUnit}`
            );
            const data = await response.json();

            if (data.cod === '200') {
                updateForecastUI(data.list);
                hideLoading();
            }
        } catch (error) {
            showError('Fail to load weather report');    
        }
    }
    //================= updatation ===================//
    function updateWeatherUI(data) {
        //city and date
        state.currentCity = data.name;
        elements.currentCity.textContent = data.name;
        elements.currentDate.textContent = formatDate(new Date());

        console.log('Updating UI with data:', data);

        window.currentWeatherData = data;

        //temperature
        const temp = Math.round(data.main.temp * 10) / 10;
        elements.currentTemp.textContent = temp;
        checkExtremeTemperature(temp);

        //description and icon
        const description = data.weather[0].description;
        elements.weatherDesc.textContent = description.charAt(0).toUpperCase() + description.slice(1);
        updateWeatherIcon(data.weather[0].main);
        updateBackground(data.weather[0].main);

        //wind and humidity
        elements.windSpeed.textContent = `${data.wind.speed} `;
        elements.humidity.textContent = `${data.main.humidity}`;

        //units
        elements.tempUnit.textContent = state.isCelsius ? '°C' : '°F';
    }


    // daywise details
    function updateForecastUI(forecastList) {
        elements.forecastContainer.innerHTML = '';

        window.forecastData = forecastList;        

        //forecast per day
        const dailyForecasts = [];
        for (let i = 0; i < forecastList.length; i += 8) {
            if (dailyForecasts.length < 5) {
                dailyForecasts.push(forecastList[i]);
            }
        }

        //forecast cards
        dailyForecasts.forEach((forecast, index) => {
            const date = new Date(forecast.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const card = document.createElement('div');
            card.className = 'forecastCard bg-gray-50 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-50 transition duration-200';
            card.dataset.index = index * 8; // stores the original index
            card.innerHTML = `
            <p class="font-medium text-gray-800 mb-2">${dayName}, ${monthDay}</p>
            <div class="text-4xl text-blue-500 mb-3">
                ${getWeatherIcon(forecast.weather[0].main)}
            </div>
            <p class="text-2xl font-bold text-gray-800 mb-1">
                ${Math.round(forecast.main.temp)}${state.isCelsius ? '°C' : '°F'}
            </p>
            <div class="flex justify-between text-sm text-gray-600 mt-3">
                <div>
                    <i class="fas fa-wind mr-1"></i>
                    <span>${forecast.wind.speed} ${state.currentUnit === 'metric' ? 'M/S' : 'MPH'}</span>
                </div>
                <div>
                    <i class="fas fa-tint mr-1"></i>
                    <span>${forecast.main.humidity}%</span>
                </div>
            </div>
        `;

            // weather details button
            card.addEventListener('click', function () {
                showDayDetails(forecast, date);
            });

            elements.forecastContainer.appendChild(card);
        });
    }



    // forcast of the day
    function showDayDetails(forecastData, date) {

        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const fullDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        elements.detailsDay.textContent = `${dayName}, ${fullDate}`;

        //temperature details
        elements.tempHigh.textContent = `${Math.round(forecastData.main.temp_max)}${state.isCelsius ? '°C' : '°F'}`;
        elements.tempLow.textContent = `${Math.round(forecastData.main.temp_min)}${state.isCelsius ? '°C' : '°F'}`;
        elements.tempFeels.textContent = `${Math.round(forecastData.main.feels_like)}${state.isCelsius ? '°C' : '°F'}`;

        //wind details
        elements.windSpeedDetail.textContent = `${forecastData.wind.speed} ${state.currentUnit === 'metric' ? 'M/S' : 'MPH'}`;
        elements.windDir.textContent = `${forecastData.wind.deg || '--'}°`;
        elements.windGust.textContent = `${forecastData.wind.gust || forecastData.wind.speed} ${state.currentUnit === 'metric' ? 'M/S' : 'MPH'}`;

        //humidity & pressure details
        elements.humidityDetail.textContent = `${forecastData.main.humidity}%`;
        elements.pressure.textContent = `${forecastData.main.pressure} hPa`;
        elements.visibility.textContent = `${(forecastData.visibility / 1000).toFixed(1)} km`;

        //current weather
        if (window.currentWeatherData) {
            const sunriseTime = new Date(window.currentWeatherData.sys.sunrise * 1000);
            const sunsetTime = new Date(window.currentWeatherData.sys.sunset * 1000);

            elements.sunrise.textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            elements.sunset.textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            //day length
            const dayLengthMs = sunsetTime - sunriseTime;
            const dayLengthHours = (dayLengthMs / (1000 * 60 * 60)).toFixed(1);
            elements.dayLength.textContent = `${dayLengthHours} hrs`;
        } else {
            elements.sunrise.textContent = '--:--';
            elements.sunset.textContent = '--:--';
            elements.dayLength.textContent = '-- hrs';
        }

        //weather description
        const description = forecastData.weather[0].description;
        elements.weatherDescription.textContent = description.charAt(0).toUpperCase() + description.slice(1);

        //details section
        elements.dayDetails.classList.remove('hidden');

        // Scroll dowen view
        elements.dayDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }


    // weather detail elements
    function updateWeatherIcon(weatherCondition) {
        const iconMap = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-rain',
            'Snow': 'fa-snowflake',
            'Thunderstorm': 'fa-bolt',
            'Drizzle': 'fa-cloud-rain',
            'Mist': 'fa-smog',
            'Smoke': 'fa-smog',
            'Haze': 'fa-smog',
            'Dust': 'fa-smog',
            'Fog': 'fa-smog',
            'Sand': 'fa-smog',
            'Ash': 'fa-smog',
            'Squall': 'fa-wind',
            'Tornado': 'fa-tornado'
        };

        const iconClass = iconMap[weatherCondition] || 'fa-cloud';
        elements.weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    }

    function getWeatherIcon(weatherCondition) {
        const iconMap = {
            'Clear': '<i class="fas fa-sun"></i>',
            'Clouds': '<i class="fas fa-cloud"></i>',
            'Rain': '<i class="fas fa-cloud-rain"></i>',
            'Snow': '<i class="fas fa-snowflake"></i>',
            'Thunderstorm': '<i class="fas fa-bolt"></i>',
            'Drizzle': '<i class="fas fa-cloud-rain"></i>',
            'Mist': '<i class="fas fa-smog"></i>',
            'Fog': '<i class="fas fa-smog"></i>'
        };

        return iconMap[weatherCondition] || '<i class="fas fa-cloud"></i>';
    }

    function updateBackground(weatherCondition) {
        
        document.body.classList.remove('rainyBackground', 'sunnyBackground', 'cloudyBackground', 'snowyBackground');

        
        const bgClasses = {
            'Rain': 'rainyBackground',
            'Clear': 'sunnyBackground',
            'Clouds': 'cloudyBackground',
            'Snow': 'snowyBackground',
            'Thunderstorm': 'rainyBackground'
        };

        const bgClass = bgClasses[weatherCondition];
        if (bgClass) {
            document.body.classList.add(bgClass);
        }
    }

    function checkExtremeTemperature(temp) {
        const threshold = state.isCelsius ? 40 : 104;

        if (temp > threshold) {
            elements.alertMessage.textContent = `Temperature is above ${threshold}°${state.isCelsius ? 'C' : 'F'}. Stay hydrated!`;
            elements.weatherAlert.classList.remove('hidden');
        } else {
            elements.weatherAlert.classList.add('hidden');
        }
    }

    function toggleTemperatureUnit() {
        state.isCelsius = !state.isCelsius;
        state.currentUnit = state.isCelsius ? 'metric' : 'imperial';

        elements.unitToggle.innerHTML = state.isCelsius
            ? '<i class="fas fa-thermometer-half"></i><span>Switch to °F</span>'
            : '<i class="fas fa-thermometer-half"></i><span>Switch to °C</span>';

        elements.tempUnit.textContent = state.isCelsius ? '°C' : '°F';

        //current temperature convertion
        const currentTemp = parseFloat(elements.currentTemp.textContent);
        const convertedTemp = state.isCelsius
            ? ((currentTemp - 32) * 5 / 9).toFixed(1)
            : (currentTemp * 9 / 5 + 32).toFixed(1);

        elements.currentTemp.textContent = convertedTemp;

        weatherData(state.currentCity);
    }

    function addToRecentSearches(city) {

        state.recentSearche = state.recentSearche.filter(item => item !== city);

        state.recentSearche.unshift(city);

        if (state.recentSearche.length > config.maxRecentSearches) {
            state.recentSearche.pop();
        }

        //===================== Save to localStorage ==================//
        localStorage.setItem(config.recentSearchesKey, JSON.stringify(state.recentSearche));

        updateRecentSearchesUI();
    }

    function updateRecentSearchesUI() {
        elements.recentSearchesDiv.innerHTML = '';

        if (state.recentSearche.length === 0) {
            elements.recentSearchesDiv.innerHTML = '<p class="text-gray-500 text-center py-2">No recent searches</p>';
            return;
        }

        state.recentSearche.forEach(city => {
            const item = document.createElement('div');
            item.className = 'recentItem flex items-center justify-between p-2 rounded hover:bg-gray-100 mb-1';
            item.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-history text-gray-400 mr-3"></i>
                    <span class="text-gray-700">${city}</span>
                </div>
                <i class="fas fa-chevron-right text-gray-400"></i>
            `;

            item.addEventListener('click', () => {
                weatherData(city);
                elements.cityInput.value = '';
            });

            elements.recentSearchesDiv.appendChild(item);
        });
    }

    function clearRecentSearches() {
        if (state.recentSearche.length === 0) return;

        if (confirm('Clear all recent searches?')) {
            state.recentSearche = [];
            localStorage.removeItem(config.recentSearchesKey);
            updateRecentSearchesUI();
        }
    }

    function showLoading() {
        elements.loading.classList.remove('hidden');
        elements.errorDisplay.classList.add('hidden');
        elements.forecastContainer.classList.add('hidden');
    }

    // day detail (hide/unhide)
    function hideLoading() {
    elements.loading.classList.add('hidden');
    elements.errorDisplay.classList.add('hidden');
    elements.forecastContainer.classList.remove('hidden');
    elements.dayDetails.classList.add('hidden'); 
}

    // error massages
    function showError(message) {
        elements.loading.classList.add('hidden');
        elements.errorDisplay.classList.remove('hidden');
        elements.forecastContainer.classList.add('hidden');
        elements.errorMessage.textContent = message;
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});