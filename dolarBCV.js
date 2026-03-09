// BC API - Tasas Dólar/Euro Banesco (SERVIDOR HTTP)
// Autor: Oswal Villegas (@tu_twitter)
// Uso: http://localhost:3000/api/dolar
// Fetch: fetch('http://localhost:3000/api/dolar')

const https = require('https');
const cheerio = require('cheerio');
const http = require('http');
const url = require('url');

function scrapeBCVStrong(targetUrl) {
    return new Promise((resolve) => {
        https.get(targetUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const $ = cheerio.load(data);
                const strongs = $("td[style*='text-align: center; padding: 0.5%']");
                
                const datos = {
                    titulo: 'Dólar y Euro a Bolívares Venezolanos',
                    fecha_scrape: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    fuente: targetUrl,
                    monedas: {}
                };

                let i = 0;
                const monedas = ['USD', 'EUR'];
                
                strongs.each((index, element) => {
                    const texto = $(element).text().trim();
                    if (texto && (index === 2 || index === 4)) {
                        datos.monedas[monedas[i]] = texto;
                        i++;
                    }
                });

                resolve(datos);
            });
        }).on('error', () => {
            resolve({ error: 'Error de conexión al Banesco' });
        }).on('timeout', () => {
            resolve({ error: 'Timeout' });
        });
    });
}

// SERVIDOR HTTP
const server = http.createServer(async (req, res) => {
    // CORS para todos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Manejar OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'GET' && req.url.includes('/api/dolar')) {
        try {
            const resultado = await scrapeBCVStrong(
                "https://www.banesco.com/informacion-de-interes/sistema-mercado-cambiario/"
            );
            
            res.writeHead(200);
            res.end(JSON.stringify(resultado, null, 2));
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Error interno del servidor' }, null, 2));
        }
    } else {
        // Página de bienvenida
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>BCV API - Dólar Banesco</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>🪙 BCV API - Tasas Banesco</h1>
    <p><strong>API Endpoint:</strong> <code>http://localhost:3000/api/dolar</code></p>
    
    <h3>Probar ahora:</h3>
    <button onclick="fetchDolar()">Obtener Dólar/Euro</button>
    
    <pre id="resultado"></pre>
    
    <script>
        async function fetchDolar() {
            try {
                const res = await fetch('/api/dolar');
                const data = await res.json();
                document.getElementById('resultado').textContent = 
                    JSON.stringify(data, null, 2);
            } catch(e) {
                document.getElementById('resultado').textContent = 'Error: ' + e.message;
            }
        }
    </script>
</body>
</html>
        `);
    }
});

server.listen(3000, 'localhost', () => {
    console.log('🚀 Servidor corriendo en http://localhost:3000');
    console.log('📊 API: http://localhost:3000/api/dolar');
    console.log('⏹️ Parar: Ctrl+C');
});
