// Script para generar iconos PWA básicos
// Ejecutar en la consola del navegador

function generateAndDownloadIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#FE2C55');
    gradient.addColorStop(1, '#ff6b7a');
    
    // Dibujar fondo redondeado
    const radius = size * 0.125; // 12.5% del tamaño para esquinas redondeadas
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    
    // Dibujar letra "Z"
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', size / 2, size / 2);
    
    // Descargar
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `icon-${size}x${size}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

// Generar todos los tamaños necesarios
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach((size, index) => {
    setTimeout(() => {
        generateAndDownloadIcon(size);
    }, index * 500); // Delay para evitar problemas de descarga
});

console.log('Generando iconos PWA...');
console.log('Se descargarán automáticamente los siguientes tamaños:', sizes);