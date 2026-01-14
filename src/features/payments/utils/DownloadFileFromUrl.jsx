const downloadFileFromUrl = (url, filename) => {
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // Sugiere un nombre, aunque el servidor puede anularlo
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log(`Descarga directa de ${filename} iniciada.`);
    } catch (error) {
        console.error("Error al iniciar la descarga directa:", error);
    }
};

export default downloadFileFromUrl;