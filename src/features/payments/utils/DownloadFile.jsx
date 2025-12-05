const downloadFile = (content, filename, type) => {
    try {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error al intentar descargar el archivo:", error);
        alert("Hubo un error al generar el archivo.");
    }
};

export default downloadFile;