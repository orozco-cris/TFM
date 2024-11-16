// URL externa para acceso a dataset
const github_csv_url = "/listings_clean7.csv";

// Delimitar del csv
const csv_format = d3.dsvFormat(';');
// Variable para controlar provincias seleccionados
var selectedProvincia = 'Todos';
// Variable para controlar tipo de nicho seleccionada
var selectedTipoNicho = null;
// Array para controlar los marcadores en el mapa
var markers = [];

// Objeto para mapear colores del tipo de nicho
const color_map = {
    'Bueno': '#A1DD70', 
    'Malo': '#493628', 
    'Regular': '#EE4E4E', 
    'Muy bueno': '#0D92F4' 
}

// Carga de datos y estructura del modelo de datos
d3.text(github_csv_url).then((text) => {
        
    // Convierte el contenido del fichero especificando el delimitar ';' en un array de objetos
    // Por cada objeto del array se extrae los campos necesarios y formateados
    const ecuador = csv_format.parse(text, d => {
        return {
            // Se convierte latitud y longitud a formato númerico especificando el delimitador decimal
            latitude: +d.latitude.replace(",", "."),
            longitude: +d.longitude.replace(",", "."),
            provincia: d.neighbourhood_group,
            barrio: d.neighbourhood,
            room_type: d.room_type,
            // Se convierte el precio en númerico
            price: +d.price,
            host_id: d.host_id,
            host_name: d.host_name    
        }
    });
    // Carga inicial del mapa
    initMap()
    // Creación del menú desplegable
    filtroProvincia(ecuador)
    // Agrega marcadores iniciales al mapa
    addMarkers(ecuador)
    // Crea el bar chart de precios promedio por tipo de nicho inicial
    createAvgPriceBarChart(ecuador)
    // Agrega las leyendas para filtrado y boton reset
    createLegend(ecuador)
    

});

// Carga el mapa con Leaflet
function initMap() {
    // Especifica el div que contiene el mapa
    map = L.map(map);
    // Descarga el mapa y lo agrega en el div mapa
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://carto.com/" target="_blank">CartoDB</a>'
    }).addTo(map);
    // Configura la vista inicial en ecuador
    map.setView([-1.67098, -78.64712], 7);
}

// Función para agregar/actualizar los marcadores del mapa en función de los datos filtrados
function addMarkers(ecuador) {

    // Valida si estamos en selección completa o algún distrio ha sido seleccionado
    if (selectedProvincia !== 'Todos') {
        // Actualiza filteredData para contener unicamente los registros del provincia seleccionado
        filteredData = ecuador.filter(d => d.provincia === selectedProvincia);
    } else {
        filteredData = ecuador;
    }
    
    // Filtra por tipo de nicho seleccionada
    if (selectedTipoNicho) {
        // Tomando en cuenta el primer fitro, este hace un filtrado adicional para seleccionar el tipo de nicho.
        filteredData = filteredData.filter(d => d.room_type === selectedTipoNicho);
    }

     // Ajustar la vista del mapa en una posición promedio en términos del provincia seleccionado
     if (filteredData.length > 0 && selectedProvincia !== 'Todos') {
        // Llama a la función auxiliar calculateCenter para calcular las coordenadas promedio
        const center = calculateCenter(filteredData);
        // Actualiza la vista del mapa
        map.setView(center, 7);
    } else {
        // Caso contrario regresa a la ubicación central de ecuador
        map.setView([-1.67098, -78.64712], 7);
    }


    // Remueve cada uno de los marcadores del mapa
    markers.forEach(marker => map.removeLayer(marker));
    // Vacia el array de marcadores
    markers = [];
    // Recorre cada elemento de filteredData 
    filteredData.forEach(function(d) {
        // Crea un marcador por cada elemento basado en la latitud y longitud del elemento
        var marker = L.circleMarker([+d.latitude, +d.longitude]);

        // Variable que almacena el color del tipo de nicho basado en el diccionario de colores o especifica o color por defecto
        var color = color_map[d.room_type] || '#aaa';

        // Configura el estilo del marcador 
        marker.setStyle({
            radius: 4,
            fillColor: color,
            fillOpacity: 1,
            color: '#ddd',
            weight: 0.25 
        });

        // Configura el tooltip del marcador para mostrar información de cada alojamiento sobre el que se mueve el mouse
        marker.bindTooltip(`
            
            <strong>Tipo de nicho: </strong>${d.room_type}<br>
            <strong>Científico: </strong>${d.host_name}<br>
            <strong>Provincia: </strong>${d.provincia}
        `);
        
        // Agrega el marcador al mapa
        marker.addTo(map);
        // Agrega el marcado al array de marcadores
        markers.push(marker);
       
    });
}

