const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const omadaAPI = require('./omada-api');
const pagomobil = require('./pagomobil');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Ruta principal - Recibe la redirección del OC200
app.get('/auth', (req, res) => {
    const { clientMac, apMac, ssidName, radioId, site, redirectUrl, t } = req.query;

    console.log('📱 Nueva conexión:', { clientMac, apMac, ssidName });

    // Guardar los datos en la sesión (usando query params por simplicidad)
    // En producción, usa express-session o JWT
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para procesar el pago
app.post('/verify-payment', async (req, res) => {
    const { referenceNumber, clientMac, apMac, ssidName } = req.body;

    console.log(`🔍 Verificando pago: ${referenceNumber} para cliente ${clientMac}`);

    // 1. Verificar el pago con Pagomobil
    const paymentResult = await pagomobil.verifyPayment(referenceNumber);

    if (!paymentResult.success) {
        return res.json({
            success: false,
            message: paymentResult.message
        });
    }

    // 2. Si el pago es válido, autorizar al cliente en Omada
    const time = parseInt(process.env.DEFAULT_ACCESS_TIME) || 1440; // 24 horas por defecto
    const authResult = await omadaAPI.authorizeClient(clientMac, apMac, ssidName, time);

    if (authResult) {
        res.json({
            success: true,
            message: `¡Pago exitoso! Tienes acceso a internet por ${time} minutos.`,
            redirectUrl: 'https://google.com' // O tu landing page
        });
    } else {
        res.json({
            success: false,
            message: 'Error al autorizar el acceso. Contacta al administrador.'
        });
    }
});

// Ruta de éxito
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});



// Health check endpoint para Docker
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Portal externo corriendo en puerto ${PORT}`);
    console.log(`📡 Esperando conexiones del OC200...`);
});
