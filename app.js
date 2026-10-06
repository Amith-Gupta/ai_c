/**
 * AI Calc (ai_c) - Interactive Client Logic & Canvas Grapher
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentExpression: '',
    currentDisplay: '0',
    lastAnswer: 0,
    memory: 0,
    isRadians: true,
    isEvaluated: false,
    history: [],
    graph: {
      scale: 30, // pixels per unit
      originX: 0,
      originY: 0,
      expr: 'sin(x) * cos(x / 2)',
    },
  };

  // DOM Elements
  const primaryDisplay = document.getElementById('primary-display');
  const expressionTape = document.getElementById('expression-tape');
  const angleIndicator = document.getElementById('angle-indicator');
  const angleToggle = document.getElementById('angle-mode-toggle');
  const memoryIndicator = document.getElementById('memory-indicator');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const historyToggleBtn = document.getElementById('history-toggle-btn');
  const copyBtn = document.getElementById('copy-btn');
  const copyTooltip = document.getElementById('copy-tooltip');
  const scientificBar = document.getElementById('scientific-bar');

  // Canvas elements
  const canvas = document.getElementById('graph-canvas');
  const ctx = canvas.getContext('2d');
  const graphCoords = document.getElementById('graph-coords');
  const graphInput = document.getElementById('graph-expr-input');
  const plotBtn = document.getElementById('plot-btn');
  const zoomInBtn = document.getElementById('graph-zoom-in');
  const zoomOutBtn = document.getElementById('graph-zoom-out');
  const resetGraphBtn = document.getElementById('graph-reset');

  // AI Elements
  const aiPromptInput = document.getElementById('ai-prompt-input');
  const aiAskBtn = document.getElementById('ai-ask-btn');
  const aiResultCard = document.getElementById('ai-result-card');
  const aiSolutionMain = document.getElementById('ai-solution-main');
  const aiSolutionSteps = document.getElementById('ai-solution-steps');
  const aiQueryEcho = document.getElementById('ai-query-echo');
  const applyToCalcBtn = document.getElementById('apply-to-calc-btn');

  // Load Saved State from localStorage
  function loadPersistedState() {
    try {
      const savedTheme = localStorage.getItem('ai_c_theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
      const savedHistory = localStorage.getItem('ai_c_history');
      if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        renderHistory();
      }
      const savedMemory = localStorage.getItem('ai_c_memory');
      if (savedMemory) {
        state.memory = parseFloat(savedMemory) || 0;
        updateMemoryIndicator();
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem('ai_c_history', JSON.stringify(state.history.slice(0, 50)));
    } catch (e) {
      console.warn(e);
    }
  }

  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-dot').forEach((dot) => {
      dot.classList.toggle('active', dot.getAttribute('data-color') === theme);
    });
    localStorage.setItem('ai_c_theme', theme);
    renderGraph();
  }

  // Expression & Display Updates
  function updateDisplay() {
    primaryDisplay.textContent = state.currentDisplay;
    expressionTape.textContent = state.currentExpression;

    // Adjust font size dynamically if text is long
    const len = state.currentDisplay.length;
    if (len > 16) {
      primaryDisplay.style.fontSize = '1.6rem';
    } else if (len > 10) {
      primaryDisplay.style.fontSize = '2.1rem';
    } else {
      primaryDisplay.style.fontSize = '2.8rem';
    }
  }

  function inputDigit(digit) {
    if (state.isEvaluated) {
      state.currentDisplay = digit === '.' ? '0.' : digit;
      state.currentExpression = '';
      state.isEvaluated = false;
    } else {
      if (digit === '.') {
        if (!state.currentDisplay.includes('.')) {
          state.currentDisplay += '.';
        }
      } else {
        if (state.currentDisplay === '0' || state.currentDisplay === 'Error') {
          state.currentDisplay = digit;
        } else {
          state.currentDisplay += digit;
        }
      }
    }
    updateDisplay();
  }

  function inputOperator(op) {
    if (state.currentDisplay === 'Error') return;

    if (state.isEvaluated) {
      state.currentExpression = `${state.currentDisplay} ${op} `;
      state.isEvaluated = false;
    } else {
      state.currentExpression += `${state.currentDisplay} ${op} `;
    }
    state.currentDisplay = '0';
    updateDisplay();
  }

  function insertToken(token) {
    if (token === 'pi') {
      state.currentDisplay = String(Math.PI);
    } else if (token === 'e') {
      state.currentDisplay = String(Math.E);
    } else if (token === '(') {
      state.currentExpression += '( ';
    } else if (token === ')') {
      state.currentExpression += `${state.currentDisplay} ) `;
      state.currentDisplay = '0';
    }
    updateDisplay();
  }

  function clearAll() {
    state.currentExpression = '';
    state.currentDisplay = '0';
    state.isEvaluated = false;
    updateDisplay();
  }

  function backspace() {
    if (state.isEvaluated) {
      clearAll();
      return;
    }
    if (state.currentDisplay.length > 1) {
      state.currentDisplay = state.currentDisplay.slice(0, -1);
    } else {
      state.currentDisplay = '0';
    }
    updateDisplay();
  }

  function toggleSign() {
    if (state.currentDisplay === '0' || state.currentDisplay === 'Error') return;
    if (state.currentDisplay.startsWith('-')) {
      state.currentDisplay = state.currentDisplay.slice(1);
    } else {
      state.currentDisplay = `-${state.currentDisplay}`;
    }
    updateDisplay();
  }

  function applyPercent() {
    const val = parseFloat(state.currentDisplay);
    if (!isNaN(val)) {
      state.currentDisplay = String(val / 100);
      updateDisplay();
    }
  }

  function applyFunction(func) {
    const val = parseFloat(state.currentDisplay);
    if (isNaN(val)) return;

    let res = 0;
    try {
      switch (func) {
        case 'sin':
          res = Math.sin(state.isRadians ? val : (val * Math.PI) / 180);
          break;
        case 'cos':
          res = Math.cos(state.isRadians ? val : (val * Math.PI) / 180);
          break;
        case 'tan':
          res = Math.tan(state.isRadians ? val : (val * Math.PI) / 180);
          break;
        case 'sqrt':
          if (val < 0) throw new Error('Invalid input');
          res = Math.sqrt(val);
          break;
        case 'cbrt':
          res = Math.cbrt(val);
          break;
        case 'log':
          if (val <= 0) throw new Error('Invalid input');
          res = Math.log10(val);
          break;
        case 'ln':
          if (val <= 0) throw new Error('Invalid input');
          res = Math.log(val);
          break;
        case 'abs':
          res = Math.abs(val);
          break;
        default:
          return;
      }
      state.currentExpression = `${func}(${val})`;
      state.currentDisplay = formatResult(res);
      state.isEvaluated = true;
      recordHistory(state.currentExpression, state.currentDisplay);
    } catch (err) {
      state.currentDisplay = 'Error';
    }
    updateDisplay();
  }

  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  function formatResult(val) {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return 'Error';
    }
    // Round floating precision errors
    const rounded = Math.round(val * 1e12) / 1e12;
    return String(rounded);
  }

  // Safe Math Expression Evaluator
  function evaluateMath(expression) {
    // Replace visual tokens
    let sanitized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**')
      .replace(/π/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    // Only allow safe math tokens
    if (!/^[0-9+\-*/().\s*^MathPIE]+$/.test(sanitized)) {
      throw new Error('Unsafe characters');
    }

    // Evaluate in restricted scope
    const func = new Function(`return (${sanitized})`);
    const val = func();
    return val;
  }

  function computeResult() {
    if (state.currentDisplay === 'Error') return;

    let fullExpr = state.currentExpression;
    if (!state.isEvaluated) {
      fullExpr += state.currentDisplay;
    }

    if (!fullExpr.trim()) return;

    try {
      const val = evaluateMath(fullExpr);
      const formatted = formatResult(val);
      recordHistory(fullExpr, formatted);
      state.lastAnswer = val;
      state.currentExpression = `${fullExpr} =`;
      state.currentDisplay = formatted;
      state.isEvaluated = true;
    } catch (err) {
      state.currentDisplay = 'Error';
    }
    updateDisplay();
  }

  // Memory Registers
  function updateMemoryIndicator() {
    if (state.memory !== 0) {
      memoryIndicator.classList.remove('hidden');
    } else {
      memoryIndicator.classList.add('hidden');
    }
    try {
      localStorage.setItem('ai_c_memory', String(state.memory));
    } catch (e) {}
  }

  function handleMemory(action) {
    const val = parseFloat(state.currentDisplay) || 0;
    switch (action) {
      case 'mc':
        state.memory = 0;
        break;
      case 'mr':
        state.currentDisplay = String(state.memory);
        state.isEvaluated = false;
        break;
      case 'm+':
        state.memory += val;
        break;
      case 'm-':
        state.memory -= val;
        break;
      case 'ms':
        state.memory = val;
        break;
    }
    updateMemoryIndicator();
    updateDisplay();
  }

  // History Management
  function recordHistory(expr, result) {
    state.history.unshift({ expr, result, timestamp: new Date().toLocaleTimeString() });
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyList.innerHTML = `<div class="history-empty">No calculations yet. Perform a computation to build your tape.</div>`;
      return;
    }

    historyList.innerHTML = state.history
      .map(
        (item, index) => `
        <div class="history-item" data-index="${index}">
          <div class="hist-expr">${escapeHTML(item.expr)}</div>
          <div class="hist-result">= ${escapeHTML(item.result)}</div>
        </div>
      `
      )
      .join('');

    // Attach click handlers to recall items
    document.querySelectorAll('.history-item').forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        const entry = state.history[idx];
        if (entry) {
          state.currentDisplay = entry.result;
          state.currentExpression = entry.expr;
          state.isEvaluated = true;
          updateDisplay();
        }
      });
    });
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Clipboard Copy Action
  function copyResult() {
    navigator.clipboard.writeText(state.currentDisplay).then(() => {
      copyTooltip.classList.add('show');
      setTimeout(() => copyTooltip.classList.remove('show'), 1500);
    });
  }

  // ---------------------------------------------------------
  // Function Grapher (HTML5 Canvas)
  // ---------------------------------------------------------
  function setupGrapher() {
    canvas.width = canvas.parentElement.clientWidth > 600 ? 600 : canvas.parentElement.clientWidth - 32;
    state.graph.originX = canvas.width / 2;
    state.graph.originY = canvas.height / 2;

    plotBtn.addEventListener('click', () => {
      state.graph.expr = graphInput.value.trim();
      renderGraph();
    });

    graphInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        state.graph.expr = graphInput.value.trim();
        renderGraph();
      }
    });

    zoomInBtn.addEventListener('click', () => {
      state.graph.scale *= 1.25;
      renderGraph();
    });

    zoomOutBtn.addEventListener('click', () => {
      state.graph.scale /= 1.25;
      renderGraph();
    });

    resetGraphBtn.addEventListener('click', () => {
      state.graph.scale = 30;
      state.graph.originX = canvas.width / 2;
      state.graph.originY = canvas.height / 2;
      renderGraph();
    });

    // Preset chips
    document.querySelectorAll('.chip-preset').forEach((chip) => {
      chip.addEventListener('click', () => {
        const expr = chip.getAttribute('data-expr');
        graphInput.value = expr;
        state.graph.expr = expr;
        renderGraph();
      });
    });

    // Mouse coordinates tracker
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const mathX = (mouseX - state.graph.originX) / state.graph.scale;
      const mathY = (state.graph.originY - mouseY) / state.graph.scale;

      graphCoords.textContent = `x: ${mathX.toFixed(2)}, y: ${mathY.toFixed(2)}`;
    });

    renderGraph();
  }

  function compileGraphExpression(expr) {
    let sanitized = expr
      .replace(/\^/g, '**')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\blog\b/g, 'Math.log10')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    return new Function('x', `try { return (${sanitized}); } catch (e) { return NaN; }`);
  }

  function renderGraph() {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const originX = state.graph.originX;
    const originY = state.graph.originY;
    const scale = state.graph.scale;

    // Clear canvas
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    const startX = (originX % scale) - scale;
    for (let x = startX; x < w; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal grid lines
    const startY = (originY % scale) - scale;
    for (let y = startY; y < h; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, h);
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';

    for (let x = startX; x < w; x += scale * 2) {
      const mathX = Math.round((x - originX) / scale);
      if (mathX !== 0) {
        ctx.fillText(mathX, x, originY + 14);
      }
    }

    ctx.textAlign = 'right';
    for (let y = startY; y < h; y += scale * 2) {
      const mathY = Math.round((originY - y) / scale);
      if (mathY !== 0) {
        ctx.fillText(mathY, originX - 6, y + 4);
      }
    }

    // Plot Curve
    try {
      const evalFunc = compileGraphExpression(state.graph.expr);
      const computedThemeColor = getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#8b5cf6';

      ctx.strokeStyle = computedThemeColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = computedThemeColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();

      let isDrawing = false;
      for (let px = 0; px < w; px += 1) {
        const mathX = (px - originX) / scale;
        const mathY = evalFunc(mathX);

        if (!isNaN(mathY) && isFinite(mathY)) {
          const py = originY - mathY * scale;
          if (py >= -h && py <= 2 * h) {
            if (!isDrawing) {
              ctx.moveTo(px, py);
              isDrawing = true;
            } else {
              ctx.lineTo(px, py);
            }
          } else {
            isDrawing = false;
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow
    } catch (err) {
      console.warn('Graph plot error:', err);
    }
  }

  // ---------------------------------------------------------
  // AI Natural Language Math Assistant / Problem Solver
  // ---------------------------------------------------------
  function setupAIAssistant() {
    aiAskBtn.addEventListener('click', runAISolver);
    aiPromptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runAISolver();
    });

    document.querySelectorAll('.ai-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        aiPromptInput.value = chip.getAttribute('data-query');
        runAISolver();
      });
    });

    applyToCalcBtn.addEventListener('click', () => {
      const val = aiSolutionMain.getAttribute('data-numeric-value');
      if (val) {
        state.currentDisplay = val;
        state.currentExpression = `AI: ${aiPromptInput.value.trim()}`;
        state.isEvaluated = true;
        updateDisplay();

        // Switch to standard tab
        document.querySelector('.nav-tab[data-tab="standard"]').click();
      }
    });
  }

  function runAISolver() {
    const raw = aiPromptInput.value.trim();
    if (!raw) return;

    aiQueryEcho.textContent = `"${raw}"`;
    const solution = solveNaturalLanguageQuery(raw);

    aiSolutionMain.textContent = solution.primary;
    aiSolutionMain.setAttribute('data-numeric-value', solution.numeric || solution.primary);
    aiSolutionSteps.textContent = solution.steps;
    aiResultCard.classList.remove('hidden');

    recordHistory(`AI: ${raw}`, String(solution.numeric || solution.primary));
  }

  function solveNaturalLanguageQuery(query) {
    const q = query.toLowerCase();

    // 1. Percentage / Tip: e.g. "18% tip on 85 dollars", "20% of 150"
    const tipMatch = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:tip\s*(?:on|of)|of)\s*\$?(\d+(?:\.\d+)?)/);
    if (tipMatch) {
      const percent = parseFloat(tipMatch[1]);
      const base = parseFloat(tipMatch[2]);
      const tipAmount = (percent / 100) * base;
      const total = base + tipAmount;
      return {
        primary: `$${tipAmount.toFixed(2)} (Total: $${total.toFixed(2)})`,
        numeric: tipAmount.toFixed(2),
        steps: `• Base amount: $${base}\n• Percentage rate: ${percent}%\n• Calculation: (${percent} / 100) × $${base} = $${tipAmount.toFixed(2)}\n• Grand total with tip: $${total.toFixed(2)}`,
      };
    }

    // 2. Unit Conversions
    // Distance: km <-> miles
    const kmToMiles = q.match(/(\d+(?:\.\d+)?)\s*km\s*(?:in|to)\s*miles?/);
    if (kmToMiles) {
      const km = parseFloat(kmToMiles[1]);
      const miles = km * 0.621371;
      return {
        primary: `${miles.toFixed(3)} miles`,
        numeric: miles.toFixed(3),
        steps: `• Formula: miles = km × 0.621371\n• Calculation: ${km} × 0.621371 = ${miles.toFixed(4)} miles`,
      };
    }

    const milesToKm = q.match(/(\d+(?:\.\d+)?)\s*miles?\s*(?:in|to)\s*km/);
    if (milesToKm) {
      const miles = parseFloat(milesToKm[1]);
      const km = miles * 1.60934;
      return {
        primary: `${km.toFixed(3)} km`,
        numeric: km.toFixed(3),
        steps: `• Formula: km = miles × 1.60934\n• Calculation: ${miles} × 1.60934 = ${km.toFixed(4)} km`,
      };
    }

    // Temperature: Celsius <-> Fahrenheit
    const cToF = q.match(/(\d+(?:\.\d+)?)\s*(?:c|celsius)\s*(?:in|to)\s*(?:f|fahrenheit)/);
    if (cToF) {
      const c = parseFloat(cToF[1]);
      const f = (c * 9) / 5 + 32;
      return {
        primary: `${f.toFixed(2)} °F`,
        numeric: f.toFixed(2),
        steps: `• Formula: °F = (°C × 9/5) + 32\n• Calculation: (${c} × 1.8) + 32 = ${f.toFixed(2)} °F`,
      };
    }

    // 3. Linear Equation: e.g. "solve 3x + 12 = 0" or "4x - 16 = 0" or "2x + 6 = 14"
    const eqMatch = q.match(/solve\s*([+-]?\s*\d*(?:\.\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)\s*=\s*([+-]?\s*\d+(?:\.\d+)?)/);
    if (eqMatch) {
      let aStr = eqMatch[1].replace(/\s+/g, '');
      let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
      let b = parseFloat(eqMatch[2].replace(/\s+/g, ''));
      let c = parseFloat(eqMatch[3].replace(/\s+/g, ''));

      // ax + b = c  =>  ax = c - b  =>  x = (c - b) / a
      const xVal = (c - b) / a;
      return {
        primary: `x = ${formatResult(xVal)}`,
        numeric: formatResult(xVal),
        steps: `• Given equation: ${a}x + (${b}) = ${c}\n• Subtract ${b} from both sides: ${a}x = ${c - b}\n• Divide by ${a}: x = ${c - b} / ${a} = ${formatResult(xVal)}`,
      };
    }

    // 4. Statistics array: e.g. "stats [10, 20, 30, 40]"
    const statsMatch = q.match(/stats\s*\[(.*?)\]/);
    if (statsMatch) {
      const nums = statsMatch[1].split(',').map((n) => parseFloat(n.trim())).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        const sorted = [...nums].sort((a, b) => a - b);
        const median = sorted.length % 2 === 1 ? sorted[Math.floor(sorted.length / 2)] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
        const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (nums.length > 1 ? nums.length - 1 : 1);
        const stdDev = Math.sqrt(variance);

        return {
          primary: `Mean: ${mean.toFixed(2)}, Median: ${median}`,
          numeric: mean.toFixed(2),
          steps: `• Sample Count (n): ${nums.length}\n• Sum: ${sum}\n• Mean (Average): ${mean.toFixed(4)}\n• Median: ${median}\n• Standard Deviation: ${stdDev.toFixed(4)}\n• Range: [${sorted[0]}, ${sorted[sorted.length - 1]}]`,
        };
      }
    }

    // 5. General expression fallback
    try {
      const cleanExpr = q.replace(/calculate|what is|evaluate|solve/gi, '').trim();
      const val = evaluateMath(cleanExpr);
      return {
        primary: formatResult(val),
        numeric: formatResult(val),
        steps: `• Evaluated expression: ${cleanExpr}\n• Result: ${formatResult(val)}`,
      };
    } catch (err) {
      return {
        primary: 'Could not parse query',
        numeric: null,
        steps: `Tip: Try asking queries such as:\n• "18% tip on 85 dollars"\n• "50 km in miles"\n• "solve 4x - 16 = 0"\n• "stats [10, 20, 30, 40, 50]"\n• "sqrt(144) * 5"`,
      };
    }
  }

  // ---------------------------------------------------------
  // Event Listeners & Keypad Bindings
  // ---------------------------------------------------------
  function setupEventListeners() {
    // Mode Switcher Tabs
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.getAttribute('data-tab');
        const calcView = document.getElementById('calculator-view');
        const grapherView = document.getElementById('grapher-view');
        const aiView = document.getElementById('ai-view');

        // Reset views
        calcView.classList.add('hidden');
        grapherView.classList.add('hidden');
        aiView.classList.add('hidden');

        if (mode === 'standard') {
          calcView.classList.remove('hidden');
          scientificBar.classList.add('hidden');
        } else if (mode === 'scientific') {
          calcView.classList.remove('hidden');
          scientificBar.classList.remove('hidden');
        } else if (mode === 'grapher') {
          grapherView.classList.remove('hidden');
          renderGraph();
        } else if (mode === 'ai') {
          aiView.classList.remove('hidden');
          aiPromptInput.focus();
        }
      });
    });

    // Theme selector
    document.querySelectorAll('.theme-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        setTheme(dot.getAttribute('data-color'));
      });
    });

    // Angle mode toggle (RAD / DEG)
    angleToggle.addEventListener('click', () => {
      state.isRadians = !state.isRadians;
      const label = state.isRadians ? 'RAD' : 'DEG';
      angleToggle.textContent = label;
      angleIndicator.textContent = label;
    });

    // History drawer toggle
    historyToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('history-collapsed');
    });

    clearHistoryBtn.addEventListener('click', () => {
      state.history = [];
      saveHistory();
      renderHistory();
    });

    copyBtn.addEventListener('click', copyResult);

    // Keypad Click Delegation
    document.getElementById('main-keypad').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.hasAttribute('data-num')) {
        inputDigit(btn.getAttribute('data-num'));
      } else if (btn.hasAttribute('data-op')) {
        inputOperator(btn.getAttribute('data-op'));
      } else if (btn.hasAttribute('data-action')) {
        const action = btn.getAttribute('data-action');
        if (action === 'clear') clearAll();
        else if (action === 'backspace') backspace();
        else if (action === 'equals') computeResult();
        else if (action === 'toggle-sign') toggleSign();
        else if (action === 'percent') applyPercent();
        else if (action === 'ans') {
          state.currentDisplay = String(state.lastAnswer);
          state.isEvaluated = false;
          updateDisplay();
        }
      } else if (btn.hasAttribute('data-insert')) {
        insertToken(btn.getAttribute('data-insert'));
      }
    });

    // Scientific bar functions
    scientificBar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.hasAttribute('data-func')) {
        applyFunction(btn.getAttribute('data-func'));
      } else if (btn.hasAttribute('data-insert')) {
        insertToken(btn.getAttribute('data-insert'));
      } else if (btn.hasAttribute('data-action')) {
        const act = btn.getAttribute('data-action');
        if (act === 'power') {
          inputOperator('^');
        } else if (act === 'factorial') {
          const val = parseFloat(state.currentDisplay);
          const f = factorial(val);
          state.currentExpression = `${val}!`;
          state.currentDisplay = isNaN(f) ? 'Error' : formatResult(f);
          state.isEvaluated = true;
          updateDisplay();
        }
      }
    });

    // Memory keys
    document.querySelectorAll('.mem-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        handleMemory(btn.getAttribute('data-mem'));
      });
    });

    // Physical Keyboard Support
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing into input fields
      if (e.target.tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDigit('.');
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        inputOperator(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        computeResult();
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Escape') {
        clearAll();
      } else if (e.key === '(' || e.key === ')') {
        insertToken(e.key);
      } else if (e.key === '%') {
        applyPercent();
      }
    });

    window.addEventListener('resize', () => {
      canvas.width = canvas.parentElement.clientWidth > 600 ? 600 : canvas.parentElement.clientWidth - 32;
      state.graph.originX = canvas.width / 2;
      state.graph.originY = canvas.height / 2;
      renderGraph();
    });
  }

  // Initialization
  function init() {
    loadPersistedState();
    setupEventListeners();
    setupGrapher();
    setupAIAssistant();
    updateDisplay();
  }

  init();
})();
