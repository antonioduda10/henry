const historyEl = document.getElementById("history");
const currentEl = document.getElementById("current");
const keys = document.querySelector(".calculator__keys");
const memoryIndicatorsEl = document.getElementById("memory-indicators");
const memoryCountEl = document.getElementById("memory-count");

const state = {
  memory: 0,
  current: "0",
  entry: "0",
  previous: null,
  operator: null,
  overwrite: true,
  error: false,
  tokens: [],
  memoryEntries: [],
  memoryPointer: -1,
  memoryFlags: {
    "MS": false,
    "M+": false,
    "M-": false,
    "MR": false,
    "MC": false,
  },
};

const operators = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
};

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Erro";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e12 || abs < 1e-8) {
    return value.toExponential(6).replace("+", "");
  }
  const formatted = value.toPrecision(12);
  return formatted.replace(/\.0+$|0+$/g, "").replace(/\.$/, "");
}

function setDisplay() {
  currentEl.textContent = state.current;
  historyEl.textContent = buildHistory();
  updateMemoryIndicators();
}

function updateMemoryIndicators() {
  if (!memoryIndicatorsEl) return;
  const slots = memoryIndicatorsEl.querySelectorAll(".memory-slot");
  let hasActive = false;
  slots.forEach((slot) => {
    const key = slot.dataset.mem;
    if (state.memoryFlags[key]) {
      slot.classList.add("is-active");
      hasActive = true;
    } else {
      slot.classList.remove("is-active");
    }
  });
  if (memoryCountEl) {
    const showCount = state.memoryEntries.length > 1;
    memoryCountEl.textContent = showCount ? `(${state.memoryEntries.length})` : "";
    memoryCountEl.style.display = showCount ? "inline-flex" : "none";
  }
  memoryIndicatorsEl.style.display = hasActive ? "flex" : "none";
}

function isOperatorToken(token) {
  return token === "+" || token === "-" || token === "−" || token === "×" || token === "÷";
}

function buildHistory() {
  if (state.tokens.length === 0) {
    return "\u00A0";
  }
  const tokens = [...state.tokens];
  const last = tokens[tokens.length - 1];
  if (!state.overwrite) {
    if (isOperatorToken(last)) {
      tokens.push(state.entry);
    } else {
      tokens[tokens.length - 1] = state.entry;
    }
  }
  return tokens.join(" ");
}

function symbolForOperator(op) {
  if (op === "*") return "×";
  if (op === "/") return "÷";
  if (op === "-") return "−";
  return op;
}

function resetIfError() {
  if (!state.error) return;
  state.current = "0";
  state.entry = "0";
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
  state.error = false;
  state.tokens = [];
  clearMemoryFlags();
}

function inputDigit(digit) {
  resetIfError();
  if (state.overwrite) {
    state.entry = digit;
    state.overwrite = false;
  } else if (state.entry === "0") {
    state.entry = digit;
  } else {
    state.entry += digit;
  }
  updateCurrentFromEntry();
  setDisplay();
}

function inputDecimal() {
  resetIfError();
  if (state.overwrite) {
    state.entry = "0,";
    state.overwrite = false;
  } else if (!state.entry.includes(",")) {
    state.entry += ",";
  }
  updateCurrentFromEntry();
  setDisplay();
}

function toggleSign() {
  resetIfError();
  if (state.entry === "0") return;
  state.entry = state.entry.startsWith("-")
    ? state.entry.slice(1)
    : `-${state.entry}`;
  updateCurrentFromEntry();
  setDisplay();
}

function clearEntry() {
  resetIfError();
  state.entry = "0";
  state.overwrite = true;
  updateCurrentFromEntry();
  setDisplay();
}

function clearAll() {
  state.current = "0";
  state.entry = "0";
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
  state.error = false;
  state.tokens = [];
  clearMemoryFlags();
  setDisplay();
}

function clearMemoryFlags() {
  Object.keys(state.memoryFlags).forEach((key) => {
    state.memoryFlags[key] = false;
  });
}

function backspace() {
  resetIfError();
  if (state.overwrite) return;
  if (state.entry.length <= 1 || (state.entry.length === 2 && state.entry.startsWith("-"))) {
    state.entry = "0";
    state.overwrite = true;
  } else {
    state.entry = state.entry.slice(0, -1);
  }
  updateCurrentFromEntry();
  setDisplay();
}

function toNumber(text) {
  return Number(text.replace(",", "."));
}

function applyResult(value) {
  if (!Number.isFinite(value)) {
    state.current = "Erro";
    state.error = true;
  } else {
    state.current = formatNumber(value).replace(".", ",");
  }
  state.overwrite = true;
  state.entry = state.current;
  state.previous = null;
  state.operator = null;
  setDisplay();
}

function setCurrentFromValue(value) {
  if (!Number.isFinite(value)) {
    state.current = "Erro";
    state.error = true;
  } else {
    state.current = formatNumber(value).replace(".", ",");
  }
  state.overwrite = true;
  state.entry = state.current;
  setDisplay();
}

function updateCurrentFromEntry() {
  if (state.operator && state.previous !== null) {
    const a = Number(state.previous);
    const b = toNumber(state.entry);
    const result = operators[state.operator](a, b);
    state.current = Number.isFinite(result)
      ? formatNumber(result).replace(".", ",")
      : "Erro";
    state.error = !Number.isFinite(result);
  } else {
    state.current = state.entry;
  }
}

function compute() {
  if (!state.operator || state.previous === null) return;
  const a = Number(state.previous);
  const b = toNumber(state.entry);
  return operators[state.operator](a, b);
}

function setOperator(op) {
  resetIfError();
  const opSymbol = symbolForOperator(op);
  if (state.operator && !state.overwrite) {
    if (state.tokens.length === 0) {
      state.tokens.push(state.entry);
    }
    if (isOperatorToken(state.tokens[state.tokens.length - 1])) {
      state.tokens.push(state.entry);
    } else {
      state.tokens[state.tokens.length - 1] = state.entry;
    }
    const a = Number(state.previous);
    const b = toNumber(state.entry);
    const result = operators[state.operator](a, b);
    if (!Number.isFinite(result)) {
      state.tokens = [];
      applyResult(result);
      return;
    }
    state.previous = result.toString();
    state.current = formatNumber(result).replace(".", ",");
    state.entry = state.current;
  } else if (state.previous === null) {
    state.previous = toNumber(state.entry).toString();
  }
  if (state.tokens.length === 0) {
    state.tokens.push(state.entry);
  }
  if (isOperatorToken(state.tokens[state.tokens.length - 1])) {
    state.tokens[state.tokens.length - 1] = opSymbol;
  } else {
    state.tokens.push(opSymbol);
  }
  state.operator = op;
  state.overwrite = true;
  state.entry = "0";
  setDisplay();
}

function equals() {
  resetIfError();
  if (!state.operator || state.previous === null) return;
  if (state.tokens.length) {
    if (isOperatorToken(state.tokens[state.tokens.length - 1])) {
      state.tokens.push(state.entry);
    } else {
      state.tokens[state.tokens.length - 1] = state.entry;
    }
  }
  const result = compute();
  state.tokens = [];
  applyResult(result);
  if (!state.error) {
    state.previous = result.toString();
  }
}

function percent() {
  resetIfError();
  const currentValue = toNumber(state.entry);
  if (state.operator && state.previous !== null) {
    const base = Number(state.previous);
    const result = (base * currentValue) / 100;
    setCurrentFromValue(result);
  } else {
    const result = currentValue / 100;
    setCurrentFromValue(result);
  }
}

function reciprocal() {
  resetIfError();
  const value = toNumber(state.entry);
  setCurrentFromValue(1 / value);
}

function square() {
  resetIfError();
  const value = toNumber(state.entry);
  setCurrentFromValue(value * value);
}

function sqrt() {
  resetIfError();
  const value = toNumber(state.entry);
  setCurrentFromValue(Math.sqrt(value));
}

function memoryClear() {
  state.memory = 0;
  state.memoryEntries = [];
  state.memoryPointer = -1;
  clearMemoryFlags();
  setDisplay();
}

function memoryRecall() {
  resetIfError();
  if (state.memoryEntries.length === 0) return;
  state.memoryPointer = (state.memoryPointer + 1) % state.memoryEntries.length;
  const value = state.memoryEntries[state.memoryPointer];
  state.entry = formatNumber(value).replace(".", ",");
  state.overwrite = false;
  updateCurrentFromEntry();
  if (state.tokens.length === 0 && !state.operator) {
    state.tokens.push(state.entry);
  }
  state.memoryFlags["MR"] = true;
  setDisplay();
}

function memoryAdd() {
  const value = toNumber(state.current);
  state.memoryEntries.push(value);
  state.memoryPointer = state.memoryEntries.length - 1;
  state.memoryFlags["M+"] = true;
  state.memoryFlags["MC"] = false;
  setDisplay();
}

function memorySubtract() {
  const value = -toNumber(state.current);
  state.memoryEntries.push(value);
  state.memoryPointer = state.memoryEntries.length - 1;
  state.memoryFlags["M-"] = true;
  state.memoryFlags["MC"] = false;
  setDisplay();
}

function memoryStore() {
  const value = toNumber(state.current);
  state.memoryEntries.push(value);
  state.memoryPointer = state.memoryEntries.length - 1;
  state.memoryFlags["MS"] = true;
  state.memoryFlags["MC"] = false;
  setDisplay();
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const value = button.dataset.value;

  switch (action) {
    case "digit":
      inputDigit(value);
      break;
    case "decimal":
      inputDecimal();
      break;
    case "operator":
      setOperator(value);
      break;
    case "equals":
      equals();
      break;
    case "clear":
      clearAll();
      break;
    case "clear-entry":
      clearEntry();
      break;
    case "backspace":
      backspace();
      break;
    case "toggle-sign":
      toggleSign();
      break;
    case "percent":
      percent();
      break;
    case "reciprocal":
      reciprocal();
      break;
    case "square":
      square();
      break;
    case "sqrt":
      sqrt();
      break;
    case "memory-clear":
      memoryClear();
      break;
    case "memory-recall":
      memoryRecall();
      break;
    case "memory-add":
      memoryAdd();
      break;
    case "memory-subtract":
      memorySubtract();
      break;
    case "memory-store":
      memoryStore();
      break;
    default:
      break;
  }
});

window.addEventListener("keydown", (event) => {
  const { key } = event;
  if (/^\d$/.test(key)) {
    inputDigit(key);
    return;
  }
  if (key === "," || key === ".") {
    inputDecimal();
    return;
  }
  if (["+", "-", "*", "/"].includes(key)) {
    setOperator(key);
    return;
  }
  if (key === "Enter" || key === "=") {
    event.preventDefault();
    equals();
    return;
  }
  if (key === "Backspace") {
    backspace();
    return;
  }
  if (key === "Delete") {
    clearEntry();
    return;
  }
  if (key === "Escape") {
    clearAll();
    return;
  }
  if (key === "%") {
    percent();
  }
});

setDisplay();
