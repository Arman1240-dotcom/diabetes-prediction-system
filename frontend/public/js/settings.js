
const token = sessionStorage.getItem("authToken");

const message = document.getElementById("message");
const profileDetails = document.getElementById("profileDetails");

if (!token) {
    window.location.replace("/login.html");
} else {
    loadProfile();
}

async function loadProfile() {
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("currentUser");
            window.location.replace("/login.html");
            return;
        }

        document.getElementById("profileName").textContent = data.user.name;
        document.getElementById("profileEmail").textContent = data.user.email;

        document.getElementById("profileCreatedAt").textContent =
            new Date(data.user.createdAt).toLocaleDateString();

        profileDetails.hidden = false;
        message.textContent = "Profile loaded successfully.";
    } catch (error) {
        console.error("Profile loading error:", error);
        message.textContent = "Unable to load your profile. Check your connection and refresh.";
    }
}

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("currentUser");
        window.location.replace("/login.html");
    });
}


const deleteAccountForm = document.getElementById("deleteAccountForm");

if (deleteAccountForm) {
    deleteAccountForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const token = sessionStorage.getItem("authToken");
        const password = document.getElementById("deletePassword").value;
        const confirmed = document.getElementById("confirmAccountDeletion").checked;
        const button = document.getElementById("deleteAccountButton");
        const deleteMessage = document.getElementById("deleteAccountMessage");

        deleteMessage.textContent = "";

        if (!token) {
            window.location.replace("/login.html");
            return;
        }

        if (!confirmed) {
            deleteMessage.textContent =
                "Please confirm that you want to delete your account.";
            return;
        }

        const shouldDelete = window.confirm(
            "Are you sure? Your account and all saved assessments will be permanently deleted."
        );

        if (!shouldDelete) {
            return;
        }

        button.disabled = true;
        button.textContent = "Deleting account...";

        try {
            const response = await fetch("/api/auth/me", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Account deletion failed.");
            }

            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("currentUser");

            window.alert("Your account has been deleted.");
            window.location.replace("/");
        } catch (error) {
            deleteMessage.textContent =
                error.message === "Failed to fetch"
                    ? "Cannot connect to the server. Check that Express is running."
                    : error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Delete My Account";
        }
    });
}
