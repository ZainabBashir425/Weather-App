type WeatherData = {
  cod: string | number;
  name: string;
  main: { temp: number; humidity: number; feels_like: number };
  wind: { speed: number };
  weather: { description: string; icon: string }[];
};

type ForecastItem = {
  dt: number;
  main: { temp: number };
  weather: { icon: string }[];
};
// at top, before apiKey:
type AppState = "loading" | "success" | "error";

let unit: "metric" | "imperial" =
  (localStorage.getItem("unit") as "metric" | "imperial") || "metric";
let theme: "light" | "dark" =
  (localStorage.getItem("theme") as "light" | "dark") || "dark";

// Grab toggles
const unitToggle = document.getElementById("unitToggle") as HTMLButtonElement;

const body = document.getElementById("bodyBg") as HTMLBodyElement;
const borderedEls = document.querySelectorAll(".border");
console.log(borderedEls);
function applyTheme() {
  // add/remove the dark class on <body>
  if (theme === "dark") {
    body.classList.add("dark", "text-white");
    body.style.backgroundImage = "url('img/background.jpg')";
    borderedEls.forEach((el) => {
      el.classList.add("border-white/20");
      el.classList.remove("border-black/20");
    });
  } else {
    body.classList.remove("dark", "text-white");
    body.style.backgroundImage = "url('img/light-bg.jpg')";

    borderedEls.forEach((el) => {
      el.classList.remove("border-white/20");
      el.classList.add("border-black/20");
    });
  }
}
// initial apply
applyTheme();

const themeToggle = document.getElementById("themeToggle") as HTMLButtonElement;

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  applyTheme();
});

// Toggle events
unitToggle.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  localStorage.setItem("unit", unit);
  getWeather(); // reload current weather
});

const apiKey = "ad891715cf80764c70a2841294d34f99";

const cityInput = document.getElementById("city") as HTMLInputElement;
const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;

searchBtn.addEventListener("click", getWeather);

function getWeather(): void {
  const city = cityInput.value.trim() || localStorage.getItem("lastCity") || "";
  if (!city) {
    alert("Please enter a city");
    return;
  }

  // save city to LocalStorage
  

  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`;

  // show loading state
  const tempDivInfo = document.getElementById("temp-div")!;
  tempDivInfo.innerHTML = `<p class="text-base py-5">Loading...</p>`;

  // if offline, show cached data
  if (!navigator.onLine) {
    const cached = localStorage.getItem("weatherCache");
    if (cached) {
      const parsed = JSON.parse(cached) as {
        current: WeatherData;
        forecast: ForecastItem[];
      };
      displayWeather(parsed.current);
      displayHourlyForecast(parsed.forecast);
      displayDailyForecast(parsed.forecast);
      return;
    } else {
      alert("You are offline and no cached data is available.");
      return;
    }
  }

  Promise.all([
    fetch(currentWeatherUrl).then((res) => res.json()),
    fetch(forecastUrl).then((res) => res.json()),
  ])
    .then(([current, forecast]) => {
      if (current.cod === "404") {
        displayWeather(current); // will show not found
      } else {
        displayWeather(current);
        displayHourlyForecast(forecast.list as ForecastItem[]);
        displayDailyForecast(forecast.list as ForecastItem[]);
        localStorage.setItem("lastCity", city);
        // cache results
        localStorage.setItem(
          "weatherCache",
          JSON.stringify({ current, forecast: forecast.list })
        );
      }
    })
    .catch(() => {
      alert("Error fetching weather data. Please try again.");
    });
}

function displayWeather(data: WeatherData): void {
  const tempDivInfo = document.getElementById("temp-div")!;
  const weatherInfoDiv = document.getElementById("weather-info")!;
  const weatherContainer = document.getElementById(
    "weather-container"
  ) as HTMLDivElement;
  const weatherIcon = document.getElementById(
    "weather-icon"
  ) as HTMLImageElement;
  const hourlyForecastDiv = document.getElementById("hourly-forecast")!;
  const weatherDetailsDiv = document.querySelector(
    ".weather-details"
  ) as HTMLDivElement;
  const notFoundDiv = document.querySelector(".not-found") as HTMLDivElement;
  const dailyForecastDiv = document.getElementById("daily-forecast")!;

  dailyForecastDiv.innerHTML = "";
  tempDivInfo.innerHTML = "";
  weatherInfoDiv.innerHTML = "";
  hourlyForecastDiv.innerHTML = "";
  weatherDetailsDiv.innerHTML = "";
  notFoundDiv.innerHTML = "";

  if (data.cod === "404") {
    weatherContainer.classList.remove("h-[880px]");
    weatherContainer.classList.add("h-[420px]");
    notFoundDiv.innerHTML = `
      <div>
        <img src="img/404.png" alt="" class="mx-auto w-2/3">
        <p class="text-lg font-medium mt-3">Oops! Location not found.</p>
      </div>`;
    weatherIcon.src = "";
    weatherIcon.classList.add("hidden");
  } else {
    weatherContainer.classList.remove("h-[420px]");
    weatherContainer.classList.add("h-[880px]");
    const cityName = data.name;
    const temperature = Math.round(data.main.temp); // now direct °C or °F
    const description = data.weather[0]?.description;
    const humidity = data.main.humidity;
    const wind = Math.round(data.wind.speed);
    const iconCode = data.weather[0]?.icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    const feelLike = data.main.feels_like;

    const unitSymbol = unit === "metric" ? "°C" : "°F";
    const windUnit = unit === "metric" ? "Km/h" : "mph";

    tempDivInfo.innerHTML = `<p>${temperature}${unitSymbol}</p>`;
    weatherInfoDiv.innerHTML = `<p>${cityName}</p><p>${description}</p><p>Feels Like ${feelLike}${unitSymbol}</p>`;

    weatherDetailsDiv.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fa-solid fa-water sm:text-2xl text-lg"></i>
        <div>
          <span class="sm:text-xl text-base font-semibold">${humidity}%</span>
          <p class="text-sm">Humidity</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <i class="fa-solid fa-wind sm:text-2xl text-lg"></i>
        <div>
          <span class="sm:text-xl text-base font-semibold">${wind}${windUnit}</span>
          <p class="text-sm">Wind Speed</p>
        </div>
      </div>
    `;

    weatherIcon.src = iconUrl;
    weatherIcon.alt = description || "icon";
    weatherIcon.classList.remove("hidden");
  }
}

