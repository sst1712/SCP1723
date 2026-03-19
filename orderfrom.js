/* 🔥 INIT ORDER FORM */
window.initOrders = function () {
    const container = document.getElementById("ordersList");
    if (!container) return;

    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    console.log("Loaded Orders:", orders);

    container.innerHTML = "";

    orders.forEach(order => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p>${order.clientName} - ${order.goods} - ${order.quantity}</p>
        `;
        container.appendChild(div);
    });
};

/* 📦 PLACE ORDER */
window.placeOrder = function () {


const clientName = document.getElementById("clientName").value;
const supplierName = document.getElementById("supplierName").value;
const supplierLocation = document.getElementById("supplierLocation").value;
const goods = document.getElementById("goods").value;
const quantity = document.getElementById("quantity").value;
const deliveryLocation = document.getElementById("deliveryLocation").value;

// 🔒 VALIDATION
if (!clientName || !supplierName || !goods || !quantity || !deliveryLocation) {
    alert("⚠️ Please fill all fields");
    return;
}

// 📦 CREATE ORDER OBJECT
const order = {
    id: Date.now(),
    clientName,
    supplierName,
    supplierLocation,
    goods,
    quantity,
    deliveryLocation,
    status: "Pending",
    createdAt: new Date().toLocaleString()
};

// 💾 SAVE TO LOCAL STORAGE
let orders = JSON.parse(localStorage.getItem("orders")) || [];
orders.push(order);
localStorage.setItem("orders", JSON.stringify(orders));

// 🔔 SUCCESS MESSAGE
showSuccess("✅ Order placed successfully!");

// 🔄 CLEAR FORM
document.getElementById("goods").value = "";
document.getElementById("quantity").value = "";
document.getElementById("deliveryLocation").value = "";

// 🔀 REDIRECT TO ORDERS PAGE
setTimeout(() => {
    loadPage("orders.html");
}, 600);

};

/* 🔔 SUCCESS BAR */
function showSuccess(message) {
const bar = document.createElement("div");
bar.className = "success-bar";
bar.innerText = message;

document.body.appendChild(bar);

setTimeout(() => {
    bar.remove();
}, 2500);

}
