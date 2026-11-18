const positionsBody = document.querySelector("#positions-body");
const positionTemplate = document.querySelector("#position-template");
const addPositionButton = document.querySelector("#add-position");
const grandTotal = document.querySelector("#grand-total");
const estimateDate = document.querySelector("#estimate-date");

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2
  }).format(safeValue);

  return `${formatted.replace(/[\u00a0\u202f]/g, " ")} ₸`;
}

function updateTotals() {
  let total = 0;

  positionsBody.querySelectorAll("tr").forEach((row) => {
    const quantity = toNumber(row.querySelector(".item-quantity").value);
    const price = toNumber(row.querySelector(".item-price").value);
    const lineSum = quantity * price;
    const safeLineSum = Number.isFinite(lineSum) ? lineSum : 0;

    row.querySelector(".line-total").textContent = formatMoney(safeLineSum);
    total += safeLineSum;
  });

  grandTotal.textContent = formatMoney(total);
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

estimateDate.value = getLocalDate();
addPosition();
updateTotals();
