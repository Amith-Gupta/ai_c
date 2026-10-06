"""
AI Calc (ai_c) - Core Computational Engine
Supports safe AST expression parsing, arithmetic, scientific functions,
and statistical computations.
"""

import ast
import math
import operator
import sys
from typing import Any, Dict, List, Union

# Supported operators for AST evaluation
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

# Mathematical constants and functions
MATH_FUNCTIONS = {
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "sqrt": math.sqrt,
    "cbrt": lambda x: math.pow(x, 1 / 3) if x >= 0 else -math.pow(-x, 1 / 3),
    "log": math.log10,
    "ln": math.log,
    "exp": math.exp,
    "abs": abs,
    "floor": math.floor,
    "ceil": math.ceil,
    "round": round,
    "rad": math.radians,
    "deg": math.degrees,
    "factorial": math.factorial,
}

MATH_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
}


def add(a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
    """Return the sum of a and b (retained for backward compatibility)."""
    return a + b


def subtract(a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
    """Return the difference of a and b."""
    return a - b


def multiply(a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
    """Return the product of a and b."""
    return a * b


def divide(a: Union[int, float], b: Union[int, float]) -> float:
    """Return the quotient of a and b. Raises ZeroDivisionError on divide by zero."""
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b


def power(a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
    """Return a raised to the power of b."""
    return a**b


def modulo(a: Union[int, float], b: Union[int, float]) -> Union[int, float]:
    """Return a modulo b."""
    if b == 0:
        raise ZeroDivisionError("Modulo by zero is undefined")
    return a % b


class SafeEvaluator(ast.NodeVisitor):
    """Safely evaluates mathematical expressions using Python's AST."""

    def __init__(self, variables: Dict[str, float] = None):
        self.variables = dict(MATH_CONSTANTS)
        if variables:
            self.variables.update(variables)

    def visit(self, node: ast.AST) -> Any:
        method = "visit_" + node.__class__.__name__
        visitor = getattr(self, method, self.generic_visit)
        return visitor(node)

    def generic_visit(self, node: ast.AST) -> Any:
        raise ValueError(f"Unsupported syntax: {type(node).__name__}")

    def visit_Expression(self, node: ast.Expression) -> Any:
        return self.visit(node.body)

    def visit_Constant(self, node: ast.Constant) -> Any:
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant type: {type(node.value).__name__}")

    def visit_Num(self, node: ast.Num) -> Any:  # Python <=3.7 compat
        return node.n

    def visit_Name(self, node: ast.Name) -> Any:
        if node.id in self.variables:
            return self.variables[node.id]
        raise NameError(f"Undefined variable or constant: '{node.id}'")

    def visit_UnaryOp(self, node: ast.UnaryOp) -> Any:
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            operand = self.visit(node.operand)
            return SAFE_OPERATORS[op_type](operand)
        raise ValueError(f"Unsupported unary operator: {op_type.__name__}")

    def visit_BinOp(self, node: ast.BinOp) -> Any:
        op_type = type(node.op)
        if op_type in SAFE_OPERATORS:
            left = self.visit(node.left)
            right = self.visit(node.right)
            if op_type == ast.Div and right == 0:
                raise ZeroDivisionError("Division by zero")
            if op_type == ast.Mod and right == 0:
                raise ZeroDivisionError("Modulo by zero")
            return SAFE_OPERATORS[op_type](left, right)
        raise ValueError(f"Unsupported binary operator: {op_type.__name__}")

    def visit_Call(self, node: ast.Call) -> Any:
        if not isinstance(node.func, ast.Name):
            raise ValueError("Only simple named functions are permitted")
        func_name = node.func.id
        if func_name not in MATH_FUNCTIONS:
            raise NameError(f"Unsupported function: '{func_name}'")

        args = [self.visit(arg) for arg in node.args]
        return MATH_FUNCTIONS[func_name](*args)


def evaluate_expression(expr: str, variables: Dict[str, float] = None) -> Union[int, float]:
    """
    Safely evaluate a mathematical expression string.
    Supports basic arithmetic (+, -, *, /, //, %, ** or ^), brackets,
    and functions: sin, cos, tan, sqrt, log, ln, abs, etc.
    """
    if not expr or not expr.strip():
        raise ValueError("Expression is empty")

    cleaned = expr.strip().replace("^", "**")
    parsed_ast = ast.parse(cleaned, mode="eval")
    evaluator = SafeEvaluator(variables=variables)
    result = evaluator.visit(parsed_ast)

    if isinstance(result, float) and result.is_integer():
        return int(result)
    return result


def stats(data: List[Union[int, float]]) -> Dict[str, float]:
    """Calculate summary statistics for a dataset."""
    if not data:
        raise ValueError("Data list cannot be empty")

    n = len(data)
    mean_val = sum(data) / n
    sorted_data = sorted(data)

    # Median
    if n % 2 == 1:
        median_val = sorted_data[n // 2]
    else:
        median_val = (sorted_data[n // 2 - 1] + sorted_data[n // 2]) / 2

    # Variance and Standard Deviation
    variance = sum((x - mean_val) ** 2 for x in data) / (n if n == 1 else n - 1)
    std_dev = math.sqrt(variance)

    return {
        "count": n,
        "mean": mean_val,
        "median": median_val,
        "min": min(data),
        "max": max(data),
        "variance": variance,
        "std_dev": std_dev,
    }


def cli():
    """Command-line interface for the AI Calc engine."""
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        try:
            res = evaluate_expression(query)
            print(f"= {res}")
        except Exception as err:
            print(f"Error: {err}", file=sys.stderr)
            sys.exit(1)
    else:
        print("AI Calc CLI (type 'exit' or 'quit' to close)")
        while True:
            try:
                line = input("ai_c> ").strip()
                if line.lower() in ("exit", "quit"):
                    break
                if not line:
                    continue
                print(f"= {evaluate_expression(line)}")
            except (EOFError, KeyboardInterrupt):
                break
            except Exception as e:
                print(f"Error: {e}")


if __name__ == "__main__":
    cli()
