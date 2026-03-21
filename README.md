# Real-Time Collaborative Whiteboard - Frontend

**Student:** Srinidhi Vutkoori (X25173243)
**Module:** Cloud DevOpsSec (H9CDOS)

---

## Description

This is the frontend application for the Real-Time Collaborative Whiteboard platform. It provides an interactive canvas where multiple users can draw, annotate, and collaborate simultaneously. The application communicates with the Spring Boot backend via REST APIs and STOMP WebSocket connections, enabling real-time synchronisation of whiteboard state across all connected participants. Version history tracking allows teams to review and restore previous canvas states.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | Component-based UI framework |
| Vite | Fast development server and production bundler |
| Tailwind CSS | Utility-first CSS framework for styling |
| React Router | Client-side routing and navigation |
| Axios | HTTP client for REST API communication |
| Recharts | Data visualisation for analytics dashboards |
| React Hook Form + Yup | Form state management and schema validation |
| STOMP WebSocket | Real-time bidirectional communication with the backend |

---

## Prerequisites

- Node.js 18 or higher
- npm (bundled with Node.js)

Verify your Node.js version before proceeding:

```bash
node --version
npm --version
```

---

## Running the Application

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default. The dev server proxies API requests to the backend running on port 8080.

---

## Building for Production

```bash
npm run build
```

The compiled output is placed in the `dist/` directory. These static files are suitable for deployment to AWS S3 static website hosting or any CDN.

To preview the production build locally:

```bash
npm run preview
```

---

## Static Analysis

Run ESLint to check for code quality issues and enforce consistent style:

```bash
npm run lint
```

ESLint is configured via `eslint.config.js` and targets all JavaScript and JSX files under `src/`.

---

## Security Scanning

### Dependency vulnerability audit

```bash
npm audit
```

Reports known vulnerabilities in third-party dependencies. Use `npm audit fix` to automatically resolve issues where possible.

### Semgrep static application security testing

Semgrep scans the source code for security anti-patterns using community rule packs:

```bash
# Install Semgrep (if not already installed)
pip install semgrep

# Run against the src directory using JavaScript, React, and security audit rules
semgrep --config p/javascript --config p/react --config p/security-audit src/
```

Semgrep is also executed automatically in the CI pipeline on every push and pull request via the `semgrep/semgrep-action` GitHub Actions integration.

---

## Project Structure

```
frontend/
├── public/                  # Static assets served as-is
├── src/
│   ├── api/                 # Axios instances and API service modules
│   ├── assets/              # Images, icons, and other static resources
│   ├── components/          # Reusable UI components
│   │   ├── whiteboard/      # Canvas drawing components
│   │   ├── collaboration/   # Real-time user presence components
│   │   ├── version/         # Version history UI components
│   │   ├── team/            # Team and member management components
│   │   └── analytics/       # Recharts-based analytics components
│   ├── context/             # React context providers for global state
│   ├── hooks/               # Custom React hooks (WebSocket, auth, etc.)
│   ├── pages/               # Top-level route page components
│   ├── routes/              # React Router configuration
│   ├── utils/               # Utility functions and helpers
│   └── main.jsx             # Application entry point
├── terraform/               # AWS infrastructure as code
│   ├── main.tf              # Provider, VPC, subnets, internet gateway
│   ├── ec2.tf               # EC2 instance and security group
│   ├── rds.tf               # PostgreSQL RDS instance
│   ├── s3.tf                # S3 bucket for static website hosting
│   ├── variables.tf         # Input variable definitions
│   └── outputs.tf           # Output value definitions
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions CI/CD pipeline
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Key Features

- **Whiteboard Canvas** - HTML5 canvas-based drawing surface supporting freehand drawing, shapes, and text annotations with configurable stroke colours and sizes.
- **Real-Time Collaboration** - STOMP over WebSocket enables live synchronisation of canvas events across all participants in a session with sub-second latency.
- **Version History** - Named snapshots of the whiteboard state can be saved, browsed, and restored, providing a full audit trail of changes over time.
- **Team Management** - Users can create teams, invite members by email, and assign roles. Access to whiteboards is controlled at the team level.
- **Analytics Dashboard** - Recharts-powered visualisations display session activity, contributor statistics, and usage trends over configurable time periods.
