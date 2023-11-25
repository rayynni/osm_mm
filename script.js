document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([51.505, -0.09], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const defaultIcon = L.icon({
        iconUrl: 'default-icon.png',
        iconSize: [30, 35],
        iconAnchor: [15, 0]
    });

    const clickedIcon = L.icon({
        iconUrl: 'clicked-icon.png',
        iconSize: [30, 35],
        iconAnchor: [15, 0]
    });

    let cityMarkers = {};

    function getIconForShopType(type) {
        switch (type) {
            case 'Bubble tea shop':
                return 'bubble_tea.png';
            case 'Bubble Citea':
                return 'bubble_citea.png';
            case 'Mooboo':
                return 'mooboo.png';
            case 'Costa':
                return 'costa.png';
            case 'Starbucks':
                return 'starbucks.png';
            case 'McDonalds':
                return 'mcdonalds.png';
        }
    }

    fetch('cities.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(city => {
                var cityMarker = L.marker([city.Latitude, city.Longitude], {icon: defaultIcon}).addTo(map);
                var popupContent = `<span style="color: #307dee; font-weight: bold; font-size: 16px;">${city.CityName}</span><br>
                <span style="color: #000000; font-weight: bold; font-size: 13px;">Pop: ${city['Population 2021']}</span><br>
                <span style="color: #000000; font-weight: bold; font-size: 13px;">Bubble tea shop: ${city['Bubble tea shop']}</span><br>
                Increase ratio: ${(city['Population Increase/Decrease Ratio Comparing to 2011'] * 100).toFixed(2)}%<br>
                Female: ${(city['Female Ratio'] * 100).toFixed(2)}%<br>
                age 10-39: ${(city['10-39 Young People Radio'] * 100).toFixed(2)}%<br>
                age 50+: ${(city['50+ Old People Ratio'] * 100).toFixed(2)}%<br>
                White: ${(city['White Ratio'] * 100).toFixed(2)}%<br>
                Asian: ${(city['Asian Ratio'] * 100).toFixed(2)}%<br>
                Muslim: ${(city['Muslim Ratio'] * 100).toFixed(2)}%<br>
                Bubble Citea: ${city['Bubble Citea']}<br>
                Costa: ${city['Costa']}<br>
                Mooboo: ${city['Mooboo']}<br>
                McDonalds: ${city['McDonalds']}<br>
                Starbucks: ${city['Starbucks']}`;

                cityMarker.bindPopup(popupContent);

                cityMarker.on('mouseover', function () {
                    cityMarker.openPopup();
                });
                cityMarker.on('mouseout', function () {
                    cityMarker.closePopup();
                });

                cityMarkers[city.CityName] = {
                    marker: cityMarker,
                    shopsVisible: false,
                    isSelected: false
                };

                cityMarker.on('click', function () {
                    cityMarker.setZIndexOffset(1000);
                    toggleShopsForCity(city.CityName)
                });

            });
        });

    function toggleShopsForCity(CityName) {
        var city = cityMarkers[CityName];
        if (city.isSelected) {
            // 如果城市已被选中，则取消选中，切换回默认图标，并隐藏商店信息
            city.marker.setIcon(defaultIcon);
            city.isSelected = false;
            hideShopsForCity(CityName);
        } else {
            // 如果城市未被选中，则选中它，切换到点击后图标，并显示商店信息
            city.marker.setIcon(clickedIcon);
            city.isSelected = true;
            showShopsForCity(CityName);
        }
    }

    function showShopsForCity(cityName) {
        var city = cityMarkers[cityName];
        city.shopMarkers = city.shopMarkers || [];

        fetch('shops.json')
            .then(response => response.json())
            .then(shops => {
                shops.forEach(shop => {
                    if (shop.City === cityName) {
                        var iconUrl = getIconForShopType(shop['Shop Type']);
                        var shopMarker = L.marker([shop.Latitude, shop.Longitude], {
                            icon: L.icon({
                                iconUrl: iconUrl,
                                iconSize: [25, 25],
                                iconAnchor: [12, 0]
                            })
                        }).addTo(map);
                        shopMarker.bindPopup(shop['Shop Type']);
                        city.shopMarkers.push(shopMarker);

                    }
                });
            });
    }

    function hideShopsForCity(cityName) {
        var city = cityMarkers[cityName];
        if (city && city.shopMarkers) {
            city.shopMarkers.forEach(marker => map.removeLayer(marker));
            city.shopMarkers = [];
        }
    }


    document.getElementById('applyFilters').addEventListener('click', function () {
        var populationLimit = document.getElementById('populationRange').value;
        var selectedShopTypes = Array.from(document.getElementsByClassName('shopType'))
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        filterCities(populationLimit);
        filterShops(selectedShopTypes);
    });

    function filterCities(limit) {
        for (var city in cityMarkers) {
            if (cityMarkers.hasOwnProperty(city)) {
                var population = cityMarkers[city].population; // 确保您的cityMarkers对象有population属性
                if (population <= limit) {
                    cityMarkers[city].marker.addTo(map);
                } else {
                    cityMarkers[city].marker.remove();
                }
            }
        }
    }

    function filterShops(types) {
        for (var city in cityMarkers) {
            if (cityMarkers.hasOwnProperty(city)) {
                var cityObj = cityMarkers[city];
                if (cityObj.shopMarkers) {
                    cityObj.shopMarkers.forEach(shopMarker => {
                        if (types.includes(shopMarker.shopType)) { // 确保每个shopMarker有shopType属性
                            shopMarker.addTo(map);
                        } else {
                            shopMarker.remove();
                        }
                    });
                }
            }
        }
    }
});
