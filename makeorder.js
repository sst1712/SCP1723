if (typeof API_URL === "undefined") {
    var API_URL = "http://localhost:3000/api";
}

// ===============================
// 🔍 INIT SEARCH PAGE
// ===============================
window.initSearch = function () {
    const input = document.getElementById("search");
    const dropdown = document.getElementById("dropdown");
    const popularList = document.getElementById("popularList");

    if (!input) return;

    console.log("✅ Search initialized");

    // 🔹 Popular items
    const popularData = [
        "Chennai Port",
        "Mumbai Port",
        "Ravi Logistics",
        "Global Exports"
    ];

    if (popularList) {
        popularList.innerHTML = "";
        popularData.forEach(item => {
            const div = document.createElement("div");
            div.className = "popular-item";
            div.textContent = item;

            div.onclick = () => {
                input.value = item;
                input.dispatchEvent(new Event("input"));
            };

            popularList.appendChild(div);
        });
    }

    // 🔍 SEARCH INPUT
    input.oninput = async () => {
        const query = input.value.trim();

        if (!query) {
            dropdown.style.display = "none";
            return;
        }

        let results = [];

        try {
            const res = await fetch(`${API_URL}/search?q=${query}`);
            if (res.ok) {
                const data = await res.json();
                results = {
                    suppliers: data.suppliers || [],
                    goods: data.goodsResults || []
                };
            }
        } catch (err) {
            console.warn("⚠️ Backend search failed or unreachable. Using fallback.");
            results = { suppliers: [], goods: [] };
        }

        // 🔥 FALLBACK FOR PROTOTYPE / EMPTY DB: 
        if (results.suppliers.length === 0 && results.goods.length === 0) {
            const fallbackMatches = popularData.filter(p => p.toLowerCase().includes(query.toLowerCase()));
            results.suppliers = fallbackMatches.map(name => ({ name: name, location: "Local Demo Location" }));
        }

        dropdown.innerHTML = "";
        dropdown.style.display = "block";

        if (results.suppliers.length === 0 && results.goods.length === 0) {
            dropdown.innerHTML = `<div class='dropdown-item' id='custom-supplier-btn'>
                <strong>Use "${query}"</strong><br>
                <small>Create Custom Order</small>
            </div>`;
            
            document.getElementById("custom-supplier-btn").onclick = () => {
                input.value = query;
                dropdown.style.display = "none";
                
                document.getElementById("supplierName").value = query;
                document.getElementById("supplierLocation").value = "Custom Location";
                document.getElementById("goods").value = "General Goods";
                document.getElementById("clientName").value = localStorage.getItem("clientName") || "Client";
                
                // Fallback item for calculation
                window.currentSelectedGoods = { price: 0, maxShipmentTime: "Contact Supplier" };
                
                goToStep(2);
            };

            return;
        }

        // 🔥 RENDER SUPPLIERS
        if (results.suppliers.length > 0) {
            const heading = document.createElement("div");
            heading.style = "padding: 8px; font-weight: bold; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #64748b;";
            heading.textContent = "🏢 Suppliers";
            dropdown.appendChild(heading);

            results.suppliers.forEach(item => {
                const div = document.createElement("div");
                div.className = "dropdown-item";
                div.innerHTML = `<strong>${item.name}</strong><br><small>${item.location}</small>`;
                div.onclick = () => {
                    input.value = item.name;
                    dropdown.style.display = "none";
                    document.getElementById("searchSection").style.display = "none";
                    document.getElementById("formSection").style.display = "block";
                    document.getElementById("supplierName").value = item.name;
                    document.getElementById("supplierLocation").value = item.location;
                    document.getElementById("clientName").value = localStorage.getItem("userName") || localStorage.getItem("clientName") || "Client";
                };
                dropdown.appendChild(div);
            });
        }

        // 🔥 RENDER GOODS
        if (results.goods.length > 0) {
            const heading = document.createElement("div");
            heading.style = "padding: 8px; font-weight: bold; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #64748b; border-top: 1px solid #e2e8f0;";
            heading.textContent = "📦 Products Found";
            dropdown.appendChild(heading);

            results.goods.forEach(item => {
                const div = document.createElement("div");
                div.className = "dropdown-item";
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>${item.goodsName}</strong>
                        <span style="color:#2563eb; font-weight:700;">$${item.price}/ton</span>
                    </div>
                    <small>Supplier: ${item.supplierName} (${item.location})</small>
                `;
                div.onclick = () => {
                    input.value = item.goodsName;
                    dropdown.style.display = "none";
                    
                    // Populate Form
                    document.getElementById("supplierName").value = item.supplierName;
                    document.getElementById("supplierLocation").value = item.location;
                    document.getElementById("goods").value = item.goodsName;
                    document.getElementById("clientName").value = localStorage.getItem("clientName") || "Client";
                    
                    // Store unit price and ETA for calculation
                    window.currentSelectedGoods = item;
                    
                    goToStep(2);
                };
                dropdown.appendChild(div);
            });
        }
    };


    // 🔽 CLOSE DROPDOWN
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-box")) {
            dropdown.style.display = "none";
        }
    });
};



// ===============================
// 📝 INIT ORDER FORM
// ===============================
window.initOrderForm = function () {
    const clientNameInput = document.getElementById("clientName");
    if (clientNameInput) {
        clientNameInput.value = localStorage.getItem("clientName") || "Client";
    }
};



// ===============================
// 🔙 BACK BUTTON
// ===============================
window.goToStep = function (step) {
    document.querySelectorAll(".wizard-content").forEach(el => el.style.display = "none");
    
    // Update Indicators (only if indicator elements exist for that step)
    const indicator = document.getElementById(`step-indicator-${step}`);
    if (indicator) {
        document.querySelectorAll(".step").forEach(el => el.classList.remove("active"));
        indicator.classList.add("active");
    }
    
    document.getElementById(`step-${step}`).style.display = "block";

    if (step === 2) {
        document.getElementById("clientName").value = localStorage.getItem("clientName") || "Guest";
    }
};


// 🔥 QUANTITY SHORTCUTS
window.setMinQty = function() {
    document.getElementById("quantity").value = 1;
};

window.setMaxQty = function() {
    const item = window.currentSelectedGoods;
    if (!item) return;
    // Set to available tons or capacity, whichever is lower
    const maxVal = Math.min(item.tons || 999, item.capacity || 999);
    document.getElementById("quantity").value = maxVal;
};

window.calculateTotal = function() {
    // Basic logic if needed, but summary is removed from UI
};

window.goBack = function () {
    goToStep(1);
};





// ===============================
// 📦 PLACE ORDER
// ===============================
window.placeOrder = async function () {
    const clientName = document.getElementById("clientName").value;
    const supplierName = document.getElementById("supplierName").value;
    const supplierLocation = document.getElementById("supplierLocation").value;
    const goods = document.getElementById("goods").value;
    const quantity = document.getElementById("quantity").value; // This is the requested tons
    const deliveryLocation = document.getElementById("deliveryLocation").value;

    if (!clientName || !supplierName || !goods || !quantity || !deliveryLocation) {
        alert("⚠️ Fill all fields");
        return;
    }

    const requestedTons = Number(quantity);

    try {
        // 🔥 VALIDATION: Fetch supplier inventory
        const goodsRes = await fetch(`${API_URL}/goods?supplierName=${supplierName}`);
        const inventory = await goodsRes.json();

        // Check if supplier has this specific goods item
        const matchingGoods = inventory.find(item => item.name.toLowerCase() === goods.toLowerCase());

        if (!matchingGoods) {
            alert(`❌ Error: This supplier does not provide ${goods}.`);
            return;
        }

        // Check available tons
        if (requestedTons > matchingGoods.tons) {
            alert(`❌ Error: Only ${matchingGoods.tons} tons of ${goods} available.`);
            return;
        }

        // Check vehicle capacity
        if (requestedTons > matchingGoods.capacity) {
            alert(`❌ Error: Supplier's vehicle capacity is only ${matchingGoods.capacity} tons.`);
            return;
        }

        const basePrice = requestedTons * matchingGoods.price;
        const logisticsFee = 100;
        const totalPrice = basePrice + logisticsFee;

        const orderData = {
            clientName,
            supplierName,
            supplierLocation,
            goods,
            quantity: requestedTons,
            deliveryLocation,
            status: "Pending",
            logisticsFee: logisticsFee,
            totalPrice: totalPrice
        };

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            // Populate Success Page with Supplier Contact Info
            const nameEl = document.getElementById("conf-supplier-name");
            const phoneEl = document.getElementById("conf-supplier-phone");
            const emailEl = document.getElementById("conf-supplier-email");

            if(nameEl) nameEl.textContent = supplierName;
            if(phoneEl) phoneEl.textContent = matchingGoods.phone || "+1 (555) 123-4567";
            if(emailEl) emailEl.textContent = matchingGoods.email || "supplier@supplychain.com";
            
            goToStep(3); // Success page is still step 3 in HTML
        } else {
            alert("❌ Failed to place order");
        }


    } catch (err) {
        console.error("Error placing order:", err);
        alert("❌ Error connecting to server");
    }
};



// ===============================
// 📊 INIT ORDERS PAGE
// ===============================
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

    const clientName = localStorage.getItem("clientName") || "Client";
    orders = orders.filter(o => o.clientName === clientName);

    // Initial Table Structure
    container.innerHTML = `
        <thead>
            <tr>
                <th>Supplier</th>
                <th>Goods</th>
                <th>Tracking</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody id="clientOrdersTableBody"></tbody>
    `;

    const tbody = document.getElementById("clientOrdersTableBody");
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:15px;">No orders placed yet.</td></tr>`;
        return;
    }

    orders.reverse().forEach(order => {
        const tr = document.createElement("tr");

        let trackingHtml = `<span style="color:#94a3b8; font-size:12px;"><i>Legs TBD</i></span>`;
        if (order.routes && order.routes.length > 0) {
            const first = order.routes[0].from || "Origin";
            const last = order.routes[order.routes.length - 1].to || "Dest";
            trackingHtml = `
                <div class="tracking-badge" title="Full route in details">
                    <span class="port-name">${first}</span>
                    <span class="arrow">➡️</span>
                    <span class="port-name">${last}</span>
                </div>
            `;
        }

        tr.innerHTML = `
            <td>
                <strong>${order.goods}</strong><br>
                <small style="color:#64748b;">${order.supplierName}</small>
            </td>
            <td>${order.supplierLocation || "-"}</td>
            <td>${trackingHtml}</td>
            <td>${order.quantity} Tons</td>
            <td><small>${new Date(order.createdAt).toLocaleDateString()}</small></td>
            <td>
                <span class="status ${order.status.toLowerCase()}">
                    ${order.status}
                </span>
            </td>
            <td>
                <span class="delete-btn" onclick="deleteOrder('${order._id}')">✕</span>
            </td>
        `;

        tr.onclick = (e) => {
            if (e.target.classList.contains("delete-btn")) return;
            showOrderDetails(order);
        };

        tbody.appendChild(tr);
    });
};




// ===============================
// ❌ DELETE ORDER
// ===============================
window.deleteOrder = async function (id) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
        const res = await fetch(`${API_URL}/orders/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            console.log("✅ Order deleted from DB");
            initOrders();
        } else {
            console.error("Failed to delete order");
            alert("❌ Failed to delete order");
        }
    } catch (err) {
        console.error("Error deleting order:", err);
    }
};



// ===============================
// 🔍 SHOW MODAL DETAILS
// ===============================
window.showOrderDetails = function (order) {
    const modal = document.createElement("div");
    modal.className = "modal";

    const routesHtml = order.routes && order.routes.length > 0 
        ? `<div style="margin-top:15px; background:#f8fafc; padding:12px; border-radius:8px;">
            <h4 style="margin:0 0 8px 0; color:#475569;">🗺️ Planned Port-to-Port Route</h4>
            <div style="font-size:13px; color:#1e293b;">
                ${order.routes.map((r, idx) => `
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; padding-bottom:5px; border-bottom: ${idx === order.routes.length - 1 ? 'none' : '1px dashed #e2e8f0'};">
                        <span style="font-weight:600;">${r.from}</span>
                        <span style="color:#2563eb; margin:0 10px;">➡️</span>
                        <span style="font-weight:600; text-align:right;">${r.to}</span>
                    </div>
                `).join('')}
            </div>
           </div>`
        : `<p style="color:#64748b; font-size:13px; margin-top:15px;"><i>Route not yet planned by supplier.</i></p>`;


    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <h3>Order Details</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:14px;">
                <p><b>Client:</b><br>${order.clientName}</p>
                <p><b>Supplier:</b><br>${order.supplierName}</p>
                <p><b>Goods:</b><br>${order.goods}</p>
                <p><b>Quantity:</b><br>${order.quantity} Tons</p>
            </div>
            
            <p><b>Delivery To:</b><br>${order.deliveryLocation}</p>
            
            <div style="margin-top:15px; border-top:1px solid #f1f5f9; padding-top:15px;">
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
                    <span>Service Tax:</span>
                    <span>$${(order.tax || 0).toFixed(2)}</span>
                </div>
                ${order.discount ? `
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px; color:#10b981;">
                    <span>Volume Discount:</span>
                    <span>-$${(order.discount).toFixed(2)}</span>
                </div>` : ''}
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
                    <span>Safety Insurance:</span>
                    <span>$${(order.insurance || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px; color:#2563eb;">
                    <span>Service Level Fee:</span>
                    <span>$${(order.serviceFee || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
                    <span>Logistics Fee:</span>
                    <span>$${(order.logisticsFee || 0).toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-weight:bold; color:#2563eb; margin-top:10px; font-size:16px;">
                    <span>Total Price:</span>
                    <span>$${(order.totalPrice || 0).toFixed(2)}</span>
                </div>
            </div>


            ${routesHtml}

            <p style="margin-top:15px;"><b>Status:</b> <span class="status ${order.status.toLowerCase()}">${order.status}</span></p>

            <button onclick="this.closest('.modal').remove()" style="width:100%; margin-top:20px; padding:12px; border-radius:8px; border:none; background:#f1f5f9; color:#475569; font-weight:600; cursor:pointer;">Close</button>
        </div>
    `;

    modal.onclick = (e) => {
        if (e.target.classList.contains("modal")) modal.remove();
    };

    document.body.appendChild(modal);
};