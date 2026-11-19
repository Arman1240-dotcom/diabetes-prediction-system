<div align="center">

# DiabetesCare — Diabetes Prediction System

**A full-stack, machine-learning-powered diabetes risk assessment application**

[Live Application](https://diabetes-prediction-system-aco0.onrender.com) · [Source Code](https://github.com/Arman1240-dotcom/diabetes-prediction-system) · [Installation](#getting-started) · [Docker](#run-with-docker)

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white) ![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white) ![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

</div>

> [!IMPORTANT]
> **Educational use only.** Predictions are statistical estimates, **not medical diagnoses**. Do not use this application to make clinical decisions. Consult a qualified healthcare professional for medical advice, screening, or diagnosis.

## Overview

DiabetesCare helps users explore a machine-learning-based estimate of diabetes risk using eight health and demographic inputs. It provides account-based access to assessments, prediction results, and saved history through a responsive web interface.

The Express backend communicates with a Python scikit-learn pipeline and stores user accounts and assessment records in MongoDB.

## Features

- Responsive public landing page, registration, and login screens
- JWT-based authentication with bcrypt-hashed passwords
- Personalized dashboard for entering health information
- Diabetes classification and model-estimated probability
- Saved assessment history associated with the signed-in user
- Account settings and assessment-management functionality
- MongoDB Atlas integration
- Docker support for running the Node.js and Python components together
- Health-check endpoint for verifying server and database connectivity

**Note:** The current prediction API requires authentication; sign in before submitting an assessment. The landing page is public.

## Technology stack

| Layer | Technology |
| --- | --- |
| UI | HTML5, CSS3, vanilla JavaScript |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Machine learning | Python 3.11, scikit-learn, pandas, joblib |
| Containerization | Docker |
| Hosting | Render (existing deployment) |

## Model inputs

| Input | Description |
| --- | --- |
| Gender | Gender category |
| Age | Age in years |
| Hypertension | Whether hypertension is present |
| Heart disease | Whether heart disease is present |
| Smoking history | Smoking-history category |
| BMI | Body mass index |
| HbA1c level | Glycated hemoglobin level |
| Blood glucose level | Blood glucose measurement |

The model returns a binary prediction (`0` or `1`) and an estimated probability. The application presents the result as a risk category. **Model output is not a clinical diagnosis or a validated individual medical risk score.**

## Getting started

### Prerequisites

Install the following:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) (Node.js 22 recommended; the Docker image uses Node.js 22)
- [Python 3.11](https://www.python.org/downloads/) with `pip`
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster **or** a reachable local MongoDB server

Optional: [Docker Desktop](https://www.docker.com/products/docker-desktop/) for the container-based setup.

### 1. Clone the repository

```bash
git clone https://github.com/Arman1240-dotcom/diabetes-prediction-system.git
cd diabetes-prediction-system
```

### 2. Install Node.js dependencies

```bash
npm ci
```

### 3. Create and activate a Python virtual environment

**Windows PowerShell:**

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` in that terminal, then retry activation.

**macOS / Linux:**

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### 4. Configure the environment

Create a `.env` file in the project root by copying `.env.example`:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Edit `.env` and supply your **own** database connection string and a long, randomly generated JWT secret:

```dotenv
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/diabetes_prediction?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
PYTHON_PATH=python
```

For a local MongoDB server, `MONGODB_URI=mongodb://127.0.0.1:27017/diabetes_prediction` is an alternative.

**MongoDB Atlas setup:** Create a cluster, add a database user, allow access from your current IP address in Network Access, and copy the **driver connection string**. Replace its placeholders with your own credentials. URL-encode special characters in passwords when needed. Never commit `.env` or publish your credentials.

`PYTHON_PATH=python` works when your virtual environment is activated before starting Node.js. Alternatively, set it to the full path of your Python 3.11 virtual-environment executable.

### 5. Start the application

With the virtual environment activated:

```bash
npm start
```

Open **http://localhost:3000** in your browser.

For development with automatic Node.js restarts:

```bash
npm run dev
```

### 6. Verify the server

Open **http://localhost:3000/api/health**. When the database is connected, the response should resemble:

```json
{
  "server": "running",
  "database": "connected"
}
```

## Run with Docker

Docker packages the Node.js backend, Python runtime, dependencies, frontend, and saved ML model in one image. A reachable MongoDB instance is still required.

### 1. Configure your environment

Create `.env` as described above. For Atlas, use a MongoDB connection string accessible from the container. If using a MongoDB server installed on your Windows/macOS host, `localhost` inside Docker refers to the container, **not** the host; use a suitable host address such as `host.docker.internal` where supported.

### 2. Build the image

```bash
docker build -t diabetes-prediction-system:local .
```

### 3. Start the container

```bash
docker run --rm --name diabetes-prediction-app --env-file .env -e PORT=3000 -e PYTHON_PATH=python3 -p 127.0.0.1:3000:3000 diabetes-prediction-system:local
```

Visit **http://localhost:3000**. Press `Ctrl+C` in the running terminal to stop the container.

If port 3000 is already in use, replace `-p 127.0.0.1:3000:3000` with `-p 127.0.0.1:3001:3000` and visit **http://localhost:3001**.

> [!NOTE]
> The `.dockerignore` excludes `.env` from the image. The `--env-file` option supplies configuration at runtime without embedding secrets in the built image.

## How to use

1. Open the homepage and create an account.
2. Log in to access your dashboard.
3. Enter the eight requested health and demographic values.
4. Submit an assessment to receive a model-generated result.
5. Visit **History** to review saved assessments.
6. Use **Settings** to manage your account information.

Assessment history is linked to the authenticated account. A valid login token is required to use the prediction and history API.

## Project structure

```text
diabetes-prediction-system/
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Assessment.js
│   │   └── User.js
│   ├── routes/
│   │   ├── assessments.js
│   │   └── auth.js
│   └── server.js
├── frontend/
│   └── public/
│       ├── css/style.css
│       ├── js/
│       ├── index.html
│       ├── login.html
│       ├── register.html
│       ├── dashboard.html
│       ├── history.html
│       └── settings.html
├── ml/
│   ├── models/diabetes_model.joblib
│   ├── predict.py
│   └── train_model.py
├── ml-service/            # Additional ML-related scripts
├── scripts/               # Dataset inspection utilities
├── Dockerfile
├── .dockerignore
├── .env.example
├── package.json
├── package-lock.json
├── requirements.txt
└── README.md
```

The dataset is excluded from Git. The trained model is expected at `ml/models/diabetes_model.joblib` for predictions to work.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server and database health |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in and obtain a JWT |
| `GET` | `/api/auth/me` | Retrieve current user profile (JWT required) |
| `GET` | `/api/assessments` | Retrieve the user's history (JWT required) |
| `POST` | `/api/assessments/predict` | Predict and save an assessment (JWT required) |
| `DELETE` | `/api/assessments` | Clear the user's history (JWT required) |
| `DELETE` | `/api/assessments/:id` | Delete one of the user's assessments (JWT required) |

Protected endpoints require `Authorization: Bearer <token>`.

## Troubleshooting

| Problem | Suggested fix |
| --- | --- |
| `MongoDB connection failed` | Check `MONGODB_URI`, Atlas database-user credentials, and network access rules. |
| `Authentication is not configured` | Set `JWT_SECRET` in `.env`, then restart the server. |
| `python` not found | Activate `.venv` or set `PYTHON_PATH` to the correct Python executable. |
| `Trained model not found` | Confirm `ml/models/diabetes_model.joblib` exists. |
| Port 3000 already in use | Stop the existing process or use another host port with Docker. |
| Docker cannot reach local MongoDB | Do not use `localhost` for a host database from inside a container; use an accessible host address. |
| Dependencies fail to install | Verify Node.js/Python versions and rerun `npm ci` and `python -m pip install -r requirements.txt`. |

## Deployment

The project has been deployed on Render:

**https://diabetes-prediction-system-aco0.onrender.com**

For your own deployment, build the repository using its `Dockerfile`, configure `MONGODB_URI` and `JWT_SECRET` as private environment variables in your hosting platform, and ensure the platform routes traffic to the app's configured `PORT`. Do not upload `.env` or place secrets in GitHub.

## Security and privacy

- Passwords are hashed with bcryptjs.
- Protected endpoints validate JWTs.
- User assessment records are associated with their account.
- `.env`, local virtual environments, and dataset files are ignored by Git.
- Do not enter real patient data into a public demonstration without appropriate privacy safeguards and consent.

## Contributing

Contributions and improvements are welcome. Fork the repository, create a feature branch, and open a pull request describing your changes.

## Disclaimer

This is an educational machine-learning project. The output depends on the dataset, training process, and user-entered values and may be inaccurate or biased. It is not a substitute for professional medical evaluation.
