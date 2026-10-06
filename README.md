# AI Calc (`ai_c`) 🧮⚡

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests Passing](https://img.shields.io/badge/Tests-10%20Passed-brightgreen.svg)](#running-tests)
[![Design](https://img.shields.io/badge/UI-Modern%20Glassmorphism-8b5cf6.svg)](#web-interface)

> **AI Calc** is an intelligent computational engine and interactive workspace that combines safe AST-parsed mathematical evaluation, statistical analysis, an interactive 2D Cartesian function grapher, and natural language query solving.

---

## ✨ Features

- **🧮 High-Precision Math Engine (`calculator.py`)**:
  - Safe expression parsing using Python's Abstract Syntax Tree (AST).
  - Arithmetic operations: addition, subtraction, multiplication, division, exponents (`^`), modulo (`%`).
  - Scientific functions: `sin`, `cos`, `tan`, `sqrt`, `cbrt`, `log`, `ln`, `exp`, `abs`, `factorial`, `deg`, `rad`.
  - Statistical summary calculations: `mean`, `median`, `min`, `max`, `variance`, `std_dev`.
  - Safe against code injection / unauthorized function execution.

- **🌐 Modern Glassmorphic Web App (`index.html`)**:
  - **Standard & Scientific Keypad**: Ergonomic layout with keyboard shortcuts and haptic feedback animations.
  - **Real-time 2D Function Grapher**: Interactive canvas rendering `f(x)` curves with coordinate tracking, zooming, panning, and preset functions (`sin(x)`, `x^2 - 4`, Gaussian, `1/x`).
  - **AI Natural Language Problem Solver**: Solves tips/percentages (e.g. `18% tip on $85`), unit conversions (e.g. `50 km to miles`), linear algebra equations (e.g. `solve 3x + 12 = 0`), and dataset statistics with step-by-step reasoning.
  - **Tape History & Memory**: Persistent history tape with one-click recall, copy to clipboard, and standard memory registers (`MC`, `MR`, `M+`, `M-`, `MS`).
  - **Dynamic Theme Switcher**: Accent customization with Violet, Cyan, Emerald, and Amber color palettes.

---

## 🚀 Quick Start

### 1. Web Application
Simply open `index.html` in any modern web browser, or launch a quick local static server:

```bash
# Python built-in HTTP server:
python -m http.server 8080

# Then navigate to:
http://localhost:8080
```

### 2. Python CLI

Evaluate mathematical expressions directly from the terminal:

```bash
# Direct evaluation:
python calculator.py "2^8 + sqrt(144) * 3"
# Output: = 292

# Interactive REPL:
python calculator.py
```

### 3. Python Module Usage

```python
from calculator import evaluate_expression, stats

# Safe evaluation
result = evaluate_expression("3 * x + sin(pi / 2)", variables={"x": 10})
print(result) # 31

# Summary statistics
summary = stats([12, 18, 25, 30, 42])
print(summary["mean"], summary["std_dev"])
```

---

## 🧪 Running Tests

AI Calc includes a zero-dependency test suite compatible with both Python's built-in `unittest` and `pytest`:

```bash
python test.py
```

All 10 unit test cases verify arithmetic correctness, edge conditions, zero division handling, AST safety restrictions, and statistical computations.

---

## 📁 Repository Structure

```
ai_c/
├── calculator.py       # Core AST mathematical & statistics engine + CLI
├── test.py             # Comprehensive test suite (10 checks)
├── index.html          # Interactive Web UI & Function Grapher
├── style.css           # Glassmorphism styling, animations & theme system
├── app.js              # Client state, keyboard bindings & Canvas plotter
├── .gitignore          # Standard repository exclusions
└── README.md           # Documentation & guides
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
