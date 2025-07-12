// frontend/src/services/exporter.js

import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'; // FIX: Import autoTable as a function

export const generatePDF = (analysisResult, fileName, canvas) => {
    if (analysisResult.length === 0) {
        alert("Please analyze a floorplan first.");
        return;
    }

    const doc = new jsPDF();
    
    // Add document title
    doc.setFontSize(18);
    doc.text("Floorplan Analysis Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`File: ${fileName || 'N/A'}`, 14, 30);

    // Add the floorplan image if the canvas exists and has been drawn on
    let tableStartY = 40;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', 14, 40, pdfWidth - 28, pdfHeight);
        tableStartY = pdfHeight + 50; // Position table below the image
    }

    // Prepare table data
    const tableColumn = ["Room", "Object", "Width (m)", "Height (m)", "Area (m²)"];
    const tableRows = analysisResult.map(item => [
        item.room,
        item.object_class,
        item.width_m,
        item.height_m,
        (item.width_m * item.height_m).toFixed(2)
    ]);

    // FIX: Call autoTable as a function, passing the doc instance
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: tableStartY,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] }, // A nice teal color for the header
    });
    
    doc.save("floorplan_report.pdf");
};

export const generateCSV = (analysisResult) => {
    if (analysisResult.length === 0) {
        alert("Please analyze a floorplan first.");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Room,Object,Width (m),Height (m),Area (m²)\n";
    analysisResult.forEach(item => {
        const area = (item.width_m * item.height_m).toFixed(2);
        csvContent += `${item.room},${item.object_class},${item.width_m},${item.height_m},${area}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "floorplan_analysis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};