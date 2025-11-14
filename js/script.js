/* ==================================
   Leaflet  +  слои  +  категории
   ================================== */

const planBounds = L.latLngBounds(
  [55.7407158302922, 37.60009626314388],
  [55.74309207410261,37.604669304174124]
);

/* --- карта --- */
const map = L.map('map').fitBounds(planBounds,{padding:[60,60]});
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {maxZoom:19, attribution:'© OSM, Carto'}).addTo(map);

/* --- базовые слои --- */
const base = {
  genplan  : L.layerGroup(),
  transport: L.layerGroup()
};
L.imageOverlay('images/plan_georeferenced_finalSmall.webp', planBounds,{opacity:.8})
 .addTo(base.genplan);

let transportLoaded=false;
map.on('overlayadd', e=>{
  if(e.name==='Транспорт' && !transportLoaded){
    L.imageOverlay('images/plan_georeferenced_blackSmall.webp', planBounds,{opacity:.7})
     .addTo(base.transport);
    transportLoaded=true;
  }
});

/* --- иконки категорий --- */
const icons = {
  buildings : L.icon({
    iconUrl :'icons/marker-orange.png',
    shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize:[25,41], iconAnchor:[12,41], shadowSize:[41,41]
  }),
  landscape : L.icon({
    iconUrl :'icons/marker-violet.png',
    shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize:[25,41], iconAnchor:[12,41], shadowSize:[41,41]
  })
};

/* --- слои-категории --- */
const cat = { buildings:L.layerGroup(), landscape:L.layerGroup() };

/* --- точки --- */
fetch('data/points.geojson')
 .then(r=>r.json())
 .then(json=>{
   L.geoJSON(json,{
     pointToLayer:(f,latlng)=>{
       const k=(f.properties.cat||'buildings').toLowerCase();
       return L.marker(latlng,{icon:icons[k]||icons.buildings});
     },
     onEachFeature:(f,lyr)=>{
       const p=f.properties||{};
       lyr.bindPopup(
         `${p.img?`<img class="popup-img" src="${p.img}" style="cursor:zoom-in"><br>`:''}
          <div class="popup-title">${p.name||''}</div>
          ${p.descr?`<div class="popup-text">${p.descr}</div>`:''}`
       );
       (base[(p.layer||'genplan').toLowerCase()] || base.genplan ).addLayer(lyr);
       (cat[(p.cat||'buildings').toLowerCase()]   || cat.buildings ).addLayer(lyr);
     }
   });

   /* --- окно 1: Слои --- */
   L.control.layers(null,{
     'Генплан'  : base.genplan,
     'Транспорт': base.transport
   },{collapsed:false, position:'topright'}).addTo(map);

   /* --- окно 2: Категории --- */
   L.control.layers(null,{
     '<span class="legend-icon orange"></span> Здания'        : cat.buildings,
     '<span class="legend-icon violet"></span> Благоустр.'    : cat.landscape
   },{collapsed:false, position:'topright'}).addTo(map);

   base.genplan.addTo(map);
   cat.buildings.addTo(map);
   cat.landscape.addTo(map);
 });

/* --- лайтбокс --- */
function showLightbox(src){
  if(document.querySelector('.lb-overlay')) return;
  const w=document.createElement('div');
  w.className='lb-overlay';
  w.innerHTML=`<button class="lb-close">×</button><img src="${src}" alt="">`;
  document.body.appendChild(w);
  w.querySelector('.lb-close').onclick=()=>w.remove();
  w.onclick=e=>{if(e.target===w)w.remove();};
}
map.on('popupopen',e=>{
  const img=e.popup._contentNode.querySelector('.popup-img');
  if(img) img.addEventListener('click',()=>showLightbox(img.src));
});
