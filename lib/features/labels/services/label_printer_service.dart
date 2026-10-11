import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../inventory/models/inventory_item_model.dart';
import '../../hardware/services/deep_link_qr_service.dart';

enum ThermalLabelPreset {
  standard50x30, // Niimbot, Brother, Xprinter (50mm x 30mm)
  dymo30252,     // Dymo LabelWriter 30252 (89mm x 28mm)
}

class LabelPrinterService {
  /// Genera una etiqueta térmica formateada para Dymo, Brother y Niimbot con Deep Link y Short ID
  static Future<Uint8List> generateThermalLabelPdf(
    InventoryItem item, {
    ThermalLabelPreset preset = ThermalLabelPreset.standard50x30,
  }) async {
    final pdf = pw.Document();

    final labelPageFormat = preset == ThermalLabelPreset.dymo30252
        ? const PdfPageFormat(
            89 * PdfPageFormat.mm,
            28 * PdfPageFormat.mm,
            marginAll: 2 * PdfPageFormat.mm,
          )
        : const PdfPageFormat(
            50 * PdfPageFormat.mm,
            30 * PdfPageFormat.mm,
            marginAll: 2 * PdfPageFormat.mm,
          );

    // Deep link oficial codificado en la matriz QR: alacena://item/{itemId}
    final qrPayload = DeepLinkQrService.formatItemDeepLink(
      item.id,
      workspaceId: item.tenantId,
    );

    pdf.addPage(
      pw.Page(
        pageFormat: labelPageFormat,
        build: (pw.Context context) {
          return pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              // Columna Izquierda: Código QR con Deep Link + Short ID legible inferior
              pw.Column(
                mainAxisAlignment: pw.MainAxisAlignment.center,
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Container(
                    width: 20 * PdfPageFormat.mm,
                    height: 20 * PdfPageFormat.mm,
                    child: pw.BarcodeWidget(
                      barcode: pw.Barcode.qrCode(),
                      data: qrPayload,
                      drawText: false,
                    ),
                  ),
                  pw.SizedBox(height: 1 * PdfPageFormat.mm),
                  pw.Text(
                    item.effectiveShortId,
                    style: pw.TextStyle(
                      fontSize: 6,
                      fontWeight: pw.FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              pw.SizedBox(width: 3 * PdfPageFormat.mm),

              // Columna Derecha: Información tipográfica de alta legibilidad
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  mainAxisAlignment: pw.MainAxisAlignment.center,
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          'ALACENA',
                          style: pw.TextStyle(
                            fontSize: 6,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColors.grey700,
                          ),
                        ),
                        pw.Text(
                          item.category.toUpperCase(),
                          style: const pw.TextStyle(
                            fontSize: 5,
                            color: PdfColors.grey600,
                          ),
                        ),
                      ],
                    ),
                    pw.SizedBox(height: 1.5 * PdfPageFormat.mm),
                    pw.Text(
                      item.name,
                      style: pw.TextStyle(
                        fontSize: 8.5,
                        fontWeight: pw.FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: pw.TextOverflow.clip,
                    ),
                    pw.SizedBox(height: 2 * PdfPageFormat.mm),
                    pw.Text(
                      '📍 ${item.zoneName}',
                      style: const pw.TextStyle(fontSize: 6.5),
                    ),
                    pw.Text(
                      'Stock Ideal: ${item.idealQuantity} ${item.unit}',
                      style: const pw.TextStyle(fontSize: 5.5, color: PdfColors.grey700),
                    ),
                    if (item.isHighValue)
                      pw.Container(
                        margin: const pw.EdgeInsets.only(top: 1.5),
                        padding: const pw.EdgeInsets.symmetric(horizontal: 2.5, vertical: 1),
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

  /// Dispara el diálogo nativo de impresión hacia la impresora térmica seleccionada
  static Future<void> printLabel(
    InventoryItem item, {
    ThermalLabelPreset preset = ThermalLabelPreset.standard50x30,
  }) async {
    final pdfBytes = await generateThermalLabelPdf(item, preset: preset);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'Etiqueta_${item.effectiveShortId}_${item.name}',
    );
  }
}
