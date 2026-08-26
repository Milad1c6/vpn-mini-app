const tg = window.Telegram?.WebApp;

const API_URL = "http://213.176.121.102:8000";

const isTelegram =
    !!(tg && tg.initData && tg.initData.length > 0);


// ===============================
// Telegram
// ===============================

if (tg) {
    tg.ready();
    tg.expand();
}


// ===============================
// API
// ===============================

async function apiRequest(endpoint, options = {}) {

    if (!isTelegram) {
        throw new Error(
            "Mini App را از داخل Telegram باز کنید."
        );
    }

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    headers["Authorization"] = `tma ${tg.initData}`;

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "خطا در ارتباط با سرور"
        );
    }

    return data;
}


// ===============================
// User
// ===============================

async function loadUser() {

    try {

        const data =
            await apiRequest("/api/me");

        const user =
            data.user || data;

        const username =
            document.getElementById("username");

        if (username) {
            username.textContent =
                user.first_name ||
                user.username ||
                "کاربر تلگرام";
        }

        const avatar =
            document.getElementById("avatar");

        if (avatar && user.first_name) {
            avatar.textContent =
                user.first_name.charAt(0).toUpperCase();
        }

        updateAccountInfo(user);

    } catch (error) {

        console.error(
            "User loading error:",
            error
        );
    }
}


// ===============================
// Plans
// ===============================

async function loadPlans() {

    try {

        const data =
            await apiRequest("/api/plans");

        const plans =
            Array.isArray(data)
                ? data
                : (data.plans || []);

        renderPlans(plans);

    } catch (error) {

        console.error(
            "Plans loading error:",
            error
        );

        const container =
            document.getElementById("plans");

        if (container) {
            container.innerHTML = `
                <div class="plan">
                    <h3>خطا در دریافت پلن‌ها</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;
        }
    }
}


// ===============================
// Render Plans
// ===============================

function renderPlans(plans) {

    const container =
        document.getElementById("plans");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!plans.length) {

        container.innerHTML = `
            <div class="plan">
                <h3>پلنی موجود نیست</h3>
            </div>
        `;

        return;
    }

    plans.forEach((plan, index) => {

        const name =
            plan.name ||
            plan.title ||
            "پلن";

        const price =
            plan.price ?? 0;

        const days =
            plan.days ??
            plan.duration_days ??
            "-";

        const dataGB =
            plan.data_gb ??
            plan.volume_gb ??
            plan.volume ??
            "نامحدود";

        const card =
            document.createElement("div");

        card.className =
            index === 1
                ? "plan popular"
                : "plan";

        card.innerHTML = `

            ${
                index === 1
                    ? `<div class="badge">پیشنهادی</div>`
                    : ""
            }

            <h3>
                ${escapeHTML(name)}
            </h3>

            <div class="plan-info">
                <span>
                    ${escapeHTML(String(days))} روز
                </span>

                <span>
                    ${escapeHTML(String(dataGB))}
                </span>
            </div>

            <h2>
                ${formatPrice(price)}
            </h2>

            <button>
                خرید
            </button>
        `;

        const button =
            card.querySelector("button");

        button.addEventListener(
            "click",
            () => buyPlan(plan)
        );

        container.appendChild(card);
    });
}


// ===============================
// Buy
// ===============================

function buyPlan(plan) {

    const name =
        plan.name ||
        plan.title ||
        "پلن";

    const price =
        plan.price ?? 0;

    const message =
        `پلن ${name}\n` +
        `قیمت: ${formatPrice(price)}`;

    // showPopup را استفاده نمی‌کنیم
    // چون نسخه Telegram WebApp فعلی آن را پشتیبانی نمی‌کند.

    if (confirm(`${message}\n\nادامه خرید؟`)) {

        createOrder(plan);

    }
}


// ===============================
// Create Order
// ===============================

async function createOrder(plan) {

    try {

        /*
         * Endpoint خرید باید در server.py وجود داشته باشد.
         * اگر وجود نداشته باشد، این قسمت خطای 404 می‌دهد
         * و bot.py هنوز تغییری نمی‌کند.
         */

        const data =
            await apiRequest(
                "/api/orders",
                {
                    method: "POST",
                    body: JSON.stringify({
                        plan_id: plan.id
                    })
                }
            );

        if (data.payment_url) {

            window.open(
                data.payment_url,
                "_blank"
            );

            return;
        }

        if (data.url) {

            window.open(
                data.url,
                "_blank"
            );

            return;
        }

        showMessage(
            "سفارش با موفقیت ایجاد شد."
        );

    } catch (error) {

        console.error(
            "Order error:",
            error
        );

        showMessage(
            error.message
        );
    }
}


// ===============================
// Services
// ===============================

async function loadServices() {

    try {

        const data =
            await apiRequest(
                "/api/services"
            );

        const services =
            Array.isArray(data)
                ? data
                : (data.services || []);

        renderServices(services);

        if (services.length > 0) {

            const service =
                services[0];

            const vpnLink =
                service.subscription_url ||
                service.vpn_link ||
                service.link;

            if (vpnLink) {
                setVPNLink(vpnLink);
            }

            const volume =
                document.querySelector(
                    ".info-grid div:nth-child(1) strong"
                );

            if (volume) {
                volume.textContent =
                    service.data_remaining ??
                    service.remaining_gb ??
                    "-";
            }

            const days =
                document.querySelector(
                    ".info-grid div:nth-child(2) strong"
                );

            if (days) {
                days.textContent =
                    service.days_remaining ??
                    "-";
            }
        }

    } catch (error) {

        console.error(
            "Services loading error:",
            error
        );
    }
}


function renderServices(services) {

    if (!services.length) {
        return;
    }

    const service =
        services[0];

    const vpnLink =
        service.subscription_url ||
        service.vpn_link ||
        service.link;

    if (vpnLink) {
        setVPNLink(vpnLink);
    }
}


// ===============================
// Connection
// ===============================

function showConnection() {

    const box =
        document.getElementById(
            "connectionBox"
        );

    if (!box) {
        return;
    }

    box.classList.toggle("hidden");

    loadServices();
}


// ===============================
// Set VPN link
// ===============================

function setVPNLink(link) {

    const element =
        document.getElementById(
            "vpnLink"
        );

    if (!element) {
        return;
    }

    element.textContent = link;
}


// ===============================
// Copy VPN
// ===============================

async function copyVPN() {

    const element =
        document.getElementById(
            "vpnLink"
        );

    if (!element) {
        return;
    }

    const vpnLink =
        element.innerText.trim();

    if (!vpnLink ||
        vpnLink.includes("example-vpn-config")) {

        showMessage(
            "هنوز سرویس فعالی برای شما وجود ندارد."
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(
            vpnLink
        );

        showMessage(
            "لینک اتصال کپی شد."
        );

    } catch (error) {

        console.error(
            "Copy failed:",
            error
        );

        showMessage(
            "کپی لینک انجام نشد."
        );
    }
}


// ===============================
// Account
// ===============================

function updateAccountInfo(user) {

    const balance =
        document.getElementById(
            "balance"
        );

    if (balance &&
        user.balance !== undefined) {

        balance.textContent =
            formatPrice(user.balance);
    }
}


// ===============================
// Helpers
// ===============================

function formatPrice(value) {

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return String(value ?? "-");
    }

    return number.toLocaleString(
        "fa-IR"
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showMessage(message) {

    if (
        tg &&
        typeof tg.showAlert === "function"
    ) {

        tg.showAlert(
            String(message)
        );

    } else {

        alert(
            String(message)
        );
    }
}


// ===============================
// Start
// ===============================

async function initApp() {

    if (!isTelegram) {

        console.warn(
            "Mini App خارج از Telegram باز شده است."
        );

        return;
    }

    await loadUser();

    await loadPlans();

    await loadServices();
}


document.addEventListener(
    "DOMContentLoaded",
    initApp
);
