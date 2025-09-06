// src/components/SignaturePad.js
import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({
 label,
 name,
 value,
 onChange,
 width = 400,
 height = 150,
 className = "",
 required = false
}) => {
 const canvasRef = useRef(null);
 const [isDrawing, setIsDrawing] = useState(false);
 const [isEmpty, setIsEmpty] = useState(true);

 useEffect(() => {
   const canvas = canvasRef.current;
   if (!canvas) return;
   
   const ctx = canvas.getContext('2d', { willReadFrequently: true });
   canvas.width = width;
   canvas.height = height;
   ctx.strokeStyle = '#000000';
   ctx.lineWidth = 2;
   ctx.lineCap = 'round';
   ctx.lineJoin = 'round';
   ctx.fillStyle = '#ffffff';
   ctx.fillRect(0, 0, width, height);

   if (value) {
     const img = new Image();
     img.onload = () => {
       ctx.clearRect(0, 0, width, height);
       ctx.fillStyle = '#ffffff';
       ctx.fillRect(0, 0, width, height);
       ctx.drawImage(img, 0, 0, width, height);
       setIsEmpty(false);
     };
     img.src = value;
   }
 }, [width, height, value]);

 const getCoordinates = (e) => {
   const canvas = canvasRef.current;
   const rect = canvas.getBoundingClientRect();
   const scaleX = canvas.width / rect.width;
   const scaleY = canvas.height / rect.height;

   if (e.touches && e.touches[0]) {
     return {
       x: (e.touches[0].clientX - rect.left) * scaleX,
       y: (e.touches[0].clientY - rect.top) * scaleY,
     };
   } else {
     return {
       x: (e.clientX - rect.left) * scaleX,
       y: (e.clientY - rect.top) * scaleY,
     };
   }
 };

 const startDrawing = (e) => {
   e.preventDefault();
   setIsDrawing(true);
   const canvas = canvasRef.current;
   const ctx = canvas.getContext('2d', { willReadFrequently: true });
   const { x, y } = getCoordinates(e);

   ctx.beginPath();
   ctx.moveTo(x, y);
 };

 const draw = (e) => {
   e.preventDefault();
   if (!isDrawing) return;

   const canvas = canvasRef.current;
   const ctx = canvas.getContext('2d', { willReadFrequently: true });
   const { x, y } = getCoordinates(e);

   ctx.lineTo(x, y);
   ctx.stroke();
   setIsEmpty(false);
 };

 const stopDrawing = (e) => {
   e.preventDefault();
   if (!isDrawing) return;

   setIsDrawing(false);
   const canvas = canvasRef.current;
   const dataURL = canvas.toDataURL('image/png');
   
   // Correção: Chama onChange com name e dataURL
   if (onChange && name) {
     onChange(name, dataURL);
   }
 };

 const clearSignature = () => {
   const canvas = canvasRef.current;
   const ctx = canvas.getContext('2d', { willReadFrequently: true });
   ctx.clearRect(0, 0, width, height);
   ctx.fillStyle = '#ffffff';
   ctx.fillRect(0, 0, width, height);
   setIsEmpty(true);
   
   // Correção: Chama onChange com name e string vazia
   if (onChange && name) {
     onChange(name, '');
   }
 };

 const saveSignature = () => {
   const canvas = canvasRef.current;
   const dataURL = canvas.toDataURL('image/png');
   
   // Correção: Chama onChange com name e dataURL
   if (onChange && name) {
     onChange(name, dataURL);
   }
 };

 return (
   <div className={`signature-pad-container ${className}`}>
     {label && (
       <label className="block text-sm font-medium text-gray-700 mb-2">
         {label} {required && <span className="text-red-500">*</span>}
       </label>
     )}

     <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
       <canvas
         ref={canvasRef}
         className="border border-gray-200 rounded cursor-crosshair touch-none"
         style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
         onMouseDown={startDrawing}
         onMouseMove={draw}
         onMouseUp={stopDrawing}
         onMouseLeave={stopDrawing}
         onTouchStart={startDrawing}
         onTouchMove={draw}
         onTouchEnd={stopDrawing}
       />

       <div className="flex justify-between items-center mt-3">
         <div className="text-xs text-gray-500">
           {isEmpty ? 'Clique e arraste para assinar' : 'Assinatura capturada'}
         </div>

         <div className="flex space-x-2">
           <button
             type="button"
             onClick={clearSignature}
             className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
           >
             Limpar
           </button>
           <button
             type="button"
             onClick={saveSignature}
             className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
           >
             Salvar
           </button>
         </div>
       </div>
     </div>

     {/* Preview da assinatura salva */}
     {value && (
       <div className="mt-2">
         <div className="text-xs text-gray-500 mb-1">Preview da assinatura:</div>
         <img 
           src={value} 
           alt="Assinatura" 
           className="border border-gray-200 rounded max-w-xs h-auto"
         />
       </div>
     )}
   </div>
 );
};

export default SignaturePad;