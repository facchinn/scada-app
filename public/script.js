// Set current date
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', 
    timeZone: 'America/Argentina/Buenos_Aires', hour12: true 
}).replace('PM', 'p.m.').replace('AM', 'a.m.');

// Chart Initialization (mantenido como estaba)
const ctx = document.createElement('canvas').getContext('2d');
document.querySelector('.flow-pressure-widget').appendChild(ctx.canvas);
ctx.canvas.className = 'chart-container';
const flowChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        datasets: [{
            label: 'Caudal (m³/h)',
            data: [10, 11, 11.4, 11.2, 11.3, 11.5],
            borderColor: 'rgba(212,160,23, 1)',
            backgroundColor: 'rgba(212,160,23, 0.2)',
            tension: 0.3,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'var(--text-color)' } },
            x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'var(--text-color)' } }
        },
        plugins: { legend: { labels: { color: 'var(--text-color)' } } }
    }
});

// Fetch manifolds and populate the manifold selector
async function loadManifolds() {
    try {
        const response = await fetch('/api/manifolds');
        if (!response.ok) throw new Error(`Error fetching manifolds: ${response.status}`);
        const manifolds = await response.json();
        console.log('Manifolds recibidos:', manifolds);
        const manifoldSelector = document.getElementById('manifoldSelector');
        manifoldSelector.innerHTML = '<option value="">Selecciona un Manifold</option>';
        if (manifolds.length > 0) {
            manifolds.forEach(manifold => {
                const option = document.createElement('option');
                option.value = manifold.id_manifold;
                option.textContent = `${manifold.nombre_manifold} (Yacimiento: ${manifold.nombre_yacimiento || 'Sin yacimiento'})`;
                manifoldSelector.appendChild(option);
            });
            manifoldSelector.value = manifolds[0].id_manifold; // Selecciona el primero por defecto
            console.log('Manifold seleccionado por defecto:', manifolds[0].id_manifold);
            loadPozos();
        } else {
            console.log('No se encontraron manifolds');
            manifoldSelector.innerHTML += '<option value="">No hay manifolds</option>';
        }
    } catch (error) {
        console.error('Error loading manifolds:', error);
    }
}

// Fetch pozos based on selected manifold
async function loadPozos() {
    const manifoldSelector = document.getElementById('manifoldSelector');
    const wellSelector = document.getElementById('wellSelector');
    const idManifold = manifoldSelector.value;
    console.log('Cargando pozos para idManifold:', idManifold);
    if (idManifold) {
        try {
            const response = await fetch(`/api/pozos/${idManifold}`);
            if (!response.ok) throw new Error(`Error fetching pozos: ${response.status}`);
            const pozos = await response.json();
            console.log('Pozos recibidos:', pozos);
            wellSelector.innerHTML = '<option value="">Selecciona un Pozo</option>';
            if (pozos.length > 0) {
                pozos.forEach(pozo => {
                    const option = document.createElement('option');
                    option.value = pozo.id_pozo;
                    option.textContent = `${pozo.nombre_pozo} (Manifold: ${pozo.nombre_manifold})`;
                    wellSelector.appendChild(option);
                });
                wellSelector.value = pozos[0].id_pozo; // Selecciona el primero por defecto
                console.log('Pozo seleccionado por defecto:', pozos[0].id_pozo);
                loadPozoData(pozos[0].id_pozo);
            } else {
                console.log(`No se encontraron pozos para manifold ${idManifold}`);
                wellSelector.innerHTML += '<option value="">No hay pozos</option>';
            }
        } catch (error) {
            console.error('Error loading pozos:', error);
            wellSelector.innerHTML = '<option value="">Error al cargar pozos</option>';
        }
    } else {
        wellSelector.innerHTML = '<option value="">Selecciona un Manifold primero</option>';
    }
}

// Función para cargar datos del pozo (lecturas)
async function loadPozoData(idPozo) {
    try {
        const response = await fetch(`/api/lecturas/${idPozo}`);
        if (!response.ok) throw new Error(`Error fetching lecturas: ${response.status}`);
        const lectura = await response.json();
        console.log('Lectura recibida:', lectura);
        document.getElementById('flowHourly').textContent = lectura.caudal_agua ? `${lectura.caudal_agua} m³/h` : 'N/A';
        document.getElementById('flowDaily').textContent = lectura.caudal_agua ? `${(lectura.caudal_agua * 24).toFixed(1)} m³/día` : 'N/A';
        document.getElementById('wellPressure').textContent = lectura.presion ? `${lectura.presion} kg/cm²` : 'N/A';
        document.getElementById('dispersantFlow').textContent = lectura.caudal_disp ? `${lectura.caudal_disp} L/min` : 'N/A';
        document.getElementById('brightwaterFlow').textContent = lectura.caudal_bw ? `${lectura.caudal_bw} L/min` : 'N/A';
        const observacionesDiv = document.getElementById('observaciones') || document.createElement('div');
        observacionesDiv.id = 'observaciones';
        observacionesDiv.textContent = lectura.observaciones || 'Sin observaciones';
        document.querySelector('.flow-pressure-widget').appendChild(observacionesDiv);
    } catch (error) {
        console.error('Error loading pozo data:', error);
    }
}

// Event listeners
document.getElementById('manifoldSelector').addEventListener('change', loadPozos);
document.getElementById('wellSelector').addEventListener('change', function() {
    loadPozoData(this.value);
});

// Initial load
loadManifolds();