// Función para crear el menú desplegable
function filtroProvincia(ecuador){

     // Selecciona el elemento 'opciones-filtrado' del index.html y agrega la estructura para mostrar opciones de filtrado
     const opciones_filtrado = d3.select('#opciones-filtrado');
     // Agrega el div
     opciones_filtrado.append('div')
     .attr('class', 'legend-item')
     .append('label')
     .attr('for', 'distrito-filter')
     .text('Filtrar por provincias:')
     .append('select')
     .attr('id', 'distrito-filter')
     
     // Crea un array con los nombres de los provincias de cada objeto en data
     const districts = Array.from(new Set(ecuador.map(d=> d.provincia))).sort();
     // Selecciona el elemento select del index.html 
     const dropdown = d3.select('#distrito-filter');
 
     // Agrega la opción Todos en el menu desplegable
     dropdown.append('option')
         .attr('value', 'Todos')
         .text('Todos');
     
     // Agrega los provincias almacenado en el array district al menu desplegable como opciones
     dropdown.selectAll('option.district-option')
         .data(districts)
         .enter()
         .append('option')
         .attr('class','district-option')
         .attr('value', d =>d )
         .text(d => d);
 
     // Establece un observable para manejar los cambios sobre el menu desplegable
     dropdown.on('change',function(){
         // Almacena el provincia seleccionado actualmente
         selectedProvincia = this.value;
         // Llama a la función addMarkers para actualizar marcadores en función de selección
         addMarkers(ecuador)
         // Llama a la función para crear Bar Chart para actualizar las barras son la selección
         createAvgPriceBarChart(ecuador)
    
     });
}

// Función para crear el bar char de conteo promedio por tipo de nicho
function createAvgPriceBarChart(ecuador) {

    if (selectedProvincia !== 'Todos') {
        // Actualiza filteredData para contener unicamente los registros del provincia seleccionado
        filteredData = ecuador.filter(d => d.provincia === selectedProvincia);
    } else {
        filteredData = ecuador;
    }

    // Verifica si hay datos filtrados antes de crear el bar chart
    if (!filteredData || filteredData.length === 0) return; 

    // Agrupa los datos filtrados por tipo de nicho y calcular el promedio de precio
    const avgPriceByRoomType = Array.from(
        d3.rollup(
            filteredData, // Datos de entrada
            v => d3.count(v, d => d.price), // Calcula el promedio de precios
            d => d.room_type               // Agrupa por tipo de nicho
        ),
        ([roomType, avgPrice]) => ({ roomType, avgPrice }) // Convierte el resultado a un array de objetos
    );


    // Orden deseado de roomType
    const roomTypeOrder = ["Malo", "Regular", "Bueno", "Muy bueno"];

    // Ordenar avgPriceByRoomType según el orden deseado
    avgPriceByRoomType.sort((a, b) => roomTypeOrder.indexOf(a.roomType) - roomTypeOrder.indexOf(b.roomType));

    // Dimensiones del gráfico
    const margin = { top: 70, right: 30, bottom: 40, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Limpiar cualquier gráfico existente
    d3.select('#avg-price-bar-chart').selectAll('*').remove();

     // Ajustar el ancho del rango si hay solo una barra
    const xRange = avgPriceByRoomType.length === 1 ? [width / 2 - 80, width / 2 + 80] : [0, width];

    // Escalas para el eje x
    const x = d3.scaleBand()
        .domain(avgPriceByRoomType.map(d => d.roomType))
        .range(xRange)
        .padding(0.3);


    // Escalas para el eje y
    const y = d3.scaleLinear()
        .domain([0, d3.max(avgPriceByRoomType, d => d.avgPrice)])
        .nice()
        .range([height, 0]);

    // Crea el contenedor SVG
    const svg = d3.select('#avg-price-bar-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Agrega título al gráfico
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -50) // Mueve el título más arriba
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('Cantidad de nichos por tipo');

    // Agrega x en el elemento svg
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

   
    // Agrega las barras
    svg.selectAll('.bar')
        .data(avgPriceByRoomType)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('id', d => d.roomType.replace(/\s+/g, '-').replace(/\//g, ''))
        .attr('x', d => x(d.roomType))
        .attr('y', d => y(d.avgPrice))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.avgPrice))
        .attr('fill', d => color_map[d.roomType] || '#ccc')
        .on('click', function(event,d) {  // Agrega el manejador de eventos al botón
            
                selectedTipoNicho = d.roomType; 
                const svg = d3.select('#avg-price-bar-chart')
                // Resetea todas las barras al estado inicial
                svg.selectAll('.bar')
                .attr('fill', d => color_map[d.roomType] || '#ccc')
                .attr('stroke', 'none') // Remueve el borde
                .attr('stroke-width', 2)
                .style('opacity', 1); // Restablece la opacidad
        
                // Establece el tipo de nicho seleccionado
                console.log(this)
        
                // Agrega borde negro y destaca la barra seleccionada
                d3.select(this)
                .transition()
                .duration(200)
                .attr('stroke', 'black') // Agrega borde negro
                .attr('stroke-width', 2); // Define el ancho del borde
        
                // Reduce la opacidad de las demás barras
                svg.selectAll('.bar')
                .filter(function(d) {
                     return d.roomType !== selectedTipoNicho;
                })
                .transition()
                .duration(500)
                .style('opacity', 0.5);
                // Actualiza los marcadores
                addMarkers(ecuador)
           
        })
        // Efecto de boton para expresar posibilidad de presionar las barras
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 0.8); 
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .attr('opacity', 1);
        });

    // Agrega las etiquetas de texto para el promedio de precio en cada barra
    svg.selectAll('.label')
        .data(avgPriceByRoomType)
        .enter()
        .append('text')
        .attr('x', d => x(d.roomType) + x.bandwidth() / 2)
        .attr('y', d => y(d.avgPrice) - 5)
        .attr('text-anchor', 'middle')
        .text(d => `${d.avgPrice.toFixed(0)}`);

    // Se encarga de mantener seleccion de tipo nicho si solo se cambia el provincia
        if(selectedTipoNicho){
        // Accede al div de barchar
        const svg = d3.select('#avg-price-bar-chart')
        // Resetear todas las barras al estado inicial
        svg.selectAll('.bar')
        .attr('fill', d => color_map[d.roomType] || '#ccc')
        .attr('stroke', 'none') // Remueve el borde
        .attr('stroke-width', 2)
        .style('opacity', 1); // Restablece la opacidad

        // Variable auxiliar para formatear el id
        let aux_id = '#' + selectedTipoNicho.replace(/\s+/g, '-').replace(/\//g, '');
        // Agrega borde negro y destaca la barra seleccionada con efecto transicion
        d3.select(aux_id)
        .transition()
        .duration(200)
        .attr('stroke', 'black') // Agrega borde negro
        .attr('stroke-width', 2); // Define el ancho del borde

        // Reduce la opacidad de las demás barras
        svg.selectAll('.bar')
        .filter(function(d) {
             return d.roomType !== selectedTipoNicho;
        })
        .transition()
        .duration(500)
        .style('opacity', 0.5);

        // Actualiza los marcadores
        addMarkers(ecuador)

    }
    
}

