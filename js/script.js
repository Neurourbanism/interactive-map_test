/* ===== главные переменные ===== */
const layers = ['genplan','transport'];
const cats   = ['buildings','landscape'];

/* ===== карта и подложки ===== */
const bounds = L.latLngBounds([55.7407158302922,37.60009626314388],
                              [55.74309207410261,37.604669304174124]);

const map = L.map('map').fitBounds(bounds,{padding:[60,60]});
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {maxZoom:19, attribution:'© OSM, Carto'}).addTo(map);

const raster = {
  genplan  : L.imageOverlay('images/plan_georeferenced_finalSmall.webp',  bounds,{opacity:.8}),
  transport: L.imageOverlay('images/plan_georeferenced_blackSmall.webp', bounds,{opacity:.7})
};
raster.genplan.addTo(map);
let activeLayer = 'genplan';

/* ===== категории-контейнеры ===== */
const combo={};
layers.forEach(l=>{
  combo[l]={};
  cats.forEach(c=>combo[l][c]=L.layerGroup());
});

/* ===== иконки ===== */
const icons={
  buildings : L.icon({iconUrl:'icons/marker-orange.png',
                      shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                      iconSize:[25,41],iconAnchor:[12,41],shadowSize:[41,41]}),
  landscape : L.icon({iconUrl:'icons/marker-violet.png',
                      shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                      iconSize:[25,41],iconAnchor:[12,41],shadowSize:[41,41]})
};

/* ===== данные ===== */
fetch('data/points.geojson')
  .then(r => r.json())
  .then(json => {

    /* --- раскладываем маркеры --- */
    L.geoJSON(json, {
      pointToLayer: (f, ll) => {
        const cat = (f.properties.cat || 'buildings').toLowerCase();
        return L.marker(ll, { icon: icons[cat] || icons.buildings });
      },
      onEachFeature: (f, lyr) => {
        const p = f.properties || {};
        lyr.bindPopup(
          `${p.img ? `<img class="popup-img" src="${p.img}" style="cursor:zoom-in"><br>` : ''}
           <div class="popup-title">${p.name || ''}</div>
           ${p.descr ? `<div class="popup-text">${p.descr}</div>` : ''}`
        );
        const lay = (p.layer || 'genplan').toLowerCase();
        const cat = (p.cat   || 'buildings').toLowerCase();
        combo[lay][cat].addLayer(lyr);
      }
    });

   /* ---------- контрол «Категории» ---------- */
const catCtrl = L.control.layers(
  null,
  {
    '<span class="legend-icon orange"></span> Здания'     : L.layerGroup(),
    '<span class="legend-icon violet"></span> Благоустр.' : L.layerGroup()
  },
  { collapsed:false, sanitize:false }          // ← отключили очистку HTML
).addTo(map);

/* отметим чек-боксы сразу */
Object.values(catCtrl._layers).forEach(o => map.addLayer(o.layer));

/* ---------- реагируем на события карты ---------- */
map.on('overlayadd',  e=>{
  const name=e.name.includes('Здания')?'buildings':
              e.name.includes('Благоустр')?'landscape':null;
  if(name) map.addLayer(combo[activeLayer][name]);
});
map.on('overlayremove', e=>{
  const name=e.name.includes('Здания')?'buildings':
              e.name.includes('Благоустр')?'landscape':null;
  if(name) map.removeLayer(combo[activeLayer][name]);
});

  });   // конец fetch

/* ===== легенда CSS уже в style.css ===== */



