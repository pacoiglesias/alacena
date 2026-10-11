import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:alacena/main.dart';

void main() {
  testWidgets('Alacena app login wall and authenticated navigation test', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 1920);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(
      const ProviderScope(
        child: AlacenaApp(),
      ),
    );
    await tester.pumpAndSettle();

    // 1. Verificar que el Muro de Autenticación bloquea el acceso anónimo
    expect(find.text('ALACENA'), findsOneWidget);
    final adminBtn = find.text('Entrar como Administrador (Precios & Gráficas)');
    expect(adminBtn, findsOneWidget);

    // 2. Realizar login con 1 toque como Administrador
    await tester.ensureVisible(adminBtn);
    await tester.tap(adminBtn);
    await tester.pumpAndSettle();

    // 3. Verificar que se despliega el MainScaffold protegido
    expect(find.text('RESIDENCIA ACTIVA'), findsOneWidget);
    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('Inventario'), findsOneWidget);
  });
}
