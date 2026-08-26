const tg = window.Telegram?.WebApp;

const API_URL = "http://213.176.121.102:8000";

let currentUser = null;
let currentServices = [];
let currentPlans = [];
let currentOrders = [];


// =====================================================
// TELEGRAM
// =====================================================

const isTelegram =
    !!(
        tg &&
        tg.initData &&
        tg.initData.length > 0
    );


if (tg) {
    tg.ready();
    tg.expand();
}


// =====================================================
// API
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    if (!isTelegram) {
        throw new Error(
            "Mini App را از داخل Telegram باز کنید."
        );
    }

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    headers["Authorization"] =
        `tma ${tg.initData}`;


    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    let data;

    try {
        data = await response.json();
    }

    catch {
        throw new Error(
            "پاسخ نامعتبر از سرور"
        );
    }


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "خطا در ارتباط با سرور"
        );
    }


    return data;
}


// =====================================================
// USER
// =====================================================

async function loadUser() {

    try {

        const data =
            await apiRequest("/api/me");


        currentUser =
            data.user;


        const username =
            document.getElementById(
                "username"
            );


        if (username) {

            username.textContent =
                currentUser.first_name ||
                currentUser.username ||
                "کاربر تلگرام";
        }


        const avatar =
            document.getElementById(
                "avatar"
            );


        if (
            avatar &&
            currentUser.first_name
        ) {

            avatar.textContent =
                currentUser.first_name
                    .charAt(0)
                    .toUpperCase();
        }


        setText(
            "balance",
            formatPrice(
                currentUser.balance
            )
        );


        setText(
            "accountBalance",
            formatPrice(
                currentUser.balance
            )
        );


        setText(
            "accountName",
            currentUser.first_name ||
            currentUser.username ||
            "کاربر تلگرام"
        );


        setText(
            "activeServices",
            data.active_services
        );


        setText(
            "accountServices",
            data.active_services
        );


    }

    catch (error) {

        console.error(
            "USER ERROR:",
            error
        );
    }
}


// =====================================================
// PLANS
// =====================================================

async function loadPlans() {

    try {

        const data =
            await apiRequest(
                "/api/plans"
            );


        currentPlans =
            data.plans || [];


        renderPlans();


    }

    catch (error) {

        console.error(
            "PLANS ERROR:",
            error
        );


        const container =
            document.getElementById(
                "plans"
            );


        if (container) {

            container.innerHTML = `
                <div class="plan">
                    <h3>خطا در دریافت پلن‌ها</h3>
                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>
                </div>
            `;
        }
    }
}


// =====================================================
// RENDER PLANS
// =====================================================

function renderPlans() {

    const container =
        document.getElementById(
            "plans"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!currentPlans.length) {

        container.innerHTML = `
            <div class="plan">
                <h3>
                    پلن فعالی وجود ندارد
                </h3>
            </div>
        `;

        return;
    }


    currentPlans.forEach(
        (plan, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                index === 1
                    ? "plan popular"
                    : "plan";


            const badge =
                index === 1
                    ? `<div class="badge">
                         پیشنهادی
                       </div>`
                    : "";


            card.innerHTML = `

                ${badge}

                <h3>
                    ${escapeHTML(
                        plan.name
                    )}
                </h3>

                <div class="plan-info">

                    <span>
                        ${plan.days} روز
                    </span>

                    <span>
                        ${
                            Number(
                                plan.data_gb
                            ) > 0
                                ? plan.data_gb +
                                  " GB"
                                : "نامحدود"
                        }
                    </span>

                </div>

                <h2>
                    ${formatPrice(
                        plan.price
                    )}
                </h2>

                <button>
                    خرید
                </button>
            `;


            const button =
                card.querySelector(
                    "button"
                );


            button.onclick =
                () => buyPlan(plan);


            container.appendChild(
                card
            );

        }
    );
}


// =====================================================
// BUY
// =====================================================

function buyPlan(plan) {

    const name =
        plan.name || "پلن";


    const price =
        formatPrice(plan.price);


    const confirmed =
        window.confirm(
            `پلن ${name}\n` +
            `قیمت: ${price}\n\n` +
            `ادامه خرید؟`
        );


    if (!confirmed) {
        return;
    }


    createOrder(plan);
}


// =====================================================
// CREATE ORDER
// =====================================================

async function createOrder(plan) {

    try {

        const data =
            await apiRequest(
                "/api/orders",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            plan_id: plan.id
                        })
                }
            );


        if (data.payment_url) {

            window.location.href =
                data.payment_url;

            return;
        }


        if (data.url) {

            window.location.href =
                data.url;

            return;
        }


        showMessage(
            data.message ||
            "سفارش ثبت شد."
        );


        await loadUser();
        await loadServices();
        await loadOrders();

    }

    catch (error) {

        console.error(
            "ORDER ERROR:",
            error
        );


        showMessage(
            error.message
        );
    }
}


// =====================================================
// SERVICES
// =====================================================

async function loadServices() {

    try {

        const data =
            await apiRequest(
                "/api/services"
            );


        currentServices =
            data.services || [];


        renderServices();


        updateConnection();


        setText(
            "activeServices",
            currentServices.length
        );


        setText(
            "accountServices",
            currentServices.length
        );


    }

    catch (error) {

        console.error(
            "SERVICES ERROR:",
            error
        );
    }
}


// =====================================================
// RENDER SERVICES
// =====================================================

