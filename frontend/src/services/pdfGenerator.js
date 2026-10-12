import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generador Oficial de PDF de Lista de Compras de ALACENA Enterprise
 * Crea un archivo PDF vectorial puro de alta calidad para imprimir o compartir
 */
export function generateShoppingListPdf({
  items = [],
  activeHouse = null,
  totalEstimatedMxn = 0,
  groupBy = 'dept', // 'dept' | 'store'
  showPrices = true,
  showSignatures = true,
  itemsByDept = [],
  itemsByStore = [],
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter', // 215.9 x 279.4 mm
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const houseName = (activeHouse?.name || 'RESIDENCIA PRINCIPAL').toUpperCase();
  const dateStr = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // -------------------------------------------------------------
  // 1. CABECERA EDITORIAL
  // -------------------------------------------------------------
  // Monograma "A" decorativo
  doc.setFillColor(26, 22, 20);
  doc.roundedRect(margin, currentY, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('A', margin + 3.2, currentY + 7.2);

  // Título institucional
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ALACENA ENTERPRISE  •  GESTIÓN PATRIMONIAL', margin + 13, currentY + 4);

  // Nombre principal
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LISTA OFICIAL DE COMPRAS', margin + 13, currentY + 9.5);

  // Caja de resumen superior derecha
  const boxWidth = 65;
  const boxX = pageWidth - margin - boxWidth;
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(boxX, currentY - 1, boxWidth, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Insumos:', boxX + 4, currentY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`${items.length} artículos`, boxX + 32, currentY + 4);

  if (showPrices) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Presupuesto:', boxX + 4, currentY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // Color ámbar elegante
    doc.text(`$${totalEstimatedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`, boxX + 32, currentY + 10);
  }

  currentY += 15;

  // Subtítulo con metadata de residencia y fecha
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(`RESIDENCIA: ${houseName}`, margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 110);
  doc.text(`Generada: ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} • Ordenada por ${groupBy === 'dept' ? 'Pasillos Físicos' : 'Proveedor / Tienda'}`, margin, currentY + 4.5);

  // Línea divisoria principal
  currentY += 7.5;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // -------------------------------------------------------------
  // 2. TABLAS AGRUPADAS
  // -------------------------------------------------------------
  const groups = groupBy === 'dept'
    ? itemsByDept.map(([_, g]) => ({ title: g.name, items: g.items }))
    : itemsByStore.map(([storeName, its]) => ({ title: `TIENDA: ${storeName.toUpperCase()}`, items: its }));

  groups.forEach((group) => {
    if (!group.items || group.items.length === 0) return;

    // Verificar si queda suficiente espacio para el encabezado y al menos 2 filas
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = margin + 5;
    }

    // Encabezado del grupo
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 6.5, 'FD');

    // Borde izquierdo de acento vino tinto
    doc.setFillColor(107, 31, 46);
    doc.rect(margin, currentY, 2.5, 6.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(group.title.toUpperCase(), margin + 5, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${group.items.length} ${group.items.length === 1 ? 'artículo' : 'artículos'}`, pageWidth - margin - 20, currentY + 4.5);

    currentY += 6.5;

    // Filas para autoTable
    const tableData = group.items.map((it) => {
      const priceStr = showPrices && it.estimatedPriceMxn
        ? `$${((it.estimatedPriceMxn || 0) * (it.quantity || 1)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '-';

      const desc = it.notes ? `${it.name}\n(Nota: ${it.notes})` : it.name;

      return [
        '[  ]', // Casilla de verificación para marcar con pluma
        desc,
        `${it.quantity} ${it.unit}`,
        it.store || 'Supermercado',
        priceStr,
      ];
    });

    const columns = [
      { header: '[ ]', dataKey: 'check' },
      { header: 'Producto / Descripción', dataKey: 'desc' },
      { header: 'Cantidad', dataKey: 'qty' },
      { header: 'Tienda Sugerida', dataKey: 'store' },
    ];

    if (showPrices) {
      columns.push({ header: 'Total MXN', dataKey: 'price' });
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [columns.map((c) => c.header)],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.2,
        textColor: [30, 30, 30],
        lineColor: [230, 230, 230],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [250, 250, 250],
        textColor: [70, 70, 70],
        fontStyle: 'bold',
        fontSize: 7.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { fontStyle: 'bold' },
        2: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 32, halign: 'left', textColor: [90, 90, 90] },
        4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: () => {
        // En caso de salto de página automático dentro de la tabla
      },
    });

    currentY = doc.lastAutoTable.finalY + 4;
  });

  // -------------------------------------------------------------
  // 3. INSTRUCCIONES Y FIRMAS
  // -------------------------------------------------------------
  if (showSignatures) {
    if (currentY > pageHeight - 48) {
      doc.addPage();
      currentY = margin + 5;
    }

    currentY += 3;
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // Caja de instrucciones para personal
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text('INSTRUCCIONES PARA EL ENCARGADO DE COMPRAS:', margin + 3, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text('• Cotejar frescura y fechas de caducidad con al menos 15 días de holgura.', margin + 3, currentY + 7.5);
    doc.text('• Conservar tickets de caja y solicitar factura a nombre de la razón social del Hogar.', margin + 3, currentY + 10.5);

    currentY += 19;

    // Firmas
    const colWidth = (pageWidth - (margin * 2) - 15) / 2;
    const signX1 = margin;
    const signX2 = margin + colWidth + 15;

    // Firma 1
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    doc.line(signX1 + 5, currentY + 8, signX1 + colWidth - 5, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text('FIRMA ENCARGADO DE COMPRAS', signX1 + (colWidth / 2), currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text('Entregado para surtir en tienda', signX1 + (colWidth / 2), currentY + 15, { align: 'center' });

    // Firma 2
    doc.line(signX2 + 5, currentY + 8, signX2 + colWidth - 5, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text('RECIBIDO Y VERIFICADO EN ALACENA', signX2 + (colWidth / 2), currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text('Recepción y cotejo de stock en cocina', signX2 + (colWidth / 2), currentY + 15, { align: 'center' });
  }

  // -------------------------------------------------------------
  // 4. PIE DE PÁGINA Y NÚMERO DE PÁGINA
  // -------------------------------------------------------------
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `ALACENA Enterprise • ${houseName} • Documento de Control Operativo`,
      margin,
      pageHeight - 6
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Generar y descargar el archivo PDF
  const cleanHouse = (activeHouse?.name || 'alacena').toLowerCase().replace(/\s+/g, '-');
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `lista-super-${cleanHouse}-${cleanDate}.pdf`;

  doc.save(filename);
  return filename;
}
