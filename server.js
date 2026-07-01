const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DB_FILE = path.join(__dirname, 'db.json');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
};

// Initial state if db.json doesn't exist
const INITIAL_DB = {
    products: [
        {
            id: 1,
            name: "Vestido Premium Vallora Champagne",
            description: "Vestido confeccionado em crepe de seda premium na cor champagne. Modelagem impecável e caimento refinado para ocasiões especiais.",
            price: 389.90,
            category: "Vestidos",
            sizes: ["P", "M", "G"],
            colors: ["#F1DBC8", "#ffffff"],
            colorsNames: ["Champagne", "Branco"],
            stock: 15,
            image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80"
        },
        {
            id: 2,
            name: "Blazer Vallora Alfaiataria Bronze",
            description: "Blazer estruturado em alfaiataria clássica de tom bronze/taupe. Abotoamento duplo e forro acetinado de alto padrão.",
            price: 299.90,
            category: "Blazers",
            sizes: ["P", "M", "G", "GG"],
            colors: ["#998675", "#000000"],
            colorsNames: ["Bronze", "Preto"],
            stock: 8,
            image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80"
        },
        {
            id: 3,
            name: "Bolsa de Couro Vallora Classic",
            description: "Bolsa tiracolo em couro legítimo texturizado. Detalhes em metal dourado e compartimentos internos inteligentes.",
            price: 189.90,
            category: "Acessórios",
            sizes: ["P"],
            colors: ["#998675", "#000000"],
            colorsNames: ["Bronze", "Preto"],
            stock: 22,
            image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"
        },
        {
            id: 4,
            name: "Camisa Satin Vallora Elegance",
            description: "Camisa de cetim brilhante com toque de seda. Gola clássica e punhos alongados, ideal para looks sofisticados.",
            price: 159.90,
            category: "Camisas",
            sizes: ["P", "M", "G"],
            colors: ["#F1DBC8", "#ffffff"],
            colorsNames: ["Champagne", "Branco"],
            stock: 25,
            image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80"
        }
    ],
    orders: [],
    cart: [],
    notifications: [
        {
            id: 1,
            title: "Boas-vindas à Vallora!",
            message: "Ganhe 10% de desconto na sua primeira compra usando o cupom VALLORA10.",
            date: new Date().toLocaleDateString('pt-BR')
        }
    ]
};

// Helper to read database
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 4), 'utf8');
        return INITIAL_DB;
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Erro ao ler db.json, usando padrão:", e);
        return INITIAL_DB;
    }
}

// Helper to write database
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4), 'utf8');
}

const server = http.createServer((req, res) => {
    // API Routes
    if (req.url.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const db = readDB();
            
            // GET /api/products
            if (req.url.startsWith('/api/products') && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify(db.products));
                return;
            }
            
            // POST /api/products
            if (req.url.startsWith('/api/products') && req.method === 'POST') {
                try {
                    const newProducts = JSON.parse(body);
                    db.products = newProducts;
                    writeDB(db);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, products: db.products }));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "Invalid JSON" }));
                }
                return;
            }
            
            // GET /api/orders
            if (req.url.startsWith('/api/orders') && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify(db.orders));
                return;
            }
            
            // POST /api/orders
            if (req.url.startsWith('/api/orders') && req.method === 'POST') {
                try {
                    const order = JSON.parse(body);
                    db.orders.unshift(order); // Add to beginning
                    writeDB(db);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, order }));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "Invalid JSON" }));
                }
                return;
            }
            
            // GET /api/cart
            if (req.url.startsWith('/api/cart') && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify(db.cart));
                return;
            }
            
            // POST /api/cart
            if (req.url.startsWith('/api/cart') && req.method === 'POST') {
                try {
                    const newCart = JSON.parse(body);
                    db.cart = newCart;
                    writeDB(db);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, cart: db.cart }));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "Invalid JSON" }));
                }
                return;
            }

            // GET /api/notifications
            if (req.url.startsWith('/api/notifications') && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify(db.notifications));
                return;
            }
            
            // POST /api/notifications
            if (req.url.startsWith('/api/notifications') && req.method === 'POST') {
                try {
                    const notification = JSON.parse(body);
                    notification.id = Date.now();
                    notification.date = new Date().toLocaleDateString('pt-BR');
                    db.notifications.unshift(notification);
                    writeDB(db);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, notification }));
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "Invalid JSON" }));
                }
                return;
            }
            
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Route not found" }));
        });
        return;
    }

    // Static File Server
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    // Sanitize path to prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }
    
    const ext = path.extname(filePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error: ' + err.code);
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Server rodando em: http://localhost:${PORT}`);
});
