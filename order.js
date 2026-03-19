if (typeof API_URL === "undefined") {
    var API_URL = "http://localhost:3000/api";
}

// 🔥 PLACE ORDER
window.placeOrder = async function () {
    const clientName = document.getElementById("clientName").value;
    const supplierName = document.getElementById("supplierName").value;
    const supplierLocation = document.getElementById("supplierLocation").value;
    const goods = document.getElementById("goods").value;
    const quantity = document.getElementById("quantity").value;
    const deliveryLocation = document.getElementById("deliveryLocation").value;

    if (!clientName || !supplierName || !goods || !quantity || !deliveryLocation) {
        alert("Fill all fields");
        return;
    }

    // 🔥 STEP UI UPDATE
    document.getElementById("step1")?.classList.remove("active");
    document.getElementById("step2")?.classList.add("active");

    const orderData = {
        clientName,
        supplierName,
        supplierLocation,
        goods,
        quantity,
        deliveryLocation,
        status: "Pending"
    };

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            // 🔥 SUCCESS BAR
            showSuccess("✅ Order placed successfully!");

            // 🔥 GO TO ORDERS
            setTimeout(() => {
                loadPage("orders.html");
            }, 500);
        } else {
            alert("❌ Failed to place order");
        }
    } catch (err) {
        console.error("Error placing order:", err);
    }
};

let currentFilter = "All";

window.filterOrders = function (status, btn) {
    currentFilter = status;

    // 🔥 ACTIVE BUTTON
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    initOrders();
};

// 📦 INIT ORDERS PAGE
window.initOrders = async function () {
    const container = document.getElementById("ordersList");
    if (!container) return;

    let orders = [];
    try {
        const res = await fetch(`${API_URL}/orders`);
        orders = await res.json();
    } catch (err) {
        console.error("Error fetching orders:", err);
    }

    container.innerHTML = "";

    // 🔥 FILTER BY CLIENT
    const clientName = localStorage.getItem("clientName") || "Client";
    orders = orders.filter(o => o.clientName === clientName);

    // 🔥 FILTER BY STATUS
    if (currentFilter !== "All") {
        orders = orders.filter(o => o.status === currentFilter);
    }

    if (orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:20px;">
                    No orders yet
                </td>
            </tr>
        `;
        return;
    }

    // 🔥 LATEST FIRST
    orders.slice().reverse().forEach(order => {

        const tr = document.createElement("tr");

        // 🔥 STATUS CLASS
        const statusClass = order.status.toLowerCase();

        tr.innerHTML = `
            <td>${order.clientName}</td>

            <td>
                <strong>${order.goods}</strong><br>
                <small style="color:#64748b;">${order.supplierName}</small>
            </td>

            <td>${order.quantity}</td>

            <td>
                <small>${order.createdAt || "-"}</small>
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${order.status}
                </span>
            </td>

            <td>
                <span class="delete-btn" onclick="deleteOrder('${order._id}')">
                    ✕
                </span>
            </td>
        `;

        // 🔍 CLICK ROW → DETAILS
        tr.onclick = (e) => {
            if (
                e.target.classList.contains("delete-btn") ||
                e.target.classList.contains("action-btn")
            ) return;

            showOrderDetails(order);
        };

        container.appendChild(tr);
    });
};



// ❌ DELETE ORDER
window.deleteOrder = async function (id) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
        const res = await fetch(`${API_URL}/orders/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showSuccess("🗑️ Order deleted");
            initOrders();
        } else {
            alert("❌ Failed to delete order");
        }
    } catch (err) {
        console.error("Error deleting order:", err);
    }
};



//  MODAL DETAILS (CENTER POPUP)
window.showOrderDetails = function (order) {
    const modal = document.createElement("div");
    modal.className = "modal";

    modal.innerHTML = `
        <div class="modal-content">
            <h3>Order Details</h3>
            <p><b>Client:</b> ${order.clientName}</p>
            <p><b>Supplier:</b> ${order.supplierName}</p>
            <p><b>Location:</b> ${order.supplierLocation}</p>
            <p><b>Goods:</b> ${order.goods}</p>
            <p><b>Quantity:</b> ${order.quantity}</p>
            <p><b>Delivery:</b> ${order.deliveryLocation}</p>
            <p><b>Status:</b> ${order.status}</p>
            <br>
            <button onclick="this.closest('.modal').remove()">Close</button>
        </div>
    `;

    document.body.appendChild(modal);
};



// 🔔 SUCCESS BAR
function showSuccess(message) {
    const bar = document.createElement("div");
    bar.className = "success-bar";
    bar.innerText = message;

    document.body.appendChild(bar);

    setTimeout(() => {
        bar.remove();
    }, 3000);
}


// 👤 LOAD PROFILE (CLIENT)
window.loadProfile = async function () {
    const clientName = localStorage.getItem("clientName");
    if (!clientName) return;

    try {
        const res = await fetch(`${API_URL}/client/${clientName}`);
        const data = await res.json();

        if (res.ok) {
            const nameEl = document.getElementById("profileName");
            const locEl = document.getElementById("profileLocation");
            const emailEl = document.getElementById("profileEmail");
            const licEl = document.getElementById("profileLicense");
            const countryEl = document.getElementById("profileCountry");

            if (nameEl) nameEl.value = data.name;
            if (locEl) locEl.value = data.location || "";
            if (emailEl) emailEl.value = data.email || "";
            if (licEl) licEl.value = data.license || "";
            if (countryEl) countryEl.value = data.country || "";
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
};

// 👤 UPDATE PROFILE (CLIENT)
window.updateProfile = async function (role) {
    const name = localStorage.getItem("clientName");
    const location = document.getElementById("profileLocation").value;
    const email = document.getElementById("profileEmail").value;
    const license = document.getElementById("profileLicense").value;
    const country = document.getElementById("profileCountry").value;

    try {
        const res = await fetch(`${API_URL}/client/${name}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, email, license, country })
        });

        if (res.ok) {
            alert("✅ Profile updated successfully!");
        } else {
            alert("❌ Failed to update profile");
        }
    } catch (err) {
        console.error("Error updating profile:", err);
    }
};