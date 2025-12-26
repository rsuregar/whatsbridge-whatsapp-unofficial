import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Import Routes
import whatsappRoutes from './src/routes/whatsapp';

// Import Middleware
import apiKeyAuth from './src/middleware/apiKeyAuth';

// Import WebSocket Manager
import wsManager from './src/services/websocket/WebSocketManager';

// Initialize WebSocket
wsManager.initialize(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*'
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder (for media access)
app.use('/media', express.static(path.join(__dirname, 'public', 'media')));

// Serve Dashboard
app.get('/dashboard', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve WebSocket test page
app.get('/ws-test', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'websocket-test.html'));
});

// Swagger UI Options
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .info .title { color: #25D366 }
    `,
    customSiteTitle: 'WhatsBridge API - Documentation',
    customfavIcon: '/media/favicon.ico'
};

// API Documentation (Swagger UI) at root
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Swagger JSON endpoint
app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Dashboard Login
app.post('/api/dashboard/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
    const validPassword = process.env.DASHBOARD_PASSWORD || 'admin123';
    
    if (username === validUsername && password === validPassword) {
        res.json({
            success: true,
            message: 'Login successful'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});

// WebSocket Stats
app.get('/api/websocket/stats', (req: Request, res: Response) => {
    res.json({
        success: true,
        data: wsManager.getStats()
    });
});

// WhatsApp Routes (with API Key Authentication)
app.use('/api/whatsapp', apiKeyAuth, whatsappRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`WhatsBridge API running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}`);
});