function renderServices() {

    const container =
        document.getElementById(
            "servicesList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!currentServices.length) {

        container.innerHTML = `
            <div class="plan">
                <h3>
                    سرویس فعالی ندارید
                </h3>
            </div>
        `;


        setText(
            "serviceStatus",
            "غیرفعال"
        );


        return;
    }


    setText(
        "serviceStatus",
        "فعال"
    );


    currentServices.forEach(
        (service) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "plan";


            card.innerHTML = `

                <h3>
                    سرویس فعال
                </h3>

                <div class="plan-info">

                    <span>
                        ${escapeHTML(
                            service.username ||
                            "-"
                        )}
                    </span>

                </div>

                <button>
                    کپی لینک اتصال
                </button>
            `;


            const button =
                card.querySelector(
                    "button"
                );


            button.onclick =
                () => {

                    copyText(
                        service.subscription_url
                    );
                };


            container.appendChild(
                card
            );

        }
    );
}


// =====================================================
// CONNECTION
// =====================================================

function showConnection() {

    const box =
        document.getElementById(
            "connectionBox"
        );


    if (!box) {
        return;
    }


    box.classList.toggle(
        "hidden"
    );


    updateConnection();
}


function updateConnection() {

    const element =
        document.getElementById(
            "vpnLink"
        );


    if (!element) {
        return;
    }


    if (!currentServices.length) {

        element.textContent =
            "سرویس فعالی وجود ندارد";

        return;
    }


    const service =
        currentServices[0];


    element.textContent =
        service.subscription_url ||
        "لینک اتصال موجود نیست";
}


// =====================================================
// COPY VPN
// =====================================================

async function copyVPN() {

    if (!currentServices.length) {

        showMessage(
            "سرویس فعالی ندارید."
        );

        return;
    }


    const link =
        currentServices[0]
            .subscription_url;


    if (!link) {

        showMessage(
            "لینک اتصال موجود نیست."
        );

        return;
    }


    await copyText(link);
}


// =====================================================
// COPY
// =====================================================

async function copyText(text) {

    if (!text) {

        showMessage(
            "لینکی وجود ندارد."
        );

        return;
    }


    try {

        await navigator.clipboard
            .writeText(text);


        showMessage(
            "لینک کپی شد."
        );

    }

    catch {

        showMessage(
            "کپی لینک انجام نشد."
        );
    }
}


// =====================================================
// ORDERS
// =====================================================

async function loadOrders() {

    try {

        const data =
            await apiRequest(
                "/api/orders"
            );


        currentOrders =
            data.orders || [];


        renderOrders();

    }

    catch (error) {

        console.error(
            "ORDERS ERROR:",
            error
        );
    }
}


// =====================================================
// RENDER ORDERS
// =====================================================

function renderOrders() {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!currentOrders.length) {

        container.innerHTML = `
            <div class="plan">
                <h3>
                    سفارشی ثبت نشده است
                </h3>
            </div>
        `;

        return;
    }


    currentOrders.forEach(
        order => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "plan";


            card.innerHTML = `

                <h3>
                    ${escapeHTML(
                        order.plan_name ||
                        "سفارش"
                    )}
                </h3>

                <div class="plan-info">

                    <span>
                        ${formatPrice(
                            order.price
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            order.status ||
                            "-"
                        )}
                    </span>

                </div>

            `;


            container.appendChild(
                card
            );
        }
    );
}


// =====================================================
// NAVIGATION
// =====================================================

async function showPage(page) {

    const home =
        document.getElementById(
            "homePage"
        );

    const services =
        document.getElementById(
            "servicesPage"
        );

    const account =
        document.getElementById(
            "accountPage"
        );


    home.classList.add(
        "hidden"
    );

    services.classList.add(
        "hidden"
    );

    account.classList.add(
        "hidden"
    );


    removeActiveNav();


    if (page === "home") {

        home.classList.remove(
            "hidden"
        );

        setActiveNav(
            "navHome"
        );

        await loadUser();
        await loadPlans();
        await loadServices();

        return;
    }


    if (page === "services") {

        services.classList.remove(
            "hidden"
        );

        setActiveNav(
            "navServices"
        );

        await loadServices();

        return;
    }


    if (page === "account") {

        account.classList.remove(
            "hidden"
        );

        setActiveNav(
            "navAccount"
        );

        await loadUser();
        await loadOrders();

        return;
    }
}


// =====================================================
// NAV HELPERS
// =====================================================

function removeActiveNav() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active-nav"
                );
            }
        );
}


function setActiveNav(id) {

    const button =
        document.getElementById(id);


    if (button) {

        button.classList.add(
            "active-nav"
        );
    }
}


// =====================================================
// HELPERS
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "-";
    }
}


function formatPrice(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return String(
            value ?? "-"
        );
    }


    return number.toLocaleString(
        "fa-IR"
    );
}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );
}


function showMessage(message) {

    if (
        tg &&
        typeof tg.showAlert ===
        "function"
    ) {

        tg.showAlert(
            String(message)
        );

    } else {

        window.alert(
            String(message)
        );
    }
}


// =====================================================
// START
// =====================================================

async function initApp() {

    if (!isTelegram) {

        console.warn(
            "Mini App باید از داخل Telegram اجرا شود."
        );

        return;
    }


    await loadUser();

    await loadPlans();

    await loadServices();

    await loadOrders();
}


document.addEventListener(
    "DOMContentLoaded",
    initApp
);
