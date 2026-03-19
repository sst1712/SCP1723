const TUTORIAL_CSS = `
.tutorial-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
}

.tutorial-card {
    background: white;
    color: #1e293b;
    width: 90%;
    max-width: 450px;
    padding: 30px;
    border-radius: 20px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    text-align: center;
    position: relative;
    animation: slideUp 0.3s ease;
}

.tutorial-step-indicator {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.tutorial-image {
    font-size: 50px;
    margin-bottom: 20px;
}

.tutorial-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 15px;
}

.tutorial-text {
    font-size: 15px;
    line-height: 1.6;
    color: #475569;
    margin-bottom: 25px;
}

.tutorial-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
}

.tutorial-btn:hover {
    background: #1d4ed8;
}

.tutorial-close {
    position: absolute;
    top: 15px;
    right: 20px;
    font-size: 20px;
    color: #94a3b8;
    cursor: pointer;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.help-trigger {
    position: fixed;
    bottom: 30px;
    left: 30px;
    width: 50px;
    height: 50px;
    background: #2563eb;
    color: white;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(37, 99, 235, 0.4);
    z-index: 9998;
    transition: 0.2s;
}

.help-trigger:hover {
    transform: scale(1.1);
}
`;

const CLIENT_STEPS = [
    {
        icon: "☰",
        title: "Smart Navigation",
        text: "Use the 3-line button (hamburger menu) in the top left to show or hide your sidebar for more space!"
    },
    {
        icon: "🔍",
        title: "Find Best Deals",
        text: "Search for specific goods like Coal or Iron. We'll show you the best prices from verified suppliers."
    },
    {
        icon: "⚡",
        title: "Flexible Shipping",
        text: "Choose between Standard, Express, or Premium Overnight shipping to fit your timeline and budget."
    },
    {
        icon: "⚖️",
        title: "Smart Savings",
        text: "Save more with Volume Discounts! Order over 150 Tons for a 5% instant discount."
    }
];

const SUPPLIER_STEPS = [
    {
        icon: "☰",
        title: "Expand Your View",
        text: "Click the sidebar toggle in the top left to expand your dashboard and focus on your business data."
    },
    {
        icon: "📦",
        title: "Manage Goods",
        text: "Add your inventory, set prices, and specify heavy-duty vehicle capacities."
    },
    {
        icon: "🗺️",
        title: "Route Planning",
        text: "Map out your delivery path with up to 10 port pairs (From ➡️ To) to keep clients informed."
    }
];


window.initTutorial = function(role) {
    // Inject CSS
    const style = document.createElement("style");
    style.innerHTML = TUTORIAL_CSS;
    document.head.appendChild(style);

    // Create Help Button
    const helpBtn = document.createElement("div");
    helpBtn.className = "help-trigger";
    helpBtn.innerHTML = "?";
    helpBtn.title = "Open Tutorial";
    helpBtn.onclick = () => showTutorial(0);
    document.body.appendChild(helpBtn);

    // Create Overlay
    const overlay = document.createElement("div");
    overlay.className = "tutorial-overlay";
    overlay.id = "tutorialOverlay";
    document.body.appendChild(overlay);

    const steps = role === 'client' ? CLIENT_STEPS : SUPPLIER_STEPS;
    let currentStep = 0;

    function showTutorial(index) {
        currentStep = index;
        const step = steps[index];
        overlay.style.display = "flex";
        
        overlay.innerHTML = `
            <div class="tutorial-card">
                <span class="tutorial-close" onclick="closeTutorial()">✕</span>
                <div class="tutorial-step-indicator">Step ${index + 1} of ${steps.length}</div>
                <div class="tutorial-image">${step.icon}</div>
                <div class="tutorial-title">${step.title}</div>
                <div class="tutorial-text">${step.text}</div>
                <button class="tutorial-btn" onclick="nextStep()">
                    ${index === steps.length - 1 ? 'Got it!' : 'Next'}
                </button>
            </div>
        `;
    }

    window.nextStep = function() {
        if (currentStep < steps.length - 1) {
            showTutorial(currentStep + 1);
        } else {
            closeTutorial();
        }
    };

    window.closeTutorial = function() {
        overlay.style.display = "none";
        localStorage.setItem(`tutorial_done_${role}`, "true");
    };

    // Auto-show for new users
    if (!localStorage.getItem(`tutorial_done_${role}`)) {
        setTimeout(() => showTutorial(0), 1000);
    }
};
