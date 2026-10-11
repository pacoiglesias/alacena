import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:alacena/main.dart';

void main() {
  testWidgets('Alacena app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: AlacenaApp(),
      ),
    );

    // Verify header and navigation
    expect(find.text('RESIDENCIA ACTIVA'), findsOneWidget);
    expect(find.text('Alacena'), findsOneWidget);
  });
}
