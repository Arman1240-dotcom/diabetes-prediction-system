
const token = sessionStorage.getItem("authToken");

if (!token) {
    window.location.replace("/login.html");
} else {
    loadUserProfile();
}

async function loadUserProfile() {
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

        const welcomeElement = document.getElementById("welcomeUser");

        if (welcomeElement && data.user) {
            welcomeElement.textContent = `Welcome, ${data.user.name}`;
        }

        sessionStorage.setItem("currentUser", JSON.stringify(data.user));
    } catch (error) {
        console.error("Failed to load user profile:", error);

        const welcomeElement = document.getElementById("welcomeUser");

        if (welcomeElement) {
            welcomeElement.textContent = "Unable to load your profile. Please refresh the page.";
        }
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


const predictionForm = document.getElementById("predictionForm");
const predictionMessage = document.getElementById("predictionMessage");

if (predictionForm) {
    predictionForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!predictionForm.reportValidity()) {
            return;
        }

        const token = sessionStorage.getItem("authToken");

        if (!token) {
            window.location.href = "/login.html";
            return;
        }

        const formData = Object.fromEntries(
            new FormData(predictionForm)
        );

        const assessment = {
            age: Number(formData.age),
            gender: formData.gender,
            bmi: Number(formData.bmi),
            hypertension: formData.hypertension === "true",
            heartDisease: formData.heartDisease === "true",
            smokingHistory: formData.smokingHistory,
            HbA1cLevel: Number(formData.HbA1cLevel),
            bloodGlucoseLevel: Number(formData.bloodGlucoseLevel)
        };

        const submitButton = predictionForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        predictionMessage.textContent = "Running prediction...";
        predictionMessage.style.color = "#087f8c";

        try {
            const response = await fetch("/api/assessments/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(assessment)
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                sessionStorage.removeItem("authToken");
                sessionStorage.removeItem("currentUser");
                window.location.href = "/login.html";
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Prediction failed."
                );
            }

            const probabilityPercent = (
                data.probability * 100
            ).toFixed(1);

            predictionMessage.textContent =
                `Model result: ${data.riskLabel}. ` +
                `Estimated probability for the diabetes class: ` +
                `${probabilityPercent}%. Assessment saved successfully.`;

            predictionMessage.style.color = "#087f8c";

            predictionForm.reset();
        } catch (error) {
            console.error("Prediction request error:", error);

            predictionMessage.textContent =
                error.message || "Unable to complete the prediction.";

            predictionMessage.style.color = "#b42318";
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}

async function loadDashboardHistory() {
    const totalElement = document.getElementById("totalAssessments");
    const lowRiskElement = document.getElementById("lowRiskCount");
    const highRiskElement = document.getElementById("highRiskCount");
    const messageElement = document.getElementById("recentAssessmentsMessage");
    const listElement = document.getElementById("recentAssessmentsList");

    if (!totalElement || !lowRiskElement || !highRiskElement ||
        !messageElement || !listElement) {
        return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("/api/assessments", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("authToken");
            sessionStorage.removeItem("currentUser");
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Could not load assessment history.");
        }

        const assessments = data.assessments || [];

        totalElement.textContent = assessments.length;

        lowRiskElement.textContent = assessments.filter(
            item => item.prediction === 0
        ).length;

        highRiskElement.textContent = assessments.filter(
            item => item.prediction === 1
        ).length;

        listElement.replaceChildren();

        if (assessments.length === 0) {
            messageElement.textContent = "No assessments yet.";
            return;
        }

        messageElement.textContent = "Your five most recent assessments:";

        assessments.slice(0, 5).forEach(item => {
            const card = document.createElement("article");
            const heading = document.createElement("h3");
            const details = document.createElement("p");
            const date = document.createElement("p");

            heading.textContent = item.riskLabel || "Assessment result";

            details.textContent =
                `Age: ${item.age} | BMI: ${item.bmi} | ` +
                `Blood glucose: ${item.bloodGlucoseLevel}`;

            date.textContent = item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "Date unavailable";

            card.append(heading, details, date);
            listElement.appendChild(card);
        });
    } catch (error) {
        console.error("Dashboard history error:", error);

        messageElement.textContent =
            "Unable to load assessment statistics right now.";
    }
}

loadDashboardHistory();
