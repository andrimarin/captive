const axios = require('axios');
require('dotenv').config();

class PagomobilService {
    constructor() {
        this.apiUrl = process.env.PAGOMOBIL_API_URL;
        this.apiKey = process.env.PAGOMOBIL_API_KEY;
        this.merchantId = process.env.PAGOMOBIL_MERCHANT_ID;
    }

    /**
     * Verifica si un pago fue realizado
     * @param {string} referenceNumber - Número de referencia del pago
     * @returns {Promise<Object>} - { success: boolean, message: string }
     */
    async verifyPayment(referenceNumber) {
        try {
            // ⚠️ ESTO ES UN EJEMPLO - AJUSTA SEGÚN LA API REAL DE PAGOMOBIL
            const response = await axios.post(this.apiUrl, {
                merchant_id: this.merchantId,
                api_key: this.apiKey,
                reference: referenceNumber
            });

            // Ejemplo de respuesta esperada de Pagomobil:
            // { status: "success", data: { paid: true, amount: 100, timestamp: 1234567890 } }

            if (response.data && response.data.data && response.data.data.paid) {
                return {
                    success: true,
                    message: 'Pago verificado exitosamente',
                    data: response.data.data
                };
            } else {
                return {
                    success: false,
                    message: 'Pago no encontrado o no válido'
                };
            }
        } catch (error) {
            console.error('Error verificando pago:', error.message);
            return {
                success: false,
                message: 'Error al verificar el pago. Intenta de nuevo.'
            };
        }
    }

    /**
     * Alternativa: Verificar por comprobante (si Pagomobil permite subir imágenes)
     */
    async verifyByReceipt(receiptData) {
        // Implementar según la API de Pagomobil
        return { success: false, message: 'No implementado aún' };
    }
}

module.exports = new PagomobilService();