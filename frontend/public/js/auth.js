
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

async function submitAuthForm(event, endpoint) {
    event.preventDefault();

    const form = event.currentTarget;
    const message = document.getElementById(
        form.id === "loginForm" ? "loginMessage" : "registerMessage"
    );
    const button = form.querySelector('button[type="submit"]');

    message.textContent = "";
    button.disabled = true;

    try {
        const formData = Object.fromEntries(new FormData(form));

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }

        message.style.color = "#087f8c";
        message.textContent = data.message || "Request successful.";

        if (endpoint === "/api/auth/login") {
            if (!data.token) {
                throw new Error("Login succeeded but no token was received.");
            }

            sessionStorage.setItem("authToken", data.token);
            sessionStorage.setItem("currentUser", JSON.stringify(data.user));

            window.location.href = "/dashboard.html";
        } else {
            // Registration succeeded; go to login.
            window.location.href = "/login.html";
        }
    } catch (error) {
        message.style.color = "#b42318";
        message.textContent =
            error.message === "Failed to fetch"
                ? "Cannot connect to the server. Check that Express is running."
                : error.message;
    } finally {
        button.disabled = false;
    }
}

if (loginForm) {
    loginForm.addEventListener("submit", (event) =>
        submitAuthForm(event, "/api/auth/login")
    );
}

if (registerForm) {
    registerForm.addEventListener("submit", (event) =>
        submitAuthForm(event, "/api/auth/register")
    );
}
