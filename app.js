const tg = window.Telegram?.WebApp;

// آدرس API
const API_URL = "http://YOUR_SERVER_IP:8000";

let currentUser = null;
let plans = [];
let services = [];
let orders = [];


// =====================================================
// Telegram
// =====================================================

function initTelegram() {
    if (!tg) {
        console.warn("Telegram WebApp is not available.");
        return;
    }

    tg.ready();
    tg.expand();
}


// =====================================================
// API
// =====================================================

async function apiRequest(endpoint, options = {}) {

    if (!tg?.initData) {
        throw new Error("Telegram authentication data not available.");
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `tma ${tg.initData}`,
                ...(options.headers || {})
            }
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Invalid API response.");
    }

    if (!response.ok) {
        throw new Error(
            data.detail || "خطا در ارتباط با سرور"
        );
    }

    return data;
}


// =====================================================
// User
// =====================================================

async function loadUser() {

    try {

        const data = await apiRequest("/api/me");

        currentUser = data.user;

        const usernameElement =
            document.getElementById("username");

        if (usernameElement) {
            usernameElement.textContent =
                currentUser.first_name ||
                currentUser.username ||
                "کاربر";
        }

        const balanceElement =
            document.getElementById("balance");

        if (balanceElement) {
            balanceElement.textContent =
                formatPrice(currentUser.balance);
        }

        const servicesElement =
            document.getElementById("servicesCount");

        if (servicesElement) {
            servicesElement.textContent =
                data.active_services;
        }

    } catch (error) {

        console.error("User loading error:", error);

        showError(error.message);
    }
}


// =====================================================
// Plans
// =====================================================

async function loadPlans(category = null) {

    try {

        const endpoint =
            category
                ? `/api/plans?category=${encodeURIComponent(category)}`
                : "/api/plans";

        const data =
            await apiRequest(endpoint);

        plans = data.plans;

        renderPlans();

    } catch (error) {

        console.error("Plans loading error:", error);

        showError(error.message);
    }
}


// =====================================================
// Render plans
// =====================================================

function renderPlans() {

    const container =
        document.getElementById("plans");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!plans.length) {

        container.innerHTML =
            `<div class="empty">
                پلن فعالی وجود ندارد.
            </div>`;

        return;
    }

    plans.forEach(plan => {

        const card =
            document.createElement("div");

        card.className = "plan-card";

        const dataText =
            Number(plan.data_gb) === 0
                ? "نامحدود"
                : `${plan.data_gb} گیگ`;

        card.innerHTML = `
            <div class="plan-title">
                ${escapeHTML(plan.name)}
            </div>

            <div class="plan-info">
                حجم: ${escapeHTML(dataText)}
            </div>

            <div class="plan-info">
                مدت: ${plan.days} روز
            </div>

            <div class="plan-price">
                ${formatPrice(plan.price)} تومان
            </div>

            <button
                class="buy-button"
                onclick="buyPlan(${plan.id})">
                خرید
            </button>
        `;

        container.appendChild(card);
    });
}


// =====================================================
// Buy
// =====================================================

async function buyPlan(planId) {

    const plan =
        plans.find(
            item => Number(item.id) === Number(planId)
        );

    if (!plan) {

        showError("پلن پیدا نشد.");

        return;
    }

    const message =
        `پلن ${plan.name}\n` +
        `قیمت: ${formatPrice(plan.price)} تومان`;

    if (tg) {

        tg.showPopup(
            {
                title: "خرید سرویس",
                message: message,
                buttons: [
                    {
                        id: "confirm",
                        type: "default",
                        text: "ادامه خرید"
                    },
                    {
                        id: "cancel",
                        type: "cancel",
                        text: "انصراف"
                    }
                ]
            },
            async function(buttonId) {

                if (buttonId === "confirm") {
                    await startOrder(plan);
                }

            }
        );

    } else {

        const confirmed =
            confirm(message + "\n\nادامه خرید؟");

        if (confirmed) {
            await startOrder(plan);
        }
    }
}


