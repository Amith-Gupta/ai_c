"""
Comprehensive unit tests for the AI Calc (ai_c) engine.
Runs with standard Python `python test.py` or with `pytest`.
"""

import math
import unittest
from calculator import (
    add,
    subtract,
    multiply,
    divide,
    power,
    modulo,
    evaluate_expression,
    stats,
)


class TestAICalc(unittest.TestCase):
    """Test suite covering core arithmetic, AST evaluation, and statistics."""

    def test_add(self):
        """Verify addition (preserves original baseline tests)."""
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-1, 1), 0)
        self.assertEqual(add(0, 0), 0)
        self.assertEqual(add(1.5, 2.5), 4.0)

    def test_subtract(self):
        """Verify subtraction."""
        self.assertEqual(subtract(10, 4), 6)
        self.assertEqual(subtract(3, 7), -4)
        self.assertEqual(subtract(0, 0), 0)

    def test_multiply(self):
        """Verify multiplication."""
        self.assertEqual(multiply(3, 4), 12)
        self.assertEqual(multiply(-2, 5), -10)
        self.assertEqual(multiply(0, 100), 0)

    def test_divide(self):
        """Verify division and zero division error handling."""
        self.assertEqual(divide(10, 2), 5.0)
        self.assertEqual(divide(7, 2), 3.5)
        with self.assertRaises(ZeroDivisionError):
            divide(5, 0)

    def test_power_and_modulo(self):
        """Verify exponentiation and modulo."""
        self.assertEqual(power(2, 3), 8)
        self.assertEqual(power(9, 0.5), 3.0)
        self.assertEqual(modulo(10, 3), 1)
        with self.assertRaises(ZeroDivisionError):
            modulo(10, 0)

    def test_evaluate_expression_basic(self):
        """Verify AST expression parsing for standard arithmetic."""
        self.assertEqual(evaluate_expression("2 + 3 * 4"), 14)
        self.assertEqual(evaluate_expression("(2 + 3) * 4"), 20)
        self.assertEqual(evaluate_expression("100 / 4 - 5"), 20)
        self.assertEqual(evaluate_expression("2^3 + 1"), 9)
        self.assertEqual(evaluate_expression("-5 + 10"), 5)

    def test_evaluate_expression_scientific(self):
        """Verify scientific functions and constants."""
        self.assertEqual(evaluate_expression("sqrt(144)"), 12)
        self.assertEqual(evaluate_expression("abs(-42)"), 42)
        self.assertTrue(math.isclose(evaluate_expression("sin(pi / 2)"), 1.0))
        self.assertTrue(math.isclose(evaluate_expression("cos(0)"), 1.0))
        self.assertEqual(evaluate_expression("factorial(5)"), 120)
        self.assertTrue(math.isclose(evaluate_expression("ln(e)"), 1.0))

    def test_evaluate_expression_variables(self):
        """Verify variable substitution."""
        res = evaluate_expression("3 * x + 4 * y", variables={"x": 5, "y": 2})
        self.assertEqual(res, 23)

    def test_evaluate_expression_safety(self):
        """Ensure safe evaluator forbids dangerous operations."""
        with self.assertRaises(ValueError):
            evaluate_expression("__import__('os').system('echo hack')")

        with self.assertRaises(ZeroDivisionError):
            evaluate_expression("10 / 0")

    def test_stats(self):
        """Verify summary statistics calculation."""
        data = [10, 20, 30, 40, 50]
        res = stats(data)
        self.assertEqual(res["count"], 5)
        self.assertEqual(res["mean"], 30.0)
        self.assertEqual(res["median"], 30)
        self.assertEqual(res["min"], 10)
        self.assertEqual(res["max"], 50)
        self.assertEqual(res["variance"], 250.0)


# Backward compatibility with original test script function call
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(0, 0) == 0


if __name__ == "__main__":
    test_add()
    unittest.main(verbosity=2)
