
const historyMessage = document.getElementById("historyMessage");
const historyList = document.getElementById("historyList");
const assessmentCount = document.getElementById("assessmentCount");
const clearHistoryButton = document.getElementById("clearHistoryButton");

function getToken() {
    return sessionStorage.getItem("authToken");
}

function redirectToLogin() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUser");
    window.location.replace("/login.html");
}

async function apiRequest(url, options = {}) {
    const token = getToken();

    if (!token) {
        redirectToLogin();
        throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        throw new Error("Your session has expired. Please log in again.");
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "The request failed.");
    }

    return data;
}

function createAssessmentCard(item) {
    const card = document.createElement("article");
    card.className = "history-item";

    const title = document.createElement("h2");
    title.textContent = item.riskLabel || "Assessment result";

    const date = document.createElement("p");
    date.textContent = item.createdAt
        ? `Date: ${new Date(item.createdAt).toLocaleString()}`
        : "Date unavailable";

    const details = document.createElement("ul");

    const fields = [
        ["Age", item.age],
        ["Gender", item.gender],
        ["BMI", item.bmi],
        ["Hypertension", item.hypertension ? "Yes" : "No"],
        ["Heart disease", item.heartDisease ? "Yes" : "No"],
        ["Smoking history", item.smokingHistory],
        ["HbA1c level", item.HbA1cLevel],
        ["Blood glucose level", item.bloodGlucoseLevel]
    ];

    fields.forEach(([label, value]) => {
        const row = document.createElement("li");
        row.textContent = `${label}: ${value ?? "Not available"}`;
        details.appendChild(row);
    });

    const actions = document.createElement("div");
    actions.className = "assessment-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-assessment-button";
    deleteButton.textContent = "Delete Assessment";

    deleteButton.addEventListener("click", async () => {
        const confirmed = window.confirm(
            "Delete this assessment permanently? This action cannot be undone."
        );

        if (!confirmed) return;

        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting...";

        try {
            await apiRequest(
                `/api/assessments/${encodeURIComponent(item._id)}`,
                { method: "DELETE" }
            );

            card.remove();
            historyMessage.textContent = "Assessment deleted successfully.";

            const remaining = historyList.querySelectorAll(".history-item").length;
            assessmentCount.textContent = `${remaining} saved assessment(s)`;

            if (remaining === 0) {
                historyMessage.textContent =
                    "You have not completed any assessments yet.";
                clearHistoryButton.hidden = true;
            }
        } catch (error) {
            historyMessage.textContent = error.message;
            deleteButton.disabled = false;
            deleteButton.textContent = "Delete Assessment";
        }
    });

    actions.appendChild(deleteButton);
    card.append(title, date, details, actions);

    return card;
}

async function loadHistory() {
    historyMessage.textContent = "Loading assessment history...";
    assessmentCount.textContent = "Loading...";
    clearHistoryButton.hidden = true;

    try {
        const data = await apiRequest("/api/assessments");
        const assessments = data.assessments || [];

        historyList.replaceChildren();
        assessmentCount.textContent = `${assessments.length} saved assessment(s)`;

        if (assessments.length === 0) {
            historyMessage.textContent =
                "You have not completed any assessments yet.";
            return;
        }

        historyMessage.textContent = "";

        assessments.forEach((item) => {
            historyList.appendChild(createAssessmentCard(item));
        });

        clearHistoryButton.hidden = false;
    } catch (error) {
        console.error("History loading error:", error);

        if (getToken()) {
            historyMessage.textContent =
                `Unable to load assessment history: ${error.message}`;
        }
    }
}

clearHistoryButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
        "Are you sure you want to delete ALL your saved assessments? This cannot be undone."
    );

    if (!confirmed) return;

    clearHistoryButton.disabled = true;
    clearHistoryButton.textContent = "Clearing...";

    try {
        const data = await apiRequest("/api/assessments", {
            method: "DELETE"
        });

        historyList.replaceChildren();
        assessmentCount.textContent = "0 saved assessments";
        historyMessage.textContent =
            data.message || "Assessment history cleared successfully.";
        clearHistoryButton.hidden = true;
    } catch (error) {
        historyMessage.textContent = error.message;
    } finally {
        clearHistoryButton.disabled = false;
        clearHistoryButton.textContent = "Clear All History";
    }
});

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("currentUser");
        window.location.replace("/login.html");
    });
}

loadHistory();
