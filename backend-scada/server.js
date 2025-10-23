const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static('../public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const dbConfig = {
    user: 'CloudSA74db4f0e',
    password: 'fordF100pasion',
    server: 'bwsv.database.windows.net',
    database: 'BSDB',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

app.get('/api/manifolds', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
            SELECT m.id_manifold, m.nombre AS nombre_manifold, y.nombre AS nombre_yacimiento, m.fecha_creacion
            FROM Manifolds m
            JOIN Yacimientos y ON m.id_yacimiento = y.id_yacimiento
            WHERE m.activo = 1`;
        console.log('Manifolds encontrados:', result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en manifolds:', err);
        res.status(500).send('Error consultando manifolds');
    }
});

app.get('/api/pozos/:idManifold', async (req, res) => {
    const idManifold = req.params.idManifold;
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
            SELECT p.id_pozo, p.nombre AS nombre_pozo, m.nombre AS nombre_manifold, p.fecha_instalacion
            FROM Pozos p
            JOIN Manifolds m ON p.id_manifold = m.id_manifold
            WHERE p.id_manifold = ${idManifold} AND p.activo = 1`;
        console.log(`Pozos para manifold ${idManifold}:`, result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error en pozos:', err);
        res.status(500).send('Error consultando pozos');
    }
});

app.get('/api/lecturas/:idPozo', async (req, res) => {
    const idPozo = req.params.idPozo;
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
            SELECT TOP 1 fecha, caudal_agua, presion, caudal_bw, caudal_disp, observaciones
            FROM Lecturas
            WHERE id_pozo = ${idPozo}
            ORDER BY fecha DESC`;
        console.log(`Lectura para pozo ${idPozo}:`, result.recordset[0] || {});
        res.json(result.recordset[0] || {});
    } catch (err) {
        console.error('Error en lecturas:', err);
        res.status(500).send('Error consultando lecturas');
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});