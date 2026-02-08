const historyEl = document.getElementById("history");
const currentEl = document.getElementById("current");
const keys = document.querySelector(".calculator__keys");

const state = {
  memory: 0,
  current: "0",
  previous: null,
  operator: null,
  overwrite: true,
  error: false,
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
  historyEl.textContent = state.previous && state.operator
    ? `${formatNumber(Number(state.previous)).replace(".", ",")} ${symbolForOperator(state.operator)}`
    : "\u00A0";
}

function symbolForOperator(op) {
  return op === "*" ? "×" : op === "/" ? "÷" : op;
}

function resetIfError() {
  if (!state.error) return;
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
  state.error = false;
}

function inputDigit(digit) {
  resetIfError();
  if (state.overwrite) {
    state.current = digit;
    state.overwrite = false;
    setDisplay();
    return;
  }
  if (state.current === "0") {
    state.current = digit;
  } else {
    state.current += digit;
  }
  setDisplay();
}

function inputDecimal() {
  resetIfError();
  if (state.overwrite) {
    state.current = "0,";
    state.overwrite = false;
    setDisplay();
    return;
  }
  if (!state.current.includes(",")) {
    state.current += ",";
  }
  setDisplay();
}

function toggleSign() {
  resetIfError();
  if (state.current === "0") return;
  state.current = state.current.startsWith("-")
    ? state.current.slice(1)
    : `-${state.current}`;
  setDisplay();
}

function clearEntry() {
  resetIfError();
  state.current = "0";
  state.overwrite = true;
  setDisplay();
}

function clearAll() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
  state.error = false;
  setDisplay();
}

function backspace() {
  resetIfError();
  if (state.overwrite) return;
  if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith("-"))) {
    state.current = "0";
    state.overwrite = true;
  } else {
    state.current = state.current.slice(0, -1);
  }
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
  state.previous = null;
  state.operator = null;
  setDisplay();
}

function compute() {
  if (!state.operator || state.previous === null) return;
  const a = Number(state.previous);
  const b = toNumber(state.current);
  const result = operators[state.operator](a, b);
  applyResult(result);
}

function setOperator(op) {
  resetIfError();
  if (state.operator && !state.overwrite) {
    const a = Number(state.previous);
    const b = toNumber(state.current);
    const result = operators[state.operator](a, b);
    if (!Number.isFinite(result)) {
      applyResult(result);
      return;
    }
    state.previous = result.toString();
    state.current = formatNumber(result).replace(".", ",");
  } else if (state.previous === null) {
    state.previous = toNumber(state.current).toString();
  }
  state.operator = op;
  state.overwrite = true;
  setDisplay();
}

function equals() {
  resetIfError();
  if (!state.operator || state.previous === null) return;
  compute();
}

function percent() {
  resetIfError();
  const currentValue = toNumber(state.current);
  if (state.operator && state.previous !== null) {
    const base = Number(state.previous);
    const result = (base * currentValue) / 100;
    state.current = formatNumber(result).replace(".", ",");
  } else {
    const result = currentValue / 100;
    state.current = formatNumber(result).replace(".", ",");
  }
  state.overwrite = true;
  setDisplay();
}

function reciprocal() {
  resetIfError();
  const value = toNumber(state.current);
  applyResult(1 / value);
}

function square() {
  resetIfError();
  const value = toNumber(state.current);
  applyResult(value * value);
}

function sqrt() {
  resetIfError();
  const value = toNumber(state.current);
  applyResult(Math.sqrt(value));
}

function memoryClear() {
  state.memory = 0;
}

function memoryRecall() {
  resetIfError();
  state.current = formatNumber(state.memory).replace(".", ",");
  state.overwrite = true;
  setDisplay();
}

function memoryAdd() {
  state.memory += toNumber(state.current);
}

function memorySubtract() {
  state.memory -= toNumber(state.current);
}

function memoryStore() {
  state.memory = toNumber(state.current);
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
