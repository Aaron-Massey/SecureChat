# SecureChat

SecureChat is a modern, end-to-end encrypted (E2EE) peer-to-peer (WebRTC) chat application built with Vue 3, Pinia, TypeScript, and an Express + Socket.IO signaling backend. It features cryptographic key ratcheting, file chunking, full Docker containerization, and automated deployment scripts for remote servers.

---

## Key Features

- **End-to-End Encryption (E2EE)**: AES encryption with PBKDF2 key derivation and dynamic key ratcheting for forward secrecy.
- **WebRTC Peer-to-Peer**: Direct client-to-client data channel communication with fallback signaling.
- **Configurable ICE/TURN Strategy**: Dynamic STUN/TURN server resolution via pluggable strategy patterns.
- **Encrypted File Sharing**: File chunking and progressive encrypted transfer over WebRTC.
- **Monorepo Architecture**: Clean separation between Vue 3 frontend workspace and Express/Socket.IO backend workspace.
- **Docker & Server Ready**: Multi-architecture Docker builds (ARM64 & x86_64) and single-command automated SSH deployment.

---

## Architectural Highlights & Design Patterns (GOF)

SecureChat incorporates several classic Gang of Four (GOF) design patterns:

- **Strategy Pattern**: 
  - `IceServerStrategy`: Resolves ICE/TURN configurations dynamically between default public servers and custom user-provided TURN credentials (`ConfigurableIceStrategy` vs `DefaultIceStrategy`).
  - `ThemeStrategy` & `LayoutStrategy`: Handles dynamic UI layouts and color scheme resolution.
  - `CipherStrategy` & `KeyRatchetStrategy`: Encapsulates encryption routines and key ratchet steps.
- **Factory Method Pattern**:
  - `PeerConnectionFactory`: Encapsulates creation and configuration of `RTCPeerConnection` instances with injected ICE strategies.
  - `PayloadFactory`: Standardizes the creation of message and file payloads.
- **Command Pattern**:
  - `ChatCommandInvoker` & `chatCommands.ts`: Decouples user chat input handling (`/clear`, text messaging) into discrete command objects.
- **State / Observer Pattern**:
  - `ConnectionContext` & `connectionState.ts`: Manages connection lifecycle transitions (`DisconnectedState`, `ConnectingState`, `ConnectedState`, `FailedState`).
  - Reactive Pinia stores for application state propagation.
- **Adapter Pattern**:
  - `EmbeddedWindowAdapter`: Adapts window postMessage APIs for embedded/iframe execution contexts.

---

## Prerequisites

- **Node.js**: `^22.18.0` or `>=24.12.0`
- **npm**: `^10.0.0` or newer
- **Docker Desktop** *(optional)*: Required for Docker containerization and exporting container tarballs.

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Aaron-Massey/SecureChat.git
   cd SecureChat
   ```

2. **Install Workspace Dependencies**:
   ```bash
   npm install
   ```
   *(This installs dependencies for both `frontend` and `backend` monorepo workspaces).*

---

## Configuration & Environment Variables

SecureChat uses a dual-configuration approach: non-sensitive default settings are defined in `config.json`, while environment-specific secrets and overrides are stored in `.env`. An example environment file [`.env.example`](.env.example) is provided in the root directory as a template.

### Quick Setup with `.env.example`

1. **Copy the example template to create your local `.env` file**:
   ```bash
   cp .env.example .env
   ```
   *(Or on Windows PowerShell: `copy .env.example .env`)*

2. **Configure environment variables in `.env` as needed**:
   - **TURN Server Credentials**: `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_PASSWORD`
   - **Remote Server SSH Target**: `SERVER_HOST`, `SERVER_USER`, `SERVER_PATH`, `SERVER_PORT`, `SERVER_SSH_KEY` (or legacy `PI_*` keys)
   - **Port & Security Overrides**: `FRONTEND_PORT`, `BACKEND_PORT`, `CORS_ORIGIN`, `USE_HTTPS`

### Base Configuration (`config.json`)
Non-sensitive default settings reside in `config.json` at the root directory:

```json
{
  "FRONTEND_PORT": 5173,
  "BACKEND_PORT": 3000,
  "CORS_ORIGIN": "*",
  "KEY_DERIVATION_ITERATIONS": 10,
  "KEY_DERIVATION_SALT": "securechat-default-salt",
  "USE_HTTPS": true,
  "SSL_CERT_PATH": "certs/server.crt",
  "SSL_KEY_PATH": "certs/server.key"
}
```

### Environment Variable Sync
When launching Docker or deployment commands, `npm run docker:sync` automatically generates or updates the `.env` file from `config.json` while preserving your custom environment secrets.

---

## Running the Application Locally

### Concurrent Development (Frontend + Backend)
Start both the backend signaling server and frontend development server concurrently:
```bash
npm run dev
```

### Individual Services
- **Backend Only**:
  ```bash
  npm run backend
  ```
  *Runs the signaling server on `http://localhost:3000` (or `https://localhost:3000` when SSL is enabled).*

- **Frontend Only**:
  ```bash
  npm run frontend
  ```
  *Runs Vite dev server on `http://localhost:5173` (or `https://localhost:5173`).*

---

## Finding Your Machine's Local IP (Cross-Device Testing)

To test P2P chat across multiple devices on the same local network:

### Windows
1. Open Command Prompt and run `ipconfig`.
2. Find `IPv4 Address` under your active Wireless LAN or Ethernet adapter (e.g. `192.168.X.X` or `10.X.X.X`).

### macOS
1. Open **System Settings** > **Network**.
2. Select your active connection and click **Details** to find your IP address.

### Linux
1. Open Terminal and execute `ip a` or `ifconfig`.
2. Look for `inet` under your primary network interface.

---

## Testing & Quality Assurance

SecureChat includes unit and integration tests written with [Vitest](https://vitest.dev/).

- **Run All Tests (Backend + Frontend)**:
  ```bash
  npm test
  ```

- **Run Frontend Tests Only**:
  ```bash
  npm run test --prefix frontend
  ```

- **Run Backend Tests Only**:
  ```bash
  npm run test --prefix backend
  ```

- **Frontend Code Quality & Linting**:
  ```bash
  npm run type-check --prefix frontend
  npm run lint --prefix frontend
  npm run format --prefix frontend
  ```

---

## Docker Containerization

1. **Build and Run Containers**:
   ```bash
   npm run docker:up
   ```
   *Syncs `.env` parameters and launches frontend (nginx) and backend containers via Docker Compose.*

2. **Export Images for Remote Deployment**:
   ```bash
   npm run docker:export
   ```
   *Builds multi-architecture Docker images and exports tarballs to `./exports/` for remote server deployment.*

---

## Deploying to Remote Server

### Option 1: Automated SSH Deployment (Recommended)
Ensure your `.env` contains your server's connection details (`SERVER_HOST`, `SERVER_USER`, etc.), then execute:
```bash
npm run deploy:server
```
*You can also pass dynamic CLI flags:*
```bash
npm run deploy:server -- --host=192.168.1.50 --user=deploy --port=22
```

### Option 2: Container Update Script on the Server
If you cloned the repo directly onto your target server:
```bash
npm run server:update
```
*(or run `sh pi/update-containers.sh` / `sh pi/deploy-git.sh` directly on the server).*

### Option 3: GitHub Actions CI/CD
Add `SERVER_HOST`, `SERVER_USER`, and `SERVER_SSH_KEY` to your repository Secrets on GitHub. Pushing to `main` will automatically build Docker images and deploy updates to your remote server.

---

## License

ISC License - created by Aaron Massey.
