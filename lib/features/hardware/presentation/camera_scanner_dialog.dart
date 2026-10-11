import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/constants/app_colors.dart';

class ScanResult {
  final String? singleCode;
  final List<String> batchCodes;
  final bool isBatch;

  const ScanResult.single(this.singleCode)
      : batchCodes = const [],
        isBatch = false;

  const ScanResult.batch(this.batchCodes)
      : singleCode = null,
        isBatch = true;
}

class CameraScannerDialog extends StatefulWidget {
  final Function(ScanResult result) onScanned;

  const CameraScannerDialog({
    super.key,
    required this.onScanned,
  });

  static Future<ScanResult?> show(BuildContext context) {
    return showDialog<ScanResult>(
      context: context,
      barrierDismissible: true,
      builder: (context) => CameraScannerDialog(
        onScanned: (result) {
          Navigator.of(context).pop(result);
        },
      ),
    );
  }

  @override
  State<CameraScannerDialog> createState() => _CameraScannerDialogState();
}

class _CameraScannerDialogState extends State<CameraScannerDialog> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isScanned = false;
  bool _isContinuousMode = false;
  final List<String> _batchCodes = [];
  DateTime? _lastScannedTimestamp;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onBarcodeDetected(String code) {
    // Si estamos en Modo Continuo (Batch/Rapid Scan)
    if (_isContinuousMode) {
      final now = DateTime.now();
      // Debounce de 1.2 segundos para no duplicar el mismo código accidentalmente
      if (_lastScannedTimestamp != null &&
          now.difference(_lastScannedTimestamp!).inMilliseconds < 1200 &&
          _batchCodes.isNotEmpty &&
          _batchCodes.last == code) {
        return;
      }
      _lastScannedTimestamp = now;

      HapticFeedback.mediumImpact();
      setState(() {
        _batchCodes.add(code);
      });
      return;
    }

    // Modo Normal (1 código a la vez)
    if (_isScanned) return;
    _isScanned = true;
    HapticFeedback.lightImpact();
    widget.onScanned(ScanResult.single(code));
  }

  void _openManualShortIdDialog() {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.pin, color: AppColors.primaryLight),
            SizedBox(width: 8),
            Text('Ingreso de Short ID'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Usa este fallback si la etiqueta física está rota, borrosa o congelada:',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              autofocus: true,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                hintText: 'Ej. ALC-7X9B o 841000...',
                prefixIcon: const Icon(Icons.dialpad),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              final val = textController.text.trim();
              if (val.isNotEmpty) {
                Navigator.pop(dialogCtx);
                _onBarcodeDetected(val);
              }
            },
            child: const Text('Consultar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          color: Colors.black,
          height: 520,
          child: Stack(
            children: [
              // Visor nativo de cámara
              MobileScanner(
                controller: _controller,
                onDetect: (capture) {
                  final barcodes = capture.barcodes;
                  if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
                    _onBarcodeDetected(barcodes.first.rawValue!);
                  }
                },
                errorBuilder: (context, error) {
                  // Fallback para entornos sin cámara física (Web/Desktop)
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.videocam_off, size: 48, color: Colors.white70),
                          const SizedBox(height: 12),
                          const Text(
                            'Cámara no disponible en este entorno',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Puedes simular escaneos o teclear el Short ID:',
                            style: TextStyle(color: Colors.white60, fontSize: 12),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            alignment: WrapAlignment.center,
                            children: [
                              ElevatedButton.icon(
                                icon: const Icon(Icons.qr_code, size: 16),
                                label: const Text('Simular Vega Sicilia'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryLight,
                                  foregroundColor: Colors.white,
                                ),
                                onPressed: () => _onBarcodeDetected('ALACENA:casa-principal:cava:item_01'),
                              ),
                              ElevatedButton.icon(
                                icon: const Icon(Icons.barcode_reader, size: 16),
                                label: const Text('Simular EAN-13 Desconocido'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.low,
                                  foregroundColor: Colors.white,
                                ),
                                onPressed: () => _onBarcodeDetected('7509999888123'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

              // Marco de escaneo (Retícula láser)
              Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: _isContinuousMode ? 260 : 240,
                  height: _isContinuousMode ? 260 : 240,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _isContinuousMode ? const Color(0xFFF59E0B) : AppColors.optimal,
                      width: 2.8,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (_isContinuousMode ? const Color(0xFFF59E0B) : AppColors.optimal)
                            .withValues(alpha: 0.3),
                        blurRadius: 18,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
              ),

              // Header superior con controles
              Positioned(
                top: 14,
                left: 14,
                right: 14,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Badge de modo
                    InkWell(
                      onTap: () {
                        setState(() {
                          _isContinuousMode = !_isContinuousMode;
                        });
                        HapticFeedback.selectionClick();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: _isContinuousMode ? const Color(0xFFF59E0B) : Colors.black54,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _isContinuousMode ? Colors.white : Colors.transparent,
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _isContinuousMode ? Icons.all_inclusive : Icons.qr_code_scanner,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _isContinuousMode ? 'MODO LOTE ON' : '1 POR 1',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        // Botón de Short ID Manual
                        IconButton(
                          style: IconButton.styleFrom(backgroundColor: Colors.black54),
                          tooltip: 'Ingresar Short ID Manual',
                          icon: const Icon(Icons.dialpad, color: Colors.white, size: 20),
                          onPressed: _openManualShortIdDialog,
                        ),
                        const SizedBox(width: 6),
                        IconButton(
                          style: IconButton.styleFrom(backgroundColor: Colors.black54),
                          icon: const Icon(Icons.flash_on, color: Colors.white, size: 20),
                          onPressed: () => _controller.toggleTorch(),
                        ),
                        const SizedBox(width: 6),
                        IconButton(
                          style: IconButton.styleFrom(backgroundColor: Colors.black54),
                          icon: const Icon(Icons.close, color: Colors.white, size: 20),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Banner inferior para Modo Continuo / Finalizar Lote
              if (_isContinuousMode)
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.inventory, color: Color(0xFFF59E0B), size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  '${_batchCodes.length} artículos leídos',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                            const Text(
                              'Escanea sin interrupciones',
                              style: TextStyle(color: Colors.white60, fontSize: 10),
                            ),
                          ],
                        ),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF59E0B),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                          icon: const Icon(Icons.check_circle, size: 18),
                          label: const Text(
                            'Procesar Lote',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          onPressed: _batchCodes.isEmpty
                              ? null
                              : () {
                                  widget.onScanned(ScanResult.batch(_batchCodes));
                                },
                        ),
                      ],
                    ),
                  ),
                )
              else
                // Indicador inferior modo normal
                Positioned(
                  bottom: 16,
                  left: 20,
                  right: 20,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Apunta al QR o código de barras • Pulsa 🔢 para Short ID',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
