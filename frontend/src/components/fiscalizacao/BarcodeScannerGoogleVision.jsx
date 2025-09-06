import React, { useState, useEffect, useRef } from 'react';
import {
    CameraIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BarcodeScannerGoogleVision = ({ onScan, onClose, isOpen }) => {
    const [scanning, setScanning] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (isOpen && !scanning) {
            startCamera();
        } else if (!isOpen && scanning) {
            stopCamera();
        }
        return () => {
            if (scanning) {
                stopCamera();
            }
        };
    }, [isOpen]);

    const startCamera = async () => {
        setScanning(true);
        setError('');
        setSuccess(false);
        setScannedCode('');
        setDebugInfo('Iniciando câmera...');

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Navegador não suporta acesso à câmera');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            setDebugInfo('Câmera ativa! Posicione o código de barras e clique em "Capturar e Escanear".');
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            let errorMessage = error.message;
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permissão de câmera negada. Verifique as configurações do navegador.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Câmera está sendo usada por outro aplicativo.';
            }
            
            setError(`Erro ao acessar câmera: ${errorMessage}`);
            setDebugInfo(`Erro: ${error.name} - ${errorMessage}`);
            setScanning(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setScanning(false);
        setCapturedImage(null);
    };

    const captureImage = () => {
        if (!videoRef.current) return null;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const scanWithGoogleVision = async (imageData) => {
        setProcessing(true);
        setDebugInfo('Enviando imagem para Google Cloud Vision API...');

        try {
            // Remover o prefixo data:image/jpeg;base64,
            const base64Image = imageData.split(',')[1];

            const requestBody = {
                requests: [
                    {
                        image: { content: base64Image },
                        features: [
                            { type: 'TEXT_DETECTION', maxResults: 5 },
                            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
                        ]
                    }
                ]
            };

            const API_KEY = process.env.REACT_APP_GOOGLE_VISION_API_KEY;
            if (!API_KEY) {
                throw new Error('Google Vision API Key não configurada. Configure REACT_APP_GOOGLE_VISION_API_KEY');
            }

            const response = await fetch(
                `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Processar resultados
            const detectedCodes = [];
            
            if (data.responses && data.responses[0]) {
                const response = data.responses[0];
                
                // Verificar texto detectado
                if (response.textAnnotations && response.textAnnotations.length > 0) {
                    response.textAnnotations.forEach(annotation => {
                        const text = annotation.description;
                        // Verificar se o texto parece um código de barras (8-13 dígitos)
                        if (/^[0-9]{8,13}$/.test(text.replace(/\s/g, ''))) {
                            detectedCodes.push({
                                code: text.replace(/\s/g, ''),
                                confidence: 0.9,
                                type: 'TEXT_DETECTION'
                            });
                        }
                    });
                }
                
                // Verificar documento de texto (mais preciso)
                if (response.fullTextAnnotation && response.fullTextAnnotation.text) {
                    const fullText = response.fullTextAnnotation.text;
                    const lines = fullText.split('\n');
                    
                    lines.forEach(line => {
                        const cleanLine = line.replace(/\s/g, '');
                        if (/^[0-9]{8,13}$/.test(cleanLine)) {
                            detectedCodes.push({
                                code: cleanLine,
                                confidence: 0.95,
                                type: 'DOCUMENT_TEXT'
                            });
                        }
                    });
                }
            }

            if (detectedCodes.length > 0) {
                // Usar o código com maior confiança
                const bestCode = detectedCodes.reduce((best, current) => 
                    current.confidence > best.confidence ? current : best
                );
                
                setScannedCode(bestCode.code);
                setSuccess(true);
                setDebugInfo(`Código detectado: ${bestCode.code} (${bestCode.type})`);
                
                setTimeout(() => {
                    onScan(bestCode.code);
                }, 1000);
            } else {
                setError('Nenhum código de barras encontrado na imagem');
                setDebugInfo('Tente posicionar melhor o código de barras e capturar novamente');
            }
        } catch (apiError) {
            console.error('Erro na Google Vision API:', apiError);
            setError(`Erro na análise: ${apiError.message}`);
            setDebugInfo('Erro ao processar imagem. Verifique a configuração da API.');
        } finally {
            setProcessing(false);
        }
    };

    const handleCaptureAndScan = async () => {
        if (!scanning || processing) return;

        setDebugInfo('Capturando imagem...');
        const imageData = captureImage();
        
        if (imageData) {
            setCapturedImage(imageData);
            await scanWithGoogleVision(imageData);
        } else {
            setError('Erro ao capturar imagem');
        }
    };

    const retryScan = () => {
        setError('');
        setSuccess(false);
        setScannedCode('');
        setCapturedImage(null);
        setDebugInfo('Pronto para nova captura');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        📱 Escanear Código de Barras (Google Vision)
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Área da Câmera */}
                <div className="mb-4">
                    <div className="relative w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                        {error ? (
                            <div className="text-center p-4">
                                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                <p className="text-red-600 font-medium">{error}</p>
                            </div>
                        ) : success ? (
                            <div className="text-center p-4">
                                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                <p className="text-green-600 font-medium">Código detectado!</p>
                                <p className="text-sm text-gray-600 mt-1">{scannedCode}</p>
                            </div>
                        ) : scanning ? (
                            <>
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                {capturedImage && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <img
                                            src={capturedImage}
                                            alt="Capturado"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                )}
                                {processing && (
                                    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                            <p>Processando...</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">Iniciando câmera...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Canvas oculto para captura */}
                <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                />

                {/* Instruções */}
                <div className="mb-4 text-sm text-gray-600">
                    <ul className="space-y-1">
                        <li>• Posicione o código de barras na área da câmera</li>
                        <li>• Clique em "Capturar e Escanear"</li>
                        <li>• A imagem será enviada para Google Cloud Vision API</li>
                        <li>• Certifique-se de que há boa iluminação</li>
                    </ul>
                </div>

                {/* Status e Debug */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                            processing ? 'bg-yellow-100 text-yellow-800' :
                            scanning ? 'bg-green-100 text-green-800' : 
                            error ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {processing ? 'Processando' : scanning ? 'Ativo' : error ? 'Erro' : 'Parado'}
                        </span>
                    </div>
                    {scannedCode && (
                        <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">Código: </span>
                            <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">{scannedCode}</span>
                        </div>
                    )}
                    {debugInfo && (
                        <div className="text-xs text-gray-500">
                            <span className="font-medium">Debug: </span>{debugInfo}
                        </div>
                    )}
                </div>

                {/* Botões */}
                <div className="flex space-x-3">
                    {scanning && !success && !error && !processing && (
                        <button
                            onClick={handleCaptureAndScan}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            📸 Capturar e Escanear
                        </button>
                    )}
                    {error && (
                        <button
                            onClick={retryScan}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            🔄 Tentar Novamente
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Fechar
                    </button>
                </div>

                {/* Configuração da API */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">⚙️ Google Cloud Vision API:</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                        <p>• Configure a variável de ambiente: <code>REACT_APP_GOOGLE_VISION_API_KEY</code></p>
                        <p>• Ative a Google Cloud Vision API no Google Cloud Console</p>
                        <p>• Crie uma chave de API e configure as restrições necessárias</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerGoogleVision;
