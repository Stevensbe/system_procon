/**
 * Serviço para Google Cloud Vision API
 * Leitura de códigos de barras usando OCR avançado
 */

export class GoogleVisionService {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.REACT_APP_GOOGLE_VISION_API_KEY;
        this.baseUrl = 'https://vision.googleapis.com/v1/images:annotate';
    }

    /**
     * Escaneia uma imagem em busca de códigos de barras
     * @param {string} imageData - Imagem em base64 (com ou sem prefixo data:image/...)
     * @returns {Promise<Array>} Array de códigos detectados
     */
    async scanBarcode(imageData) {
        if (!this.apiKey) {
            throw new Error('Google Vision API Key não configurada. Configure REACT_APP_GOOGLE_VISION_API_KEY');
        }

        // Remover prefixo data:image/... se existir
        const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;

        const requestBody = {
            requests: [
                {
                    image: { content: base64Image },
                    features: [
                        { type: 'TEXT_DETECTION', maxResults: 10 },
                        { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
                    ]
                }
            ]
        };

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Google Vision API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return this.processResults(data);
        } catch (error) {
            console.error('Erro na Google Vision API:', error);
            throw error;
        }
    }

    /**
     * Processa os resultados da API
     * @param {Object} data - Resposta da API
     * @returns {Array} Códigos detectados
     */
    processResults(data) {
        const detectedCodes = [];

        if (!data.responses || !data.responses[0]) {
            return detectedCodes;
        }

        const response = data.responses[0];

        // 1. Verificar TEXT_DETECTION (mais rápido)
        if (response.textAnnotations && response.textAnnotations.length > 0) {
            response.textAnnotations.forEach(annotation => {
                const text = annotation.description;
                const cleanText = text.replace(/\s/g, '');
                
                if (this.isValidBarcode(cleanText)) {
                    detectedCodes.push({
                        code: cleanText,
                        confidence: 0.9,
                        type: 'TEXT_DETECTION',
                        originalText: text
                    });
                }
            });
        }

        // 2. Verificar DOCUMENT_TEXT_DETECTION (mais preciso)
        if (response.fullTextAnnotation && response.fullTextAnnotation.text) {
            const fullText = response.fullTextAnnotation.text;
            const lines = fullText.split('\n');
            
            lines.forEach(line => {
                const cleanLine = line.replace(/\s/g, '');
                if (this.isValidBarcode(cleanLine)) {
                    detectedCodes.push({
                        code: cleanLine,
                        confidence: 0.95,
                        type: 'DOCUMENT_TEXT',
                        originalText: line
                    });
                }
            });
        }

        // 3. Verificar blocos de texto (para códigos quebrados)
        if (response.textAnnotations && response.textAnnotations.length > 1) {
            // Pular o primeiro elemento (contém todo o texto)
            for (let i = 1; i < response.textAnnotations.length; i++) {
                const annotation = response.textAnnotations[i];
                const text = annotation.description;
                const cleanText = text.replace(/\s/g, '');
                
                if (this.isValidBarcode(cleanText)) {
                    detectedCodes.push({
                        code: cleanText,
                        confidence: 0.85,
                        type: 'TEXT_BLOCK',
                        originalText: text
                    });
                }
            }
        }

        // Remover duplicatas e ordenar por confiança
        const uniqueCodes = this.removeDuplicates(detectedCodes);
        return uniqueCodes.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Verifica se um texto é um código de barras válido
     * @param {string} text - Texto para verificar
     * @returns {boolean} True se for um código válido
     */
    isValidBarcode(text) {
        // Códigos EAN-8 (8 dígitos)
        if (/^[0-9]{8}$/.test(text)) {
            return true;
        }
        
        // Códigos EAN-13 (13 dígitos)
        if (/^[0-9]{13}$/.test(text)) {
            return true;
        }
        
        // Códigos UPC-A (12 dígitos)
        if (/^[0-9]{12}$/.test(text)) {
            return true;
        }
        
        // Códigos UPC-E (8 dígitos, mas pode ser expandido)
        if (/^[0-9]{8}$/.test(text)) {
            return true;
        }
        
        // Códigos de 9-11 dígitos (comuns em alguns sistemas)
        if (/^[0-9]{9,11}$/.test(text)) {
            return true;
        }

        return false;
    }

    /**
     * Remove códigos duplicados
     * @param {Array} codes - Array de códigos
     * @returns {Array} Array sem duplicatas
     */
    removeDuplicates(codes) {
        const seen = new Set();
        return codes.filter(code => {
            if (seen.has(code.code)) {
                return false;
            }
            seen.add(code.code);
            return true;
        });
    }

    /**
     * Obtém o melhor código detectado
     * @param {Array} codes - Array de códigos
     * @returns {Object|null} Melhor código ou null
     */
    getBestCode(codes) {
        if (!codes || codes.length === 0) {
            return null;
        }
        
        // Retornar o código com maior confiança
        return codes.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );
    }
}

// Instância padrão
export const googleVisionService = new GoogleVisionService();

// Função de conveniência
export const scanBarcodeWithGoogleVision = async (imageData) => {
    const service = new GoogleVisionService();
    const codes = await service.scanBarcode(imageData);
    return service.getBestCode(codes);
};
