
// =========================================================================
// === служебные массивы для наших маркеров ===
// =========================================================================
const cats = ['buildings', 'landscape']; // категории
const combo = {
  buildings: L.layerGroup(), // контейнеры маркеров
  landscape: L.layerGroup()
};

const icons = {
  buildings: L.icon({
    iconUrl: 'icons/marker-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41]
  }),
  landscape: L.icon({
    iconUrl: 'icons/marker-violet.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41]
  })
};

// =========================================================================
// === карта + эскизы (блок «Sketch») ===
// =========================================================================
const b1 = L.latLngBounds([
  [43.4106095120387, 39.9510110116874],
  [43.4173891758609, 39.9654214892057]
]);
const b2 = L.latLngBounds([
  [43.3959172350356, 39.9829885612335],
  [43.4042764452028, 39.9922340692530]
]);

const map = L.map('map').fitBounds(b1, {
  padding: [40, 40]
});
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '© OSM, Carto'
}).addTo(map);

const sketch = L.layerGroup([
  L.imageOverlay('images/Masterplan1New.webp', b1, {
    opacity: .8
  }),
  L.imageOverlay('images/Masterplan2.webp', b2, {
    opacity: .8
  })
]).addTo(map); // Эскиз сразу добавляется на карту и будет включен по умолчанию

// transportRaster больше не будет частью слоя "Транспорт" в контроле,
// но его определение остается, если вдруг понадобится в будущем.
const transportRaster = L.layerGroup([
  L.imageOverlay('images/Transport1New.webp', b1, {
    opacity: .7
  }),
  L.imageOverlay('images/Transport2.webp', b2, {
    opacity: .7
  })
]);

// =========================================================================
// === транспорт-GEOJSON-группа (будет внутри «Транспорт») ===
// =========================================================================
const transportGroup = L.layerGroup(); // здесь 5 под-слоёв

// =========================================================================
// === Функции для загрузки GeoJSON слоев ===
// Изменены, чтобы возвращать созданный L.GeoJSON слой
// =========================================================================

// Функция для загрузки линейных GeoJSON
const loadLine = (url, color, weight = 2, extra = {}) => {
  return fetch(url) // Возвращаем промис
    .then((r) => r.json())
    .then((j) => {
      const geoJsonLayer = L.geoJSON(j, {
        style: {
          color: color,
          weight: weight,
          ...extra
        }
      });
      geoJsonLayer.addTo(transportGroup);
      return geoJsonLayer; // Возвращаем созданный слой
    })
    .catch((error) => {
      console.error(`Ошибка загрузки ${url}:`, error);
      return null; // Возвращаем null в случае ошибки
    });
};

// Функция для загрузки точечных GeoJSON
const loadPoint = (url, color, r = 6) => {
  return fetch(url) // Возвращаем промис
    .then((r) => r.json())
    .then((j) => {
      const geoJsonLayer = L.geoJSON(j, {
        pointToLayer: (_, ll) =>
          L.circleMarker(ll, {
            radius: r,
            // color: '#000', // Убрана черная обводка
            weight: 0, // Устанавливаем вес обводки в 0
            fillColor: color, // Цвет заливки
            fillOpacity: 0.9,
          }),
      });
      geoJsonLayer.addTo(transportGroup);
      return geoJsonLayer; // Возвращаем созданный слой
    })
    .catch((error) => {
      console.error(`Ошибка загрузки ${url}:`, error);
      return null; // Возвращаем null в случае ошибки
    });
};

// =========================================================================
// === Конфигурация и загрузка под-слоев транспорта (5 geojson) ===
// Исправлен порядок и привязка слоев к названиям
// =========================================================================

// Конфигурация слоев транспорта
const transportLayersConfig = [
  { name: '<span class="legend-icon" style="background:#00a4ff"></span> Велодорожки', url: 'data/bike.geojson', type: 'line', color: '#00a4ff', weight: 2.5, extra: {} },
  { name: '<span class="legend-icon" style="background:#ff66cc"></span> Остановки ОТ', url: 'data/busstop.geojson', type: 'point', color: '#ff66cc', radius: 5 },
  { name: '<span class="legend-icon" style="background:#ff0000"></span> Въезды/выезды', url: 'data/entrance.geojson', type: 'point', color: '#ff0000', radius: 5 },
  { name: '<span class="legend-icon" style="background:#666666"></span> Парковки', url: 'data/parking.geojson', type: 'line', color: '#666666', weight: 1, extra: { dashArray: '4 3' } },
  { name: '<span class="legend-icon" style="background:#8b4513"></span> Ж/д станции', url: 'data/railway2.geojson', type: 'point', color: '#8b4513', radius: 6 },
];

// Создаем массив промисов для загрузки всех слоев
const layerPromises = transportLayersConfig.map(config => {
  if (config.type === 'line') {
    return loadLine(config.url, config.color, config.weight, config.extra);
  } else if (config.type === 'point') {
    return loadPoint(config.url, config.color, config.radius);
  }
  return Promise.resolve(null); // На случай неизвестного типа
});

// Ждем загрузки всех слоев, прежде чем создавать контрол слоев
Promise.all(layerPromises)
  .then(loadedLayers => {
    // Теперь loadedLayers - это массив созданных L.GeoJSON слоев в том же порядке, что и transportLayersConfig
    const transportLayers = transportLayersConfig.map((config, index) => ({
      name: config.name,
      layer: loadedLayers[index] // Присваиваем фактический объект слоя
    }));

    // Функция для создания контрола слоев после загрузки всех данных
    const createSubCtrl = () => {
      const overlayMaps = {};
      transportLayers.forEach((item) => {
        if (item.layer) { // Добавляем только если слой успешно загружен
          overlayMaps[item.name] = item.layer;
        }
      });

      // === мини-контрол под-слоёв транспорта ===
      L.control
        .layers(null, overlayMaps, {
          collapsed: false,
          position: 'topright',
          sanitize: false,
        })
        .addTo(map);
    };

    createSubCtrl(); // Создаем контрол после того, как все слои готовы
  })
  .catch((error) => console.error('Ошибка загрузки данных для под-контрола:', error));


// =========================================================================
// === чек-боксы верхнего уровня (Sketch / Транспорт) ===
// =========================================================================
L.control.layers(
  null, {
    'Эскиз': sketch,
    'Транспорт': transportGroup // Теперь слой "Транспорт" содержит только GeoJSON слои
  }, {
    collapsed: false // Контрол будет открыт по умолчанию
  }
).addTo(map);

// =========================================================================
// === загрузка ОПИСАНИЙ-точек (маркеры Объекты / Благоустройство) ===
// =========================================================================
fetch('data/pointsObjects.geojson')
  .then(r => r.json())
  .then(json => {
    L.geoJSON(json, {
      pointToLayer: (f, ll) => {
        let cat = (f.properties.cat || 'buildings').toLowerCase();
        if (cat === 'buldings') cat = 'buildings'; // Исправлена опечатка 'buldings'
        return L.marker(ll, {
          icon: icons[cat]
        });
      },
      onEachFeature: (f, lyr) => {
        const p = f.properties || {};
        /* Картинки (до 3) */
        const imgs = [p.img, p.img2, p.img3].filter(Boolean)
          .map(s => `<img class="popup-img" src="${s}" style="cursor:zoom-in">`)
          .join('<br>');
        /* описание */
        const descr = p.descr ? `<div class="popup-text">${p.descr}</div>` : '';
        /* Тэп */
        const tpl = n => Number(n).toLocaleString('ru-RU');
        const list = [];
        if (p.buildarea) list.push(`Площадь застройки — ${tpl(p.buildarea)} м²`);
        if (p.grossarea) list.push(`Общая площадь — ${tpl(p.grossarea)} м²`);
        if (p.usefularea) list.push(`Полезная площадь — ${tpl(p.usefularea)} м²`);
        if (p.roofarea) list.push(`Экспл. кровля — ${tpl(p.roofarea)} м²`);
        if (p.invest) list.push(`Инвестиции — ${p.invest} млрд Р`);
        if (p.implement) list.push(`Механизм реализации — ${p.implement}`);
        if (p.period) list.push(`Период строительства — ${p.period}`);

        const tep = list.length ?
          `<details class="popup-tep"><summary>ТЭП</summary><ul><li>${list.join('</li><li>')}</li></ul></details>` :
          '';

        lyr.bindPopup(`${imgs}<div class="popup-title">${p.name||''}</div>${descr}${tep}`);

        /* складываем в группу для категории-легенды */
        combo[(p.cat || 'buildings').toLowerCase()].addLayer(lyr);
      }
    });
    // Маркеры "Объекты" и "Благоустр." должны быть включены по умолчанию
    combo.buildings.addTo(map);
    combo.landscape.addTo(map);
  })
  .catch((error) => console.error('Ошибка загрузки ОПИСАНИЙ-точек:', error));


// =========================================================================
// === контрол «Объекты / Благоустройство» ===
// =========================================================================
L.control.layers(
  null, {
    '<span class="legend-icon orange"></span> Объекты': combo.buildings,
    '<span class="legend-icon violet"></span> Благоустр.': combo.landscape
  }, {
    collapsed: false,
    sanitize: false,
    position: 'topright'
  }
).addTo(map);

// =========================================================================
// === кнопки «Участок 1 / 2» ===
// =========================================================================
const ZoomCtrl = L.Control.extend({
  onAdd() {
    const d = L.DomUtil.create('div', 'zoom-buttons');
    d.innerHTML = '<button id="toA">■ Участок 1</button>' +
      '<button id="toB">■ Участок 2</button>';
    return d;
  }
});
map.addControl(new ZoomCtrl({
  position: 'topleft'
}));
document.getElementById('toA').onclick = () => map.fitBounds(b1, {
  padding: [20, 20]
});
document.getElementById('toB').onclick = () => map.fitBounds(b2, {
  padding: [20, 20]
});

// =========================================================================
// === лайтбокс ===
// =========================================================================
function showLightbox(src) {
  if (document.querySelector('.lb-overlay')) return;
  const w = document.createElement('div');
  w.className = 'lb-overlay';
  w.innerHTML = `<button class="lb-close">×</button><img src="${src}" alt="">`;
  document.body.appendChild(w);
  w.querySelector('.lb-close').onclick = () => w.remove();
  w.onclick = e => {
    if (e.target === w) w.remove();
  };
}

map.on('popupopen', e => {
  e.popup._contentNode.querySelectorAll('.popup-img')
    .forEach(img => img.addEventListener('click', () => showLightbox(img.src), {
      once: true
    }));
});
