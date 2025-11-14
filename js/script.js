/* =======================================
   Leaflet-карта + цветные категории
   ======================================= */

const planBounds = L.latLngBounds(
  [55.7407158302922,37.60009626314388],
  [55.74309207410261,37.604669304174124]
);

/* ---------- карта ---------- */
const map = L.map('map');
map.fitBounds(planBounds,{padding:[60,60]});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {maxZoom:19, attribution:'© OSM, Carto'}).addTo(map);

/* ---------- слои ---------- */
const layers   = { genplan:L.layerGroup(), transport:L.layerGroup() };
const catLayers= { buildings:L.layerGroup(), landscape:L.layerGroup() };

/* ---------- генплан сразу ---------- */
L.imageOverlay('images/plan_georeferenced_finalSmall.webp', planBounds,{opacity:.8})
 .addTo(layers.genplan);

/* ---------- транспорт лениво ---------- */
let transportLoaded=false;
map.on('overlayadd', e=>{
  if(e.name==='Транспорт' && !transportLoaded){
    L.imageOverlay('images/plan_georeferenced_blackSmall.webp',planBounds,{opacity:.7})
     .addTo(layers.transport);
    transportLoaded=true;
  }
});

/* ---------- иконки ---------- */
const icons = {
  buildings : L.icon({
    iconUrl :'https://cdn.jsdelivr.net/npm/leaflet-color-markers@1.1/img/marker-icon-orange.png',
    shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize:[25,41], iconAnchor:[12,41], shadowSize:[41,41]
  }),
  landscape : L.icon({
    iconUrl :'https://cdn.jsdelivr.net/npm/leaflet-color-markers@1.1/img/marker-icon-violet.png',
    shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize:[25,41], iconAnchor:[12,41], shadowSize:[41,41]
  })
};

/* ---------- точки ---------- */
fetch('data/points.geojson')
  .then(r=>r.json())
  .then(json=>{

    L.geoJSON(json,{
      pointToLayer:(f,latlng)=>{
        const cat=(f.properties.cat||'buildings').toLowerCase();
        return L.marker(latlng,{icon:icons[cat]||icons.buildings});
      },
      onEachFeature:(f,lyr)=>{
        const p=f.properties||{};
        lyr.bindPopup(
          `${p.img ? `<img class="popup-img" src="${p.img}" style="cursor:zoom-in"><br>` : ''}
           <div class="popup-title">${p.name||''}</div>
           ${p.descr ? `<div class="popup-text">${p.descr}</div>` : ''}`
        );
        (layers[(p.layer||'genplan').toLowerCase()]   || layers.genplan ).addLayer(lyr);
        (catLayers[(p.cat||'buildings').toLowerCase()]|| catLayers.buildings).addLayer(lyr);
      }
    });

    /* ---------- чек-боксы (после загрузки) ---------- */
    L.control.layers(
      null,
      {
        'Генплан'                   : layers.genplan,
        'Транспорт'                 : layers.transport,
        'Здания (оранж.)'           : catLayers.buildings,
        'Благоустройство (фиол.)'   : catLayers.landscape
      },
      {collapsed:false}
    ).addTo(map);

    layers.genplan.addTo(map);
    catLayers.buildings.addTo(map);
    catLayers.landscape.addTo(map);
});

/* ---------- Лайтбокс ---------- */
function showLightbox(src){
  if(document.querySelector('.lb-overlay')) return;
  const w=document.createElement('div');
  w.className='lb-overlay';
  w.innerHTML=`<button class="lb-close">×</button><img src="${src}" alt="">`;
  document.body.appendChild(w);
  const close=()=>w.remove();
  w.querySelector('.lb-close').onclick=close;
  w.onclick=e=>{if(e.target===w)close();};
}

map.on('popupopen', e=>{
  const img=e.popup._contentNode.querySelector('.popup-img');
  if(img) img.addEventListener('click',()=>showLightbox(img.src));
});