// =====================================================
// Start order
// =====================================================

async function startOrder(plan) {

    /*
     * این قسمت فعلاً سفارش را در دیتابیس ایجاد نمی‌کند.
     *
     * دلیل:
     * API فعلی فقط endpointهای خواندن اطلاعات را دارد.
     * خرید واقعی باید همان منطق پرداخت bot.py را اجرا کند
     * تا پرداخت و ساخت سرویس دور زده نشود.
     */

    showError(
        "سیستم خرید واقعی هنوز در API فعال نشده است."
    );
}


// =====================================================
// Services
// =====================================================

async function loadServices() {

    try {

        const data =
            await apiRequest("/api/services");

        services =
            data.services;

        renderServices();

    } catch (error) {

        console.error(
            "Services loading error:",
            error
        );

        showError(error.message);
    }
}


function renderServices() {

    const container =
        document.getElementById("services");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!services.length) {

        container.innerHTML =
            `<div class="empty">
                هنوز سرویسی ندارید.
            </div>`;

        return;
    }

    services.forEach(service => {

        const card =
            document.createElement("div");

        card.className = "service-card";

        card.innerHTML = `
            <div>
                <strong>
                    ${escapeHTML(service.username)}
                </strong>
            </div>

            <button
                onclick="copyVPN('${escapeAttribute(service.subscription_url)}')">
                کپی لینک
            </button>
        `;

        container.appendChild(card);
    });
}


// =====================================================
// Orders
// =====================================================

async function loadOrders() {

    try {

        const data =
            await apiRequest("/api/orders");

        orders =
            data.orders;

        renderOrders();

    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );

        showError(error.message);
    }
}


function renderOrders() {

    const container =
        document.getElementById("orders");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!orders.length) {

        container.innerHTML =
            `<div class="empty">
                سفارشی وجود ندارد.
            </div>`;

        return;
    }

    orders.forEach(order => {

        const item =
            document.createElement("div");

        item.className = "order-item";

        item.innerHTML = `
            <strong>
                ${escapeHTML(order.plan_name)}
            </strong>

            <div>
                مبلغ:
                ${formatPrice(order.price)}
                تومان
            </div>

            <div>
                وضعیت:
                ${escapeHTML(order.status)}
            </div>

            <div>
                ${escapeHTML(order.created_at || "")}
            </div>
        `;

        container.appendChild(item);
    });
}


// =====================================================
// Copy VPN
// =====================================================

async function copyVPN(link) {

    if (!link) {

        showError(
            "لینک سرویس موجود نیست."
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(link);

        if (tg) {

            tg.showAlert(
                "لینک اتصال کپی شد."
            );

        } else {

            alert(
                "لینک اتصال کپی شد."
            );
        }

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );

        showError(
            "کپی لینک انجام نشد."
        );
    }
}


// =====================================================
// Navigation
// =====================================================

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.add("hidden");

        });

    const page =
        document.getElementById(pageName);

    if (page) {
        page.classList.remove("hidden");
    }

    if (pageName === "home") {
        loadUser();
    }

    if (pageName === "services") {
        loadServices();
    }

    if (pageName === "orders") {
        loadOrders();
    }

    if (pageName === "plans") {
        loadPlans();
    }
}


// =====================================================
// Helpers
// =====================================================

function formatPrice(value) {

    return Number(value || 0)
        .toLocaleString("fa-IR");
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

    return String(value || "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}


// =====================================================
// Error
// =====================================================

function showError(message) {

    console.error(message);

    if (tg) {

        tg.showAlert(
            message || "خطایی رخ داد."
        );

    } else {

        alert(
            message || "خطایی رخ داد."
        );
    }
}


// =====================================================
// Start
// =====================================================

async function initApp() {

    initTelegram();

    await loadUser();

    await loadPlans();

    await loadServices();

    await loadOrders();
}


document.addEventListener(
    "DOMContentLoaded",
    initApp
);
