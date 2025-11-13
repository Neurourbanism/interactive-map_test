// ---------- контрольные точки генплана ----------
const A = L.latLng(55.74309207410261, 37.60094412479446);
const B = L.latLng(55.74159932245304, 37.604669304174124);
const C = L.latLng(55.742289854123555, 37.60009626314388);
const D = L.latLng(55.7407158302922, 37.60376732369479);

const planBounds = L.latLngBounds(
  [Math.min(A.lat, B.lat, C.lat, D.lat), Math.min(A.lng, B.lng, C.lng, D.lng)],
  [Math.max(A.lat, B.lat, C.lat, D.lat), Math.max(A.lng, B.lng, C.lng, D.lng)]
);

// ---------- карта ----------
const map = L.map('map');
map.fitBounds(planBounds, { padding: [60, 60] });

L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  { maxZoom: 19, attribution: '© OSM, Carto' }
).addTo(map);

// ---------- слой-контейнеры ----------
const layers = {
  genplan  : L.layerGroup(),   // картинка + маркеры генплана
  transport: L.layerGroup()    // картинка + маркеры транспорта
};

// ---------- изображения-оверлеи ----------
L.imageOverlay('images/plan_georeferenced_final.png',  planBounds, {opacity:0.8})
 .addTo(layers.genplan);

L.imageOverlay('images/plan_georeferenced_finalBlack.png', planBounds, {opacity:0.7})
 .addTo(layers.transport);

// ---------- иконка ----------
const blueIcon = L.icon({
  iconUrl  : 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// ---------- точки из GeoJSON ----------
fetch('data/points.geojson')
  .then(r => r.json())
  .then(json => {
    L.geoJSON(json, {
      pointToLayer : (_, latlng) => L.marker(latlng, { icon: blueIcon }),
      onEachFeature: (f, lyr) => {
        const p = f.properties || {};

        // корректный template-literal
        lyr.bindPopup(
          `<h3 class="popup-title">${p.name || ''}</h3>
           ${p.img ? `<img class="popup-img" src="${p.img}"><br>` : ''}
           ${p.descr || ''}`
        );

        // безопасно определяем группу
        const type   = (p.layer || 'genplan').trim().toLowerCase();
        const target = layers[type] || layers.genplan;
        target.addLayer(lyr);
      }
    });
  });

// ---------- чек-боксы ----------
L.control.layers(
  null,
  {
    'Генплан'   : layers.genplan,
    'Транспорт' : layers.transport
  },
  { collapsed:false }
).addTo(map);

// показываем ТОЛЬКО генплан при старте
layers.genplan.addTo(map);
// layers.transport.addTo(map);   // ← строку убрали


