const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;

    if (user) {
        const usernameElement = document.getElementById("username");

        usernameElement.textContent =
            user.first_name ||
            user.username ||
            "کاربر تلگرام";

        const avatar = document.getElementById("avatar");

        if (user.first_name) {
            avatar.textContent =
                user.first_name.charAt(0).toUpperCase();
        }
    }
}


// نمایش لینک VPN

function showConnection() {

    const box =
        document.getElementById("connectionBox");

    box.classList.toggle("hidden");

}


// خرید پلن

function buyPlan(planName, price) {

    const message =
        `پلن ${planName} با قیمت ${price}$ انتخاب شد.`;

    if (tg) {

        tg.showPopup({
            title: "خرید سرویس",
            message: message,
            buttons: [
                {
                    type: "ok",
                    text: "تایید"
                }
            ]
        });

    } else {

        alert(message);

    }

}


// کپی لینک VPN

async function copyVPN() {

    const vpnLink =
        document
            .getElementById("vpnLink")
            .innerText;

    try {

        await navigator.clipboard.writeText(vpnLink);

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
            "Copy failed:",
            error
        );

    }

}