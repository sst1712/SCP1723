const tabs = document.querySelectorAll(".tab");
const clientFields = document.getElementById("clientFields");
const supplierFields = document.getElementById("supplierFields");
const countryText = document.getElementById("selectedCountry");
const countrySelect = document.getElementById("country");
const form = document.querySelector("form");

let selectedType = "client";
let alertTimeout;
let isSubmitting = false;
tabs.forEach(tab => {
    tab.addEventListener("click", () => {

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        selectedType = tab.dataset.tab;

        if (selectedType === "client") {
            clientFields.classList.add("active");
            supplierFields.classList.remove("active");
        } else {
            supplierFields.classList.add("active");
            clientFields.classList.remove("active");
        }
    });
});
countrySelect.addEventListener("change", () => {
    countryText.textContent = countrySelect.value;
});
function showAlert(message) {
    const alertBox = document.getElementById("customAlert");
    const alertMsg = document.getElementById("alertMessage");

    alertMsg.textContent = message;

    alertBox.classList.remove("show");
    clearTimeout(alertTimeout);

    setTimeout(() => {
        alertBox.classList.add("show");
    }, 50);

    alertTimeout = setTimeout(() => {
        alertBox.classList.remove("show");
    }, 2500);
}
document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
        input.style.border = "1px solid #ccc";
    });
});
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let valid = true;

    const activeFields = document.querySelector(".form-fields.active");
    const inputs = activeFields.querySelectorAll("input");

    inputs.forEach(input => {
        if (input.value.trim() === "") {
            input.style.border = "2px solid red";
            valid = false;
        }
    });

    if (!valid) {
        showAlert("⚠️ Please fill all required fields!");
        return;
    }

    if (isSubmitting) return;
    isSubmitting = true;

    // Call the appropriate API function to save data
    if (selectedType === "client") {
        await clientBtn();
    } else {
        await supplierBtn();
    }

    // Redirect after saving
setTimeout(() => {
    if (selectedType === "client") {
        const name = document.getElementById("clientName").value;

        // 🔥 SAVE NAME BEFORE REDIRECT
        localStorage.setItem("clientName", name);

        window.location.href = "client.html";
    } else {
        window.location.href = "supplier.html";
    }
}, 500); // Increased timeout so the success message can be seen
});

const API_URL = "https://scp1723.onrender.com"; 

async function clientBtn() {
    const name = document.getElementById("clientName").value;
    const location = document.getElementById("clientLocation").value;
    const email = document.getElementById("clientEmail").value;
    const license = document.getElementById("clientLicense").value;
    const country = document.getElementById("country").value;

    const pattern1 = /^(?=(?:.*\d){2,})[A-Z\d]{8}$/;
    const locationPattern = /^[A-Za-z\s,]+$/;
    const namePattern = /^[A-Za-z][A-Za-z\s]*$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern1.test(license)) {
        showAlert("⚠️ Invalid License Number! Example: AB12CD34");
        return;
    }

    if (!locationPattern.test(location)) {
        showAlert("⚠️ Invalid Location! Example: Hyderabad, India");
        return;
    }

    if (!namePattern.test(name)) {
        showAlert("⚠️ Invalid Name! Example: Ravi Kumar");
        return;
    }

    if (!emailPattern.test(email)) {
        showAlert("⚠️ Invalid Email! Example: test@gmail.com");
        return;
    }
    try {
        const res = await fetch(`${API_URL}/client`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                location,
                email,
                license,
                country
            })
        });

        const result = await res.json();

        localStorage.setItem("clientName", name);
        localStorage.setItem("userName", name);
        localStorage.setItem("activeRole", "client"); // 🔥 Set active role

        showAlert(result.message);

    } catch (err) {
        showAlert("Error registering client");
    }
}

// SUPPLIER BUTTON
async function supplierBtn() {
        const name = document.getElementById("supplierName").value
        const location = document.getElementById("supplierLocation").value
        const email = document.getElementById("supplierEmail").value
        const contact = document.getElementById("contact").value
        const license = document.getElementById("supplierLicense").value
        const country = document.getElementById("country").value

    try {
        const res = await fetch(`${API_URL}/supplier`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name:name,
                location:location,
                email:email,
                contact:contact,
                license:license,
                country:country
            })
        });

        const result = await res.json();
        
        // 🔥 SAVE SUPPLIER NAME
        localStorage.setItem("supplierName", name);
        localStorage.setItem("userName", name);
        localStorage.setItem("activeRole", "supplier"); // 🔥 Set active role
        
        showAlert(result.message);

    } catch (err) {
        showAlert("Error registering supplier");
    } finally {
        isSubmitting = false;
    }
}

// ALERT FUNCTION
function showAlert(msg) {
    const alertBox = document.getElementById("customAlert");
    const alertMessage = document.getElementById("alertMessage");

    alertMessage.innerText = msg;
    alertBox.style.display = "block";

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
