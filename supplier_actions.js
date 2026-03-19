if (typeof API_URL === "undefined") {
    var API_URL = "http://localhost:3000/api";
}

// ===============================
// 📦 ADD GOODS (SUPPLIER)
// ===============================
window.addGoods = async function () {
    const name = document.getElementById("goodsName").value;
    const category = document.getElementById("goodsCategory").value;
    const description = document.getElementById("goodsDescription").value;
    const price = document.getElementById("goodsPrice").value;
    const quantity = document.getElementById("goodsQuantity").value;
    const tons = document.getElementById("goodsTons").value;
    const vehicle = document.getElementById("transportVehicle").value;
    const capacity = document.getElementById("vehicleCapacity").value;
    const maxShipmentTime = document.getElementById("maxShipmentTime").value;
    const expiryDate = document.getElementById("expiryDate").value;

    if (!name || !price || !quantity || !tons || !vehicle || !capacity || !maxShipmentTime) {
        alert("⚠️ Please fill all required fields (Price, Quantity, Tons, Vehicle Info)");
        return;
    }

    const supplierName = localStorage.getItem("supplierName") || "Supplier";
    
    const goodsEntry = {
        supplierName,
        name,
        category,
        description,
        price: Number(price),
        quantity: Number(quantity),
        tons: Number(tons),
        vehicle,
        capacity: Number(capacity),
        maxShipmentTime,
        expiryDate: expiryDate || null
    };

    try {
        const response = await fetch(`${API_URL}/goods`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goodsEntry)
        });

        if (response.ok) {
            alert("✅ Goods added successfully!");
            clearForm();
            
            if (document.getElementById("total-goods-count")) {
                initSupplierDashboard();
            }
        } else {
            console.error("Failed to add goods:", await response.text());
        }
    } catch (err) {
        console.error("Error adding goods:", err);
    }
};

window.clearForm = function() {
    const inputs = document.querySelectorAll(".form-card input, .form-card textarea, .form-card select");
    inputs.forEach(i => i.value = '');
    if (document.getElementById("goodsCategory")) document.getElementById("goodsCategory").value = 'General';
};



// ===============================
// 📊 INIT INVENTORY PAGE
// ===============================
window.initInventory = async function () {
    const container = document.getElementById("inventoryList");
    if (!container) return;

    const supplierName = localStorage.getItem("supplierName") || "Supplier";
    
    let goods = [];
    try {
        const res = await fetch(`${API_URL}/goods?supplierName=${supplierName}`);
        goods = await res.json();
    } catch (err) {
        console.error("Error fetching inventory:", err);
    }

    container.innerHTML = "";

    if (goods.length === 0) {
        container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No inventory added yet.</td></tr>`;
        return;
    }

    goods.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="badge" style="background:#f1f5f9; padding:4px 8px; border-radius:4px; font-size:12px;">${item.category || "General"}</span></td>
            <td style="color:#16a34a; font-weight:bold;">$${item.price || 0}</td>
            <td>${item.quantity}</td>
            <td>${item.tons}</td>
            <td>${item.vehicle} (${item.capacity}T)</td>
            <td>
                <span class="delete-btn" style="cursor:pointer; color:#ef4444;" onclick="deleteGoods('${item._id}')">✕</span>
            </td>
        `;

        container.appendChild(tr);
    });
}
;

