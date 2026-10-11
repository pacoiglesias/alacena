import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../inventory/models/inventory_item_model.dart';

class LabelPrinterService {
  /// Genera una etiqueta térmica formateada para Dymo, Brother y Niimbot (50mm x 30mm)
  static Future<Uint8List> generateThermalLabelPdf(InventoryItem item) async {
    final pdf = pw.Document();

    // Formato de etiqueta térmica estándar: 50mm x 30mm (142pt x 85pt)
    const labelPageFormat = PdfPageFormat(
      50 * PdfPageFormat.mm,
      30 * PdfPageFormat.mm,
      marginAll: 2 * PdfPageFormat.mm,
    );

    pdf.addPage(
      pw.Page(
        pageFormat: labelPageFormat,
        build: (pw.Context context) {
          return pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              // Código QR + Fallback Alfanumérico Corto (Short ID)
              pw.Column(
                mainAxisAlignment: pw.MainAxisAlignment.center,
                children: [
                  pw.Container(
                    width: 20 * PdfPageFormat.mm,
                    height: 20 * PdfPageFormat.mm,
                    child: pw.BarcodeWidget(
                      barcode: pw.Barcode.qrCode(),
                      data: item.qrCode,
                      drawText: false,
                    ),
                  ),
                  pw.SizedBox(height: 0.8 * PdfPageFormat.mm),
                  pw.Text(
                    item.effectiveShortId,
                    style: pw.TextStyle(
                      fontSize: 5.5,
                      fontWeight: pw.FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              pw.SizedBox(width: 2.5 * PdfPageFormat.mm),

              // Información tipográfica de la etiqueta
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  mainAxisAlignment: pw.MainAxisAlignment.center,
                  children: [
                    pw.Text(
                      'ALACENA',
                      style: pw.TextStyle(
                        fontSize: 6,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.grey700,
                      ),
                    ),
                    pw.SizedBox(height: 1),
                    pw.Text(
                      item.name,
                      style: pw.TextStyle(
                        fontSize: 8,
                        fontWeight: pw.FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: pw.TextOverflow.clip,
                    ),
                    pw.SizedBox(height: 2),
                    pw.Text(
                      '📍 ${item.zoneName}',
                      style: const pw.TextStyle(fontSize: 6),
                    ),
                    pw.Text(
                      'Stock Ideal: ${item.idealQuantity} ${item.unit}',
                      style: const pw.TextStyle(fontSize: 5, color: PdfColors.grey600),
                    ),
                    if (item.isHighValue)
                      pw.Container(
                        margin: const pw.EdgeInsets.only(top: 2),
                        padding: const pw.EdgeInsets.symmetric(horizontal: 2, vertical: 1),
                        color: PdfColors.grey900,
                        child: pw.Text(
                          'ALTO VALOR',
                          style: const pw.TextStyle(fontSize: 5, color: PdfColors.white),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  /// Dispara el diálogo nativo de impresión hacia la impresora térmica detectada
  static Future<void> printLabel(InventoryItem item) async {
    final pdfBytes = await generateThermalLabelPdf(item);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'Etiqueta_${item.name}',
    );
  }
}
