from pathlib import Path
import sys
import unittest


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.analytics.performance import calculate_return_metrics, relative_strength_index  # noqa: E402


class PerformanceAnalyticsTests(unittest.TestCase):
    def test_return_metrics_include_positive_return(self) -> None:
        history = [
            {"close": 100.0},
            {"close": 104.0},
            {"close": 110.0},
        ]

        metrics = calculate_return_metrics(history)

        self.assertEqual(metrics.absolute_return, 10.0)
        self.assertEqual(metrics.percent_return, 10.0)
        self.assertGreaterEqual(metrics.annualized_volatility, 0.0)

    def test_rsi_stays_in_valid_band(self) -> None:
        closes = [100.0, 102.0, 101.5, 103.0, 104.2, 103.8, 105.0, 106.3, 105.9, 107.4]

        value = relative_strength_index(closes)

        self.assertGreaterEqual(value, 0.0)
        self.assertLessEqual(value, 100.0)


if __name__ == "__main__":
    unittest.main()