// ===============================
// ❌ DELETE GOODS
// ===============================
window.deleteGoods = async function (id) {
    if (!confirm("Are you sure you want to remove this item?")) return;

    try {
        const res = await fetch(`${API_URL}/goods/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert("🗑️ Item removed");
            initInventory();
            // If on home page, refresh stats
            if (document.getElementById("total-goods-count")) {
                initSupplierDashboard();
            }
        } else {
            alert("❌ Failed to delete item");
        }
    } catch (err) {
        console.error("Error deleting goods:", err);
    }
};

// ===============================
// 🏠 INIT SUPPLIER DASHBOARD (STATS)
// ===============================
window.initSupplierDashboard = async function () {
    const supplierName = localStorage.getItem("supplierName");
    if (!supplierName) return;

    try {
        const res = await fetch(`${API_URL}/supplier/stats/${supplierName}`);
        const stats = await res.json();

        const goodsEl = document.getElementById("total-goods-count");
        const pendingEl = document.getElementById("pending-orders-count");
        const deliveredEl = document.getElementById("delivered-orders-count");

        if (goodsEl) goodsEl.textContent = stats.totalGoods;
        if (pendingEl) pendingEl.textContent = stats.pendingOrders;
        if (deliveredEl) deliveredEl.textContent = stats.deliveredOrders;

    } catch (err) {
        console.error("Error fetching supplier stats:", err);
    }
};


let currentSupplierFilter = "All";

window.filterSupplierOrders = function (status, btn) {
    currentSupplierFilter = status;

    // 🔥 ACTIVE BUTTON
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    initSupplierOrders();
};

// ===============================
// 📊 INIT SUPPLIER ORDERS PAGE
// ===============================
window.initSupplierOrders = async function () {
    const container = document.getElementById("supplierOrdersList");
    if (!container) return;

    // Fetch directly from API
    let orders = [];
    try {
        const res = await fetch(`${API_URL}/orders`);
        orders = await res.json();
    } catch(e) {
        console.error("Error fetching orders:", e);
    }

    // Filter by this supplier's orders
    const supplierName = localStorage.getItem("supplierName") || "Supplier";
    orders = orders.filter(o => o.supplierName === supplierName);

    container.innerHTML = "";

    // 🔥 FILTER BY STATUS
    if (currentSupplierFilter !== "All") {
        orders = orders.filter(o => o.status === currentSupplierFilter);
    }

    if (orders.length === 0) {
        container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No orders assigned to you yet.</td></tr>`;
        return;
    }

    orders.slice().reverse().forEach(order => {
        const tr = document.createElement("tr");

        const statusClass = order.status.toLowerCase();

        tr.innerHTML = `
            <td>${order.clientName}</td>
            <td>
                <strong>${order.goods}</strong><br>
                <small style="color:#64748b;">${order.supplierName}</small>
            </td>
            <td>${order.quantity}</td>
            <td><small>${order.createdAt || "-"}</small></td>
            <td>
                <span class="status ${statusClass}">
                    ${order.status}
                </span>
            </td>
            <td>
                <select onchange="updateOrderStatus('${order._id}', this.value)">
                    <option value="" disabled selected>Update Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Transporting">Transporting</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Delivered">Delivered</option>
                </select>
                <button class="action-btn" onclick="acceptOrder('${order._id}')" style="padding: 4px 8px; font-size: 12px; margin-top: 5px; width: auto; background-color: #10b981; color: white;">Accept</button>
                <button class="action-btn" onclick="rejectOrder('${order._id}')" style="padding: 4px 8px; font-size: 12px; margin-top: 5px; width: auto; background-color: #ef4444; color: white;">Reject</button>
            </td>
        `;
        
        container.appendChild(tr);
    });
};

// ===============================
// ✅ ACCEPT/REJECT & UPDATE STATUS
// ===============================
window.updateOrderStatus = async function(id, newStatus, routes = []) {
    if (!newStatus) return;
    
    try {
        const body = { status: newStatus };
        if (routes && routes.length > 0) body.routes = routes;

        const response = await fetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            alert("✅ Order updated to: " + newStatus);
            initSupplierOrders();
        }
    } catch (err) {
        console.error("Error updating status:", err);
    }
};

window.acceptOrder = function(id) {
    // 🔥 OPEN ROUTE SELECTION MODAL
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "routeModal";

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; width: 95%; padding: 30px; max-height: 90vh; display:flex; flex-direction:column; background: #111827; color: white; border: 1px solid #334155; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <h3 style="margin-top:0; color: #00e5c1; display:flex; align-items:center; gap:10px;">
                <span>🗺️</span> Plan Detailed Port-to-Port Route
            </h3>
            <p style="font-size: 14px; color: #94a3b8; margin-bottom: 25px;">
                Specify the "From Port" and "To Port" for 2 to 10 delivery segments. Clear and accurate routes help clients track their shipments.
            </p>
            
            <div id="routeInputs" style="flex:1; overflow-y: auto; overflow-x: hidden; padding-right: 15px; margin-bottom:20px; border: 1px solid #334155; padding: 20px; border-radius: 12px; background: #0f172a;">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                    <div class="route-segment" style="display:flex; gap:15px; margin-bottom:15px; align-items:center;">
                        <span style="font-weight:700; color:#475569; min-width:60px; font-size:12px; text-transform:uppercase;">Leg ${i.toString().padStart(2, '0')}</span>
                        <input type="text" class="from-port" placeholder="From Port ${i <= 2 ? '(Required)' : ''}" style="flex:1; padding:12px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:white; font-size:14px; outline:none;">
                        <span style="color:#2563eb; font-size:18px; font-weight:bold;">➡️</span>
                        <input type="text" class="to-port" placeholder="To Port ${i <= 2 ? '(Required)' : ''}" style="flex:1; padding:12px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:white; font-size:14px; outline:none;">
                    </div>
                `).join('')}
            </div>


            <div style="display:flex; gap:10px;">
                <button id="submitRoutes" style="flex:1; background:#2563eb; color:white; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer;">Start Transport</button>
                <button onclick="document.getElementById('routeModal').remove()" style="flex:1; background:#f1f5f9; color:#475569; border:none; padding:12px; border-radius:8px; font-weight:600; cursor:pointer;">Cancel</button>
            </div>
        </div>
    `;


    document.body.appendChild(modal);

    document.getElementById("submitRoutes").onclick = () => {
        const segments = document.querySelectorAll(".route-segment");
        const routes = [];

        segments.forEach(seg => {
            const from = seg.querySelector(".from-port").value.trim();
            const to = seg.querySelector(".to-port").value.trim();
            if (from && to) {
                routes.push({ from, to });
            }
        });

        if (routes.length < 2) {
            alert("⚠️ Please enter at least 2 complete route segments (From Port and To Port).");
            return;
        }

        updateOrderStatus(id, "Transporting", routes);
        modal.remove();
    };
};



window.rejectOrder = async function(id) {
    // We update to "Rejected" in the DB, rather than local splice. (We would need to add Rejected to status enum / ui but it is implicit for now)
    updateOrderStatus(id, "Rejected");
};

// 👤 LOAD PROFILE (SUPPLIER)
window.loadProfile = async function () {
    const supplierName = localStorage.getItem("supplierName");
    if (!supplierName) return;

    try {
        const res = await fetch(`${API_URL}/supplier/${supplierName}`);
        const data = await res.json();

        if (res.ok) {
            const nameEl = document.getElementById("profileName");
            const locEl = document.getElementById("profileLocation");
            const contactEl = document.getElementById("profileContact");
            const emailEl = document.getElementById("profileEmail");
            const licEl = document.getElementById("profileLicense");
            const countryEl = document.getElementById("profileCountry");

            if (nameEl) nameEl.value = data.name;
            if (locEl) locEl.value = data.location || "";
            if (contactEl) contactEl.value = data.contact || "";
            if (emailEl) emailEl.value = data.email || "";
            if (licEl) licEl.value = data.license || "";
            if (countryEl) countryEl.value = data.country || "";
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
};

// 👤 UPDATE PROFILE (SUPPLIER)
window.updateProfile = async function () {
    const name = localStorage.getItem("supplierName");
    const location = document.getElementById("profileLocation").value;
    const contact = document.getElementById("profileContact").value;
    const email = document.getElementById("profileEmail").value;
    const license = document.getElementById("profileLicense").value;
    const country = document.getElementById("profileCountry").value;

    try {
        const res = await fetch(`${API_URL}/supplier/${name}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, contact, email, license, country })
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

