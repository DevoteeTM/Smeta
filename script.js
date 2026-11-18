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

function addPosition(shouldFocus = false) {
  const fragment = positionTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");
  positionsBody.append(fragment);

  if (shouldFocus) {
    row.querySelector(".item-name").focus();
  }
}

function clearRow(row) {
  row.querySelector(".item-name").value = "";
  row.querySelector(".item-quantity").value = "";
  row.querySelector(".item-unit").value = "шт";
  row.querySelector(".item-price").value = "";
  row.querySelector(".item-name").focus();
}

positionsBody.addEventListener("input", (event) => {
  if (event.target.matches(".item-quantity, .item-price")) {
    updateTotals();
  }
});

positionsBody.addEventListener("click", (event) => {
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

estimateDate.value = getLocalDate();
addPosition();
updateTotals();
updatePrintHeading();
