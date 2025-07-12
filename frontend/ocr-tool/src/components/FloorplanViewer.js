// frontend/src/components/FloorplanViewer.js

import React, { useRef, useEffect, useCallback } from 'react';

const FloorplanViewer = ({ imageUrl, analysisResult, highlightedRow, setHighlightedRow }) => {
    const canvasRef = useRef(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageUrl) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            // Scale canvas to fit container while maintaining aspect ratio
            const container = canvas.parentElement;
            const hRatio = container.clientWidth / img.width;
            const vRatio = container.clientHeight / img.height;
            const ratio = Math.min(hRatio, vRatio, 1); // Don't scale up beyond original size
            
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if (analysisResult && analysisResult.length > 0) {
                analysisResult.forEach((item, index) => {
                    // In a real app, the bbox would come from the backend.
                    // We'll use a placeholder if it's missing.
                    const bbox = item.bbox || { x: 20 + index * 10, y: 20, width: 100, height: 100 };
                    
                    const { x, y, width, height } = bbox;
                    const scaledBbox = {
                        x: x * ratio,
                        y: y * ratio,
                        width: width * ratio,
                        height: height * ratio,
                    };

                    const isHighlighted = highlightedRow === index;
                    ctx.strokeStyle = isHighlighted ? 'rgba(255, 255, 0, 1)' : 'rgba(59, 130, 246, 0.8)';
                    ctx.lineWidth = isHighlighted ? 4 : 2;
                    ctx.strokeRect(scaledBbox.x, scaledBbox.y, scaledBbox.width, scaledBbox.height);
                    
                    ctx.fillStyle = isHighlighted ? 'rgba(255, 255, 0, 0.4)' : 'rgba(59, 130, 246, 0.2)';
                    ctx.fillRect(scaledBbox.x, scaledBbox.y, scaledBbox.width, scaledBbox.height);
                });
            }
        };
    }, [imageUrl, analysisResult, highlightedRow]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const resizeObserver = new ResizeObserver(() => draw());
        if (canvas) {
            resizeObserver.observe(canvas.parentElement);
        }
        return () => resizeObserver.disconnect();
    }, [draw]);

    useEffect(() => {
        draw();
    }, [draw]);

    if (!imageUrl) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
                <p className="text-gray-500">Upload a file to see the floorplan</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-hidden bg-gray-200 rounded-lg p-2" onMouseLeave={() => setHighlightedRow(null)}>
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>
    );
};

export default FloorplanViewer;
