const positionsBody = document.querySelector("#positions-body");
const positionTemplate = document.querySelector("#position-template");
const addPositionButton = document.querySelector("#add-position");
const grandTotal = document.querySelector("#grand-total");
const estimateDate = document.querySelector("#estimate-date");
const discountRate = document.querySelector("#discount-rate");
const vatRate = document.querySelector("#vat-rate");
const currency = document.querySelector("#currency");
const subtotal = document.querySelector("#subtotal");
const discountRow = document.querySelector("#discount-row");
const discountAmount = document.querySelector("#discount-amount");
const discountedRow = document.querySelector("#discounted-row");
const discountedTotal = document.querySelector("#discounted-total");
const vatRow = document.querySelector("#vat-row");
const vatAmount = document.querySelector("#vat-amount");
const estimateNumber = document.querySelector("[name='estimate-number']");
const printEstimateNumber = document.querySelector("#print-estimate-number");
const printEstimateDate = document.querySelector("#print-estimate-date");
const comment = document.querySelector("#comment");
const printEstimateButton = document.querySelector("#print-estimate");
const copyWhatsAppButton = document.querySelector("#copy-whatsapp");
const newEstimateButton = document.querySelector("#new-estimate");
const copyStatus = document.querySelector("#copy-status");
const copyFallback = document.querySelector("#copy-fallback");
const copyText = document.querySelector("#copy-text");
const sender = document.querySelector("[name='sender']");
const customer = document.querySelector("[name='customer']");
const themeButtons = document.querySelectorAll(".theme-button");
const draftStorageKey = "estimate-draft-v1";
const themeStorageKey = "estimate-theme-v1";
let copyStatusTimer;

function applyTheme(theme, shouldSave = true) {
  const selectedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = selectedTheme;

  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeValue === selectedTheme));
  });

  if (!shouldSave) {
    return;
  }

  try {
    localStorage.setItem(themeStorageKey, selectedTheme);
  } catch (error) {
    // The theme still works when browser storage is unavailable.
  }
}

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForPrint(value) {
  const parts = value.split("-");

  if (parts.length !== 3) {
    return value || "—";
  }

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function updatePrintHeading() {
  printEstimateNumber.textContent = estimateNumber.value.trim() || "—";
  printEstimateDate.textContent = formatDateForPrint(estimateDate.value);
}

function resizeComment() {
  comment.style.height = "auto";
  comment.style.height = `${comment.scrollHeight}px`;
}

function getPositionsData() {
  return Array.from(positionsBody.querySelectorAll("tr"), (row) => ({
    name: row.querySelector(".item-name").value,
    quantity: row.querySelector(".item-quantity").value,
    unit: row.querySelector(".item-unit").value,
    price: row.querySelector(".item-price").value
  }));
}

function saveDraft() {
  const draft = {
    sender: sender.value,
    customer: customer.value,
    estimateNumber: estimateNumber.value,
    date: estimateDate.value,
    positions: getPositionsData(),
    discountRate: discountRate.value,
    vatRate: vatRate.value,
    currency: currency.value,
    comment: comment.value
  };

  try {
    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  } catch (error) {
    // Смета продолжает работать, даже если хранилище браузера недоступно.
  }
}

function restoreDraft() {
  let draft;

  try {
    draft = JSON.parse(localStorage.getItem(draftStorageKey));
  } catch (error) {
    return false;
  }

  if (!draft || typeof draft !== "object") {
    return false;
  }

  sender.value = typeof draft.sender === "string" ? draft.sender : "";
  customer.value = typeof draft.customer === "string" ? draft.customer : "";
  estimateNumber.value = typeof draft.estimateNumber === "string" ? draft.estimateNumber : "";
  estimateDate.value = typeof draft.date === "string" ? draft.date : getLocalDate();
  discountRate.value = typeof draft.discountRate === "string" ? draft.discountRate : "0";
  vatRate.value = typeof draft.vatRate === "string" ? draft.vatRate : "0";
  currency.value = ["₸", "₽", "$", "€"].includes(draft.currency) ? draft.currency : "₸";
  comment.value = typeof draft.comment === "string" ? draft.comment : "";
  positionsBody.replaceChildren();

  const savedPositions = Array.isArray(draft.positions) && draft.positions.length > 0
    ? draft.positions
    : [{}];

  savedPositions.forEach((savedPosition) => {
    const position = savedPosition && typeof savedPosition === "object" ? savedPosition : {};
    addPosition(false, false);
    const row = positionsBody.lastElementChild;
    row.querySelector(".item-name").value = typeof position.name === "string" ? position.name : "";
    row.querySelector(".item-quantity").value = typeof position.quantity === "string" ? position.quantity : "";
    row.querySelector(".item-price").value = typeof position.price === "string" ? position.price : "";
    row.querySelector(".item-unit").value = ["шт", "час", "услуга"].includes(position.unit)
      ? position.unit
      : "шт";
    updateDuplicateButton(row);
  });

  return true;
}

function incrementEstimateNumber(value) {
  const trimmedValue = value.trim();
  const currentNumber = /^\d+$/.test(trimmedValue) ? Number(trimmedValue) : 0;
  const nextNumber = Number.isSafeInteger(currentNumber) ? currentNumber + 1 : 1;
  return String(nextNumber).padStart(trimmedValue.length, "0");
}

function startNewEstimate() {
  if (!window.confirm("Создать новую смету? Текущий черновик будет очищен.")) {
    return;
  }

  const nextEstimateNumber = incrementEstimateNumber(estimateNumber.value);
  sender.value = "";
  customer.value = "";
  estimateNumber.value = nextEstimateNumber;
  estimateDate.value = getLocalDate();
  discountRate.value = "0";
  vatRate.value = "0";
  currency.value = "₸";
  comment.value = "";
  positionsBody.replaceChildren();
  addPosition(false, false);
  window.clearTimeout(copyStatusTimer);
  copyStatus.hidden = true;
  copyFallback.hidden = true;
  updateTotals();
  updatePrintHeading();
  resizeComment();
  saveDraft();
  positionsBody.querySelector(".item-name").focus();
}

function formatQuantity(value) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2
  }).format(toNumber(value)).replace(/[\u00a0\u202f]/g, " ");
}

function createWhatsAppText() {
  const lines = [
    `Смета № ${estimateNumber.value.trim() || "—"} от ${formatDateForPrint(estimateDate.value)}`
  ];

  positionsBody.querySelectorAll("tr").forEach((row) => {
    const name = row.querySelector(".item-name").value.trim();
    const quantityValue = row.querySelector(".item-quantity").value;
    const priceValue = row.querySelector(".item-price").value;

    if (!name && !quantityValue.trim() && !priceValue.trim()) {
      return;
    }

    const quantity = formatQuantity(quantityValue);
    const unit = row.querySelector(".item-unit").value;
    const price = formatMoney(toNumber(priceValue));
    const lineTotal = row.querySelector(".line-total").textContent;
    lines.push(`• ${name || "Без названия"} — ${quantity} ${unit} × ${price} = ${lineTotal}`);
  });

  if (!discountRow.hidden) {
    lines.push(`Скидка ${formatQuantity(discountRate.value)}%: ${discountAmount.textContent}`);
  }

  if (!vatRow.hidden) {
    lines.push(`НДС ${formatQuantity(vatRate.value)}%: ${vatAmount.textContent}`);
  }

  lines.push(`Итого к оплате: ${grandTotal.textContent}`);
  return lines.join("\n");
}

function showCopySuccess() {
  copyFallback.hidden = true;
  copyStatus.hidden = false;
  window.clearTimeout(copyStatusTimer);
  copyStatusTimer = window.setTimeout(() => {
    copyStatus.hidden = true;
  }, 2000);
}

function showCopyFallback(text) {
  window.clearTimeout(copyStatusTimer);
  copyStatus.hidden = true;
  copyText.value = text;
  copyFallback.hidden = false;
  copyText.focus();
  copyText.select();
}

async function copyForWhatsApp() {
  const text = createWhatsAppText();

  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error("Clipboard API is unavailable");
    }

    await navigator.clipboard.writeText(text);
    showCopySuccess();
  } catch (error) {
    showCopyFallback(text);
  }
}

function toNumber(value) {
  const normalized = String(value)
    .trim()
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(",", ".");

  if (normalized === "") {
    return 0;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0
  }).format(safeValue);

  return `${formatted.replace(/[\u00a0\u202f]/g, " ")} ${currency.value}`;
}

