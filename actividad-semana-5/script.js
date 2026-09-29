"use strict";

let queue = [];
let syncing = false;
const form = document.getElementById("saleForm");
const productInput = document.getElementById("product");
const quantityInput = document.getElementById("quantity");
const syncButton = document.getElementById("syncButton");
const operations = document.getElementById("operations");
const message = document.getElementById("message");

function saveQueue() {
  try {
    localStorage.setItem("operations", JSON.stringify(queue));
    return true;
  } catch {
    message.textContent = "No se pudo guardar. Revisa el espacio y los permisos de almacenamiento del navegador.";
    return false;
  }
}

function renderOperations() {
  operations.replaceChildren();
  syncButton.disabled = syncing || !queue.some(operation => operation.status === "pending");
  if (queue.length === 0) {
    operations.textContent = "Todavía no hay ventas registradas.";
  }
  for (const operation of queue) {
    const card = document.createElement("div");
    card.className = "operation";
    card.dataset.operationId = operation.operationId;
    card.dataset.status = operation.status;
    for (const [label, value] of [
      ["Producto", operation.payload.product],
      ["Cantidad", operation.payload.quantity],
      ["operationId", operation.operationId],
      ["Estado", operation.status]
    ]) {
      const line = document.createElement("p");
      // textContent permite mostrar el producto sin interpretarlo como HTML.
      line.textContent = `${label}: ${value}`;
      card.append(line);
    }
    if (operation.status === "failed") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "Reintentar";
      retry.addEventListener("click", () => {
        operation.status = "pending";
        if (!saveQueue()) operation.status = "failed";
        else message.textContent = "Operación pendiente. Presiona Sincronizar operaciones para volver a enviarla.";
        renderOperations();
      });
      card.append(retry);
    }
    operations.append(card);
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const product = productInput.value.trim();
  const quantity = Number(quantityInput.value);
  if (!product || !Number.isSafeInteger(quantity) || quantity <= 0) {
    message.textContent = "Escribe un producto y una cantidad entera mayor que cero.";
    return;
  }
  const operation = {
    operationId: crypto.randomUUID(),
    type: "CREATE_SALE",
    payload: { product: product, quantity: quantity },
    status: "pending"
  };
  queue.push(operation);
  if (!saveQueue()) queue.pop();
  else {
    message.textContent = "Venta guardada localmente como pending.";
    form.reset();
    productInput.focus();
  }
  renderOperations();
});

function fakeServerRequest(operation) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = Math.random() > 0.4;
      if (success) resolve({ message: "Operación procesada" });
      else reject(new Error("Error del servidor"));
    }, 2000);
  });
}

syncButton.addEventListener("click", async () => {
  if (syncing) return;
  const pendingOperations = queue.filter(operation => operation.status === "pending");
  syncing = true;
  message.textContent = "Sincronizando operaciones pendientes…";
  let stored = true;
  try {
    for (const operation of pendingOperations) {
      operation.status = "inFlight";
      if (!saveQueue()) {
        operation.status = "pending";
        stored = false;
        break;
      }
      renderOperations();
      try {
        await fakeServerRequest(operation);
        operation.status = "done";
      } catch (error) {
        operation.status = "failed";
      }
      stored = saveQueue();
      renderOperations();
      if (!stored) break;
    }
  } finally {
    syncing = false;
    renderOperations();
    if (stored) message.textContent = "Sincronización terminada. Puedes reintentar las operaciones failed.";
  }
});

function loadQueue() {
  try {
    const savedOperations = localStorage.getItem("operations");
    if (savedOperations) {
      const saved = JSON.parse(savedOperations);
      const statuses = ["pending", "inFlight", "failed", "done"];
      if (!Array.isArray(saved) || !saved.every(operation =>
        operation && typeof operation.operationId === "string" &&
        operation.type === "CREATE_SALE" && statuses.includes(operation.status) &&
        typeof operation.payload?.product === "string" &&
        Number.isSafeInteger(operation.payload.quantity) && operation.payload.quantity > 0
      )) throw new Error("Datos inválidos");
      queue = saved;
      // Una petición interrumpida al recargar ya no puede recibir su respuesta.
      // Se requiere un reintento explícito; nunca se asume que terminó con éxito.
      let interrupted = false;
      for (const operation of queue) {
        if (operation.status === "inFlight") {
          operation.status = "failed";
          interrupted = true;
        }
      }
      message.textContent = interrupted
        ? "Se interrumpió una sincronización. Usa Reintentar en las operaciones failed."
        : "Cola recuperada del almacenamiento local.";
      if (interrupted) saveQueue();
    }
  } catch {
    message.textContent = "No se pudo recuperar la cola. Revisa la clave operations y los permisos antes de registrar ventas.";
    document.getElementById("registerButton").disabled = true;
  }
  renderOperations();
}

loadQueue();