window.addEventListener("load", () => {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity) {
    cityInput.value = lastCity;
    getWeather(); // auto-fetch
  }
});

function displayHourlyForecast(hourlyData: ForecastItem[]): void {
  const hourlyForecastDiv = document.getElementById("hourly-forecast")!;
  hourlyForecastDiv.innerHTML = "";
  const next24Hours = hourlyData.slice(0, 8);
  const unitSymbol = unit === "metric" ? "°C" : "°F";

  next24Hours.forEach((item) => {
    const dateTime = new Date(item.dt * 1000);
    const hour = dateTime.getHours();
    const temperature = Math.round(item.main.temp);
    const iconCode = item.weather[0]?.icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

    hourlyForecastDiv.innerHTML += `
      <div class="flex flex-col items-center w-20">
        <span>${hour}:00</span>
        <img src="${iconUrl}" alt="Hourly Weather Icon" class="w-8 h-8 mb-1">
        <span>${temperature}${unitSymbol}</span>
      </div>
    `;
  });
}

function displayDailyForecast(hourlyData: ForecastItem[]): void {
  const dailyForecastDiv = document.getElementById("daily-forecast")!;
  dailyForecastDiv.innerHTML = "";

  // group 3-hourly data into days
  const days: Record<string, ForecastItem[]> = {};
  hourlyData.forEach((item) => {
    const dateObj = new Date(item.dt * 1000);
    const date = dateObj.toISOString().split("T")[0];
    if (typeof date === "string" && date) {
      if (!days[date]) days[date] = [];
      days[date].push(item);
    }
  });
  // build daily forecast from grouped data
  const dailyData = Object.entries(days).map(
    ([date, items]: [string, ForecastItem[]]) => {
      const temps = items.map((i) => i.main.temp);
      const min = Math.min(...temps);
      const max = Math.max(...temps);
      const middleIndex = Math.floor(items.length / 2);
      const icon = items[middleIndex]?.weather[0]?.icon;
      return { date, min, max, icon };
    }
  );

  const unitSymbol = unit === "metric" ? "°C" : "°F";
  // render each day card
  dailyData
    .slice(1, 8)
    .forEach(
      (day: {
        date: string;
        min: number;
        max: number;
        icon: string | undefined;
      }) => {
        const dayName = new Date(day.date).toLocaleDateString("en-US", {
          weekday: "short",
        });
        const iconUrl = day.icon
          ? `https://openweathermap.org/img/wn/${day.icon}.png`
          : "";

        dailyForecastDiv.innerHTML += `
      <div class="flex flex-col items-center rounded-lg py-3 px-1  min-w-[85px]">
        <span class="text-sm">${dayName}</span>
        <img src="${iconUrl}" alt="Daily Icon" class="w-10 h-10">
        <span class="text-xs">${Math.round(
          day.max
        )}${unitSymbol} / ${Math.round(day.min)}${unitSymbol}</span>
      </div>
    `;
      }
    );
}