function updateTotals() {
  let positionsTotal = 0;

  positionsBody.querySelectorAll("tr").forEach((row) => {
    const quantity = toNumber(row.querySelector(".item-quantity").value);
    const price = toNumber(row.querySelector(".item-price").value);
    const lineSum = Math.round(quantity * price);
    const safeLineSum = Number.isFinite(lineSum) ? lineSum : 0;

    row.querySelector(".line-total").textContent = formatMoney(safeLineSum);
    positionsTotal += safeLineSum;
  });

  const discount = Math.round(positionsTotal * toNumber(discountRate.value) / 100);
  const afterDiscount = positionsTotal - discount;
  const vat = Math.round(afterDiscount * toNumber(vatRate.value) / 100);
  const total = afterDiscount + vat;

  subtotal.textContent = formatMoney(positionsTotal);
  discountAmount.textContent = formatMoney(-discount);
  discountedTotal.textContent = formatMoney(afterDiscount);
  vatAmount.textContent = formatMoney(vat);
  grandTotal.textContent = formatMoney(total);

  const hasDiscount = discount !== 0;
  discountRow.hidden = !hasDiscount;
  discountedRow.hidden = !hasDiscount;
  vatRow.hidden = vat === 0;
}

function addPosition(shouldFocus = false, shouldSave = true) {
  const fragment = positionTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");
  positionsBody.append(fragment);
  updateDuplicateButton(row);

  if (shouldFocus) {
    row.querySelector(".item-name").focus();
  }

  if (shouldSave) {
    saveDraft();
  }
}

function clearRow(row) {
  row.querySelector(".item-name").value = "";
  row.querySelector(".item-quantity").value = "";
  row.querySelector(".item-unit").value = "шт";
  row.querySelector(".item-price").value = "";
  updateDuplicateButton(row);
  row.querySelector(".item-name").focus();
}

function isPositionEmpty(row) {
  return !row.querySelector(".item-name").value.trim()
    && !row.querySelector(".item-quantity").value.trim()
    && !row.querySelector(".item-price").value.trim();
}

function updateDuplicateButton(row) {
  row.querySelector(".duplicate-button").disabled = isPositionEmpty(row);
}

function duplicatePosition(sourceRow) {
  if (isPositionEmpty(sourceRow)) {
    return;
  }

  const fragment = positionTemplate.content.cloneNode(true);
  const duplicatedRow = fragment.querySelector("tr");
  duplicatedRow.querySelector(".item-name").value = sourceRow.querySelector(".item-name").value;
  duplicatedRow.querySelector(".item-quantity").value = sourceRow.querySelector(".item-quantity").value;
  duplicatedRow.querySelector(".item-unit").value = sourceRow.querySelector(".item-unit").value;
  duplicatedRow.querySelector(".item-price").value = sourceRow.querySelector(".item-price").value;
  sourceRow.after(fragment);
  updateDuplicateButton(duplicatedRow);
  updateTotals();
  saveDraft();
  duplicatedRow.querySelector(".item-name").focus();
}

positionsBody.addEventListener("input", (event) => {
  if (event.target.matches(".item-name, .item-quantity, .item-price")) {
    updateDuplicateButton(event.target.closest("tr"));
  }

  if (event.target.matches(".item-quantity, .item-price")) {
    updateTotals();
  }
});

positionsBody.addEventListener("click", (event) => {
  const duplicateButton = event.target.closest(".duplicate-button");

  if (duplicateButton) {
    duplicatePosition(duplicateButton.closest("tr"));
    return;
  }

  const removeButton = event.target.closest(".remove-button");

  if (!removeButton) {
    return;
  }

  const row = removeButton.closest("tr");

  if (positionsBody.rows.length === 1) {
    clearRow(row);
  } else {
    row.remove();
  }

  updateTotals();
  saveDraft();
});

positionsBody.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.target.tagName === "BUTTON") {
    return;
  }

  const currentRow = event.target.closest("tr");

  if (currentRow === positionsBody.lastElementChild) {
    event.preventDefault();
    addPosition(true);
  }
});

addPositionButton.addEventListener("click", () => addPosition(true));
discountRate.addEventListener("input", updateTotals);
vatRate.addEventListener("input", updateTotals);
currency.addEventListener("change", updateTotals);
estimateNumber.addEventListener("input", updatePrintHeading);
estimateDate.addEventListener("change", updatePrintHeading);
comment.addEventListener("input", resizeComment);
printEstimateButton.addEventListener("click", () => {
  updatePrintHeading();
  window.print();
});
window.addEventListener("beforeprint", updatePrintHeading);
copyWhatsAppButton.addEventListener("click", copyForWhatsApp);
newEstimateButton.addEventListener("click", startNewEstimate);
themeButtons.forEach((button) => {
  button.addEventListener("click", () => applyTheme(button.dataset.themeValue));
});
document.addEventListener("input", saveDraft);
document.addEventListener("change", saveDraft);

estimateDate.value = getLocalDate();
applyTheme(document.documentElement.dataset.theme, false);
if (!restoreDraft()) {
  addPosition(false, false);
}
updateTotals();
updatePrintHeading();
resizeComment();