// Función para crear las leyendas y boton reset
function createLegend(ecuador){

    // Selecciona el div 'opciones-filtrado' para agregar las leyendas de tipo de nicho
    const legend = d3.select('#opciones-filtrado');

    // Itera el diccionario de colores para extraer el nombre de los tipos tipo de habitaciones
    Object.keys(color_map).forEach(roomType => {

        // Para cada uno de los tipos de alojamiento crea la leyenda del tipo de nicho
        const item = legend.append('div')
            .attr('class', 'legend-item')
            .attr('data-room-type', roomType)
            .on('click', (event, d)=> {// Enlaza una función para manejar el comportamiento de la leyenda
                selectedTipoNicho = roomType; // Establecer el tipo de nicho seleccionado
               
                const svg = d3.select('#avg-price-bar-chart')
                // Resetear todas las barras al estado inicial
                svg.selectAll('.bar')
                .attr('fill', d => color_map[d.roomType] || '#ccc')
                .attr('stroke', 'none') // Remueve el borde
                .attr('stroke-width', 2)
                .style('opacity', 1); // Restablece la opacidad


                let aux_id = '#' + selectedTipoNicho.replace(/\s+/g, '-').replace(/\//g, '');
                // Agregar borde negro y destacar la barra seleccionada
                d3.select(aux_id)
                .transition()
                .duration(200)
                .attr('stroke', 'black') // Agrega borde negro
                .attr('stroke-width', 2); // Define el ancho del borde
        
                // Reducir la opacidad de las demás barras
                svg.selectAll('.bar')
                .filter(function(d) {
                     return d.roomType !== selectedTipoNicho;
                })
                .transition()
                .duration(500)
                .style('opacity', 0.5);

                addMarkers(ecuador)
            }); 
        
        // Agrega un span al div creado para mostrar el color relacionado al tipo de nicho
        item.append('span')
            .attr('class','legend-color')
            .style('background-color', color_map[roomType]);

        // Agrega un span al div creado para mostrar el texto del tipo de nicho
        item.append('span')
            .text(roomType)

    });

    // Agrega el boton de reset para los filtros de tipo de nicho 
    legend.append('div')
        .attr('id', 'back-button')
        .html('&#x21BA; <span>Limpiar</span>')
        .on('click', function() {  // Agrega el manejador de eventos al botón
              // Limpia el filtro de tipo de nicho
            selectedTipoNicho = null;
              // Resetear los marcadores
            addMarkers(ecuador)
             // Resetear bar char
            createAvgPriceBarChart(ecuador)
            
        });
    

}

// Función para calcular la longitud y latitud promedio de datos filtrados
function calculateCenter(data) {

    // Crear un array de latituted sobre los datos en data
    const latitudes = data.map(d => d.latitude);
    // Crear un array de longitudes  sobre los datos en data
    const longitudes = data.map(d => d.longitude);
    
    // Suma cada valor de latitud y divide entre el total de elementos para calcular el promedio
    const avgLat = latitudes.reduce((sum, val) => sum + val, 0) / latitudes.length;
    // Suma cada valor de longitud y divide entre el total de elementos para calcular el promedio
    const avgLon = longitudes.reduce((sum, val) => sum + val, 0) / longitudes.length;
    
    // Devuelve un array con las coordenadas promedio
    return [avgLat, avgLon];
}
