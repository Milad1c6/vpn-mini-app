const tg = window.Telegram?.WebApp;


// =====================================================
// API
// =====================================================

const API_URL =
    "http://213.176.121.102:8000";


// =====================================================
// TELEGRAM
// =====================================================

function telegramReady() {

    return !!(
        tg &&
        tg.initData &&
        tg.initData.length > 0
    );
}


if (tg) {
    tg.ready();
    tg.expand();
}


// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    if (!telegramReady()) {

        throw new Error(
            "Telegram authentication data not available."
        );
    }


    const headers = {
        "Accept":
            "application/json",

        ...(options.headers || {}),
    };


    headers["Authorization"] =
        "tma " + tg.initData;


    const response =
        await fetch(
            API_URL + endpoint,
            {
                ...options,
                headers,
            }
        );


    const text =
        await response.text();


    let data = null;


    try {
        data =
            JSON.parse(text);
    }

    catch {
        data = {
            detail:
                text ||
                "Invalid server response",
        };
    }


    if (!response.ok) {

        throw new Error(
            data.detail ||
            `HTTP ${response.status}`
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
            await apiRequest(
                "/api/me"
            );


        const user =
            data.user;


        const username =
            document.getElementById(
                "username"
            );


        if (username) {

            username.textContent =
                user.first_name ||
                user.username ||
                "کاربر تلگرام";
        }


        const avatar =
            document.getElementById(
                "avatar"
            );


        if (
            avatar &&
            user.first_name
        ) {

            avatar.textContent =
                user.first_name
                    .charAt(0)
                    .toUpperCase();
        }


        setText(
            "balance",
            formatPrice(
                user.balance
            )
        );


        setText(
            "accountBalance",
            formatPrice(
                user.balance
            )
        );


        setText(
            "accountName",
            user.first_name ||
            user.username ||
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
            "User loading error:",
            error
        );

        showError(
            error.message
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


        renderPlans(
            data.plans || []
        );


    }

    catch (error) {

        console.error(
            "Plans loading error:",
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
                    <p>${escapeHTML(
                        error.message
                    )}</p>
                </div>
            `;
        }
    }
}


// =====================================================
// RENDER PLANS
// =====================================================

function renderPlans(
    plans
) {

    const container =
        document.getElementById(
            "plans"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!plans.length) {

        container.innerHTML = `
            <div class="plan">
                <h3>
                    هیچ پلن فعالی وجود ندارد
                </h3>
            </div>
        `;

        return;
    }


    plans.forEach(
        (plan, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                index === 1
                    ? "plan popular"
                    : "plan";


            card.innerHTML = `

                ${
                    index === 1
                        ? `<div class="badge">
                               پیشنهادی
                           </div>`
                        : ""
                }

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
                            ) === 0
                                ? "نامحدود"
                                : `${plan.data_gb} GB`
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


            button.addEventListener(
                "click",
                function () {

                    buyPlan(plan);

                }
            );


            container.appendChild(
                card
            );
        }
    );
}


// =====================================================
// BUY
// =====================================================

function buyPlan(
    plan
) {

    const message =
        `پلن ${plan.name}\n` +
        `قیمت: ${formatPrice(plan.price)}\n\n` +
        `برای خرید از طریق ربات ادامه دهید.`;


    if (
        tg &&
        typeof tg.showAlert ===
        "function"
    ) {

        tg.showAlert(
            message
        );

    } else {

        alert(message);
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


        renderServices(
            data.services || []
        );


    }

    catch (error) {

        console.error(
            "Services loading error:",
            error
        );
    }
}


// =====================================================
// RENDER SERVICES
// =====================================================

function renderServices(
    services
) {

    const container =
        document.getElementById(
            "servicesList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!services.length) {

        container.innerHTML = `
            <div class="plan">
                <h3>
                    سرویس فعالی ندارید
                </h3>
            </div>
        `;

        return;
    }


    services.forEach(
        service => {

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
                            service.username
                        )}
                    </span>

                </div>

                <button>
                    کپی لینک اتصال
                </button>
            `;


            card.querySelector(
                "button"
            ).addEventListener(
                "click",
                () => {

                    copyText(
                        service.subscription_url
                    );

                }
            );


            container.appendChild(
                card
            );
        }
    );


    if (services.length > 0) {

        const first =
            services[0];


        const link =
            document.getElementById(
                "vpnLink"
            );


        if (link) {

            link.textContent =
                first.subscription_url ||
                "لینک موجود نیست";
        }
    }
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
}


// =====================================================
// COPY VPN
// =====================================================

async function copyVPN() {

    const element =
        document.getElementById(
            "vpnLink"
        );


    if (!element) {
        return;
    }


    const link =
        element.textContent.trim();


    if (
        !link ||
        link ===
        "سرویس فعالی وجود ندارد"
    ) {

        showError(
            "لینک سرویس وجود ندارد."
        );

        return;
    }


    await copyText(
        link
    );
}


// =====================================================
// COPY
// =====================================================

async function copyText(
    text
) {

    try {

        await navigator.clipboard
            .writeText(text);


        if (
            tg &&
            typeof tg.showAlert ===
            "function"
        ) {

            tg.showAlert(
                "لینک کپی شد."
            );

        } else {

            alert(
                "لینک کپی شد."
            );
        }

    }

    catch (error) {

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
// ORDERS
// =====================================================

async function loadOrders() {

    try {

        const data =
            await apiRequest(
                "/api/orders"
            );


        renderOrders(
            data.orders || []
        );


    }

    catch (error) {

        console.error(
            "Orders loading error:",
            error
        );
    }
}


// =====================================================
// RENDER ORDERS
// =====================================================

function renderOrders(
    orders
) {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!orders.length) {

        container.innerHTML = `
            <div class="plan">
                <h3>
                    سفارشی ثبت نشده است
                </h3>
            </div>
        `;

        return;
    }


    orders.forEach(
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
                        order.plan_name
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
                            order.status
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

async function showPage(
    page
) {

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


    home?.classList.add(
        "hidden"
    );

    services?.classList.add(
        "hidden"
    );

    account?.classList.add(
        "hidden"
    );


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active-nav"
                );

            }
        );


    if (page === "home") {

        home?.classList.remove(
            "hidden"
        );


        document
            .getElementById(
                "navHome"
            )
            ?.classList.add(
                "active-nav"
            );


        await loadUser();
        await loadPlans();
        await loadServices();

        return;
    }


    if (page === "services") {

        services?.classList.remove(
            "hidden"
        );


        document
            .getElementById(
                "navServices"
            )
            ?.classList.add(
                "active-nav"
            );


        await loadServices();

        return;
    }


    if (page === "account") {

        account?.classList.remove(
            "hidden"
        );


        document
            .getElementById(
                "navAccount"
            )
            ?.classList.add(
                "active-nav"
            );


        await loadUser();
        await loadOrders();

        return;
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
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "-";
    }
}


function formatPrice(
    value
) {

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


function escapeHTML(
    value
) {

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


function showError(
    message
) {

    console.error(
        message
    );


    if (
        tg &&
        typeof tg.showAlert ===
        "function"
    ) {

        tg.showAlert(
            String(message)
        );

    } else {

        console.error(
            String(message)
        );
    }
}


// =====================================================
// START
// =====================================================

async function initApp() {

    if (!telegramReady()) {

        console.error(
            "Telegram initData is missing."
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
