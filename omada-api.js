const axios = require('axios');
require('dotenv').config();

class OmadaAPI {
    constructor() {
        this.baseURL = process.env.OMADA_BASE_URL;
        this.controllerId = process.env.OMADA_CONTROLLER_ID;
        this.username = process.env.OMADA_USERNAME;
        this.password = process.env.OMADA_PASSWORD;
        this.csrfToken = null;
        this.axiosInstance = axios.create({
            baseURL: `${this.baseURL}/${this.controllerId}`,
            timeout: 10000,
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });
    }

    // Login en el Controller
    async login() {
        try {
            const response = await this.axiosInstance.post('/api/v2/hotspot/login', {
                name: this.username,
                password: this.password
            });

            if (response.data.errorCode === 0) {
                this.csrfToken = response.data.result.csrfToken;
                console.log('✅ Login exitoso en Omada Controller');
                return true;
            } else {
                console.error('❌ Error en login:', response.data.msg);
                return false;
            }
        } catch (error) {
            console.error('❌ Error de conexión con Omada:', error.message);
            return false;
        }
    }

    // Autorizar un cliente
    async authorizeClient(clientMac, apMac, ssidName, time) {
        try {
            // Asegurarse de estar logueado
            if (!this.csrfToken) {
                const loginSuccess = await this.login();
                if (!loginSuccess) return false;
            }

            const response = await this.axiosInstance.post('/api/v2/hotspot/extPortal/auth', {
                clientMac: clientMac,
                apMac: apMac,
                ssidName: ssidName,
                time: time,
                authType: 3  // 3 = External Portal
            }, {
                headers: {
                    'Csrf-Token': this.csrfToken
                }
            });

            if (response.data.errorCode === 0) {
                console.log(`✅ Cliente ${clientMac} autorizado por ${time} minutos`);
                return true;
            } else {
                console.error('❌ Error al autorizar cliente:', response.data.msg);
                return false;
            }
        } catch (error) {
            console.error('❌ Error en authorizeClient:', error.message);
            // Si el token expiró, reintentar con nuevo login
            if (error.response && error.response.status === 404) {
                this.csrfToken = null;
                return this.authorizeClient(clientMac, apMac, ssidName, time);
            }
            return false;
        }
    }

    // Logout del Controller
    async logout() {
        try {
            if (this.csrfToken) {
                await this.axiosInstance.post('/api/v2/hotspot/logout', {}, {
                    headers: { 'Csrf-Token': this.csrfToken }
                });
                this.csrfToken = null;
                console.log('🔒 Logout exitoso');
            }
        } catch (error) {
            console.error('Error en logout:', error.message);
        }
    }
}

module.exports = new OmadaAPI();