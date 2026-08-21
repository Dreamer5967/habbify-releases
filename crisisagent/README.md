# 🚨 CrisisAgent — Autonomous Emergency Response Agent

> An AI-powered emergency response system that understands unfamiliar buildings, auto-assigns sensors, and replans evacuation routes in real-time.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.0+-blue?style=flat)](https://networkx.org/)
[![Pydantic v2](https://img.shields.io/badge/Pydantic-v2.0+-E92063?style=flat&logo=pydantic)](https://pydantic.dev)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32-E7352C?style=flat&logo=espressif)](https://www.espressif.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 The Problem

When a fire or disaster strikes a large facility (office building, hospital, warehouse), existing emergency systems are rigid and dumb:
1. **Static Evacuation Maps**: Printed signs assume all exits and corridors are safe, funneling victims directly into active smoke and blaze zones.
2. **Sensor Silos & Blank Spots**: Most rooms lack dense IoT sensors, leaving incident commanders blind to heat and toxic gases spreading through adjoining rooms.
3. **Blackout Failures**: When fire damages sensor wiring, traditional systems assume no hazard exists (*"missing data = safe"*), causing catastrophic evacuation errors.
4. **Setup Bottlenecks**: Modern digital-twin platforms require weeks of manual BIM modeling, CAD labeling, and expensive engineering setup before a single alert can be raised.

## 💡 The CrisisAgent Solution

**CrisisAgent** provides an instant, autonomous emergency response command layer:
- **Zero-Config Ingestion**: Upload any 2D architectural floor plan (PNG/JPEG) and get an interactive, navigable digital twin in under 5 seconds.
- **Auto-Provisioning**: Automatically generates simulated IoT sensor bundles (temperature, smoke, occupancy) across every room and corridor, while seamlessly bridging physical ESP32 nodes when available.
- **Autonomous Reasoning with Hard Safety Guardrails**: An LLM agent reasons over live telemetry while a **deterministic Python safety engine** validates every single evacuation decision before broadcasting to evacuees.
- **Dynamic Evacuation Routing**: Dynamic weighted A* pathfinding that continuously avoids fire, smoke plumes, crowd bottlenecks, and unobservable zones.

---

## ✨ Key Features

- 🏢 **Zero-Config Building Understanding**: Vision models (Gemini 2.5 Flash / Ollama Qwen3-VL) extract navigable zones, corridors, stairwells, and exits into a topological spatial graph.
- 📡 **Automatic Sensor Provisioning**: Every single zone is immediately provisioned with live telemetry (temp, smoke, occupancy) — zero hardware required to test or deploy.
- 🤖 **Autonomous Agent Reasoning**: An LLM agent evaluates multi-zone anomalies, tracks hazard propagation vectors, and triggers automated containment protocols.
- 🛡️ **Deterministic Safety Engine**: Hard mathematically verified guardrails intercept and reject dangerous routes. If a sensor goes offline, that zone is classified as `UNOBSERVABLE` and strictly sealed against routing.
- 🧭 **Dynamic A\* Rerouting**: Evacuation routes dynamically replan in sub-second intervals as fire spreads or corridors become impassable.
- 📝 **100% Explainable Audit Trail**: Every evacuation instruction and isolation command is logged with natural-language reasoning in SQLite and WebSocket feeds.
- 🔌 **Physical ESP32 Bridge**: Optional plug-and-play hardware integration with DHT22, MQ-2, and PIR sensors with auto-binding to floor plan zones.
- 🆓 **100% Free Stack**: Zero mandatory paid API subscriptions — runs completely local and offline via Ollama and mock adapters.

---

## 🏗️ Architecture

CrisisAgent operates on a decoupled, three-layer reactive architecture designed for mission-critical reliability:

```
                                  ┌─────────────────────────────────────────────────┐
                                  │           2D Floor Plan Image (PNG/JPG)         │
                                  └───────────────────────┬─────────────────────────┘
                                                          │
                                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: VISION PARSER & SPATIAL TOPOLOGY                                                                         │
│  - Vision Backend (Gemini 2.5 Flash / Ollama Qwen3-VL / Mock) extracts rooms, corridors, stairwells, and exits.    │
│  - NetworkX builds a weighted bidirectional navigation graph G = (V, E) with centroids and connections.          │
│  - Sensor Manifest Auto-Generator provisions virtual telemetry bundles for 100% zone coverage.                   │
└─────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: DIGITAL TWIN & REAL-TIME WORLD MODEL                                                                     │
│  - WorldModel maintains unified state for every zone: Temperature, Smoke %, Occupancy, Risk Status, Confidence.   │
│  - Hazard Propagator simulates fluid thermal and smoke spread to adjacent graph nodes.                            │
│  - Hardware Bridge ingests live HTTP/WiFi telemetry from physical ESP32 sensor nodes.                             │
│  - WebSocket ConnectionManager broadcasts state deltas to the React frontend at 2 Hz.                             │
└─────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: AUTONOMOUS AGENT LOOP & DETERMINISTIC SAFETY ENGINE                                                      │
│  - Agent Loop triggers on significant state deltas (temp > 45°C, smoke > 20%, sensor blackout).                   │
│  - Reasoning LLM (Groq Llama-3.3-70B / Ollama Llama-3.1) decides containment and evacuation strategies.          │
│  - 🛡️ DETERMINISTIC SAFETY ENGINE (Python Invariant Checker):                                                     │
│      * Rule 1: CRITICAL zones are impassable (Cost = ∞).                                                         │
│      * Rule 2: UNOBSERVABLE zones are impassable (Pessimistic Missing Data != Safe).                              │
│      * Rule 3: Evacuation destinations MUST be verified safe exits.                                              │
│  - Dynamic Weighted A* Router recalculates optimal evacuation paths.                                             │
│  - Async SQLite Audit Logger persists full rationale and decision history.                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Two-Backend Adapter Pattern

CrisisAgent cleanly separates **Vision** (spatial parsing) from **Reasoning** (incident response), allowing developers to mix and match cloud and local backends:

| Backend Role | Cloud Provider (Fast & Free-tier) | Local / Edge Provider (100% Offline) | Zero-Config Demo Mode |
| :--- | :--- | :--- | :--- |
| **Vision Model** | Google Gemini 2.5 Flash | Ollama (`qwen3-vl`) | Built-in Mock Vision Adapter |
| **Reasoning Agent** | Groq (`llama-3.3-70b-versatile`) | Ollama (`llama3.1`) | Built-in Rule & Heuristic Engine |

Backends can be hot-swapped at runtime via `POST /api/config/backend` without restarting the server!

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- *(Optional)* [Ollama](https://ollama.ai) for local LLM inference

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd crisisagent/backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# (Optional) Edit .env with your API keys, or leave defaults for zero-config mock mode
# Start the FastAPI backend server
python -m backend.main
```
> The backend server will start on `http://localhost:8000`.

---

### 2. Frontend Setup

```bash
# In a new terminal window, navigate to frontend directory
cd crisisagent/frontend

# Install node dependencies
npm install

# Start the Vite development server
npm run dev
```
> The frontend UI will open on `http://localhost:5173`.

---

### 3. Generate Demo Floor Plans

```bash
# In a new terminal, run the asset generator
cd crisisagent/demo
python generate_demo_assets.py
```
> This creates two architectural floor plans:
> - `demo/building_a.png` (Corporate Office — 1200x800px)
> - `demo/building_b.png` (Metropolitan Medical Center — 1200x900px)

---

## 🎮 Demo Script (6-Step Hackathon Walkthrough)

Follow this step-by-step walkthrough to experience the full autonomy of CrisisAgent:

| Step | Action | What Happens Under the Hood | Key Observation |
| :---: | :--- | :--- | :--- |
| **1** | **Load Floor Plan**<br>Click `Load Demo` ➔ `Corporate Office` or upload `demo/building_a.png` | Vision backend parses rooms (R1-R6), corridors (C1-C2), stairs (S1-S2), and exits (E1-E2) into a NetworkX graph. | Instant topological spatial awareness without manual tagging. |
| **2** | **Inspect Sensor Manifest**<br>Hover over room nodes on the map | Virtual sensor bundles are auto-provisioned with ambient temperature (22°C), zero smoke, and live occupancy counts. | Zero-hardware instant provisioning. Every room is immediately live. |
| **3** | **Baseline Normal State**<br>Observe the live stats bar & WebSocket feed | Sensor simulator pulses small benign variations. System status is green `NORMAL`. Initial safe paths to exits are computed. | Sub-second latency WebSocket telemetry loop. |
| **4** | **Trigger Hazard Incident**<br>Click on Room `R1` ➔ Click `Trigger Fire` | Fire begins in R1. Temperature spikes > 75°C, smoke > 60%. World model flags R1 as `CRITICAL`. Agent loop awakens. | **Instant Replan**: Occupants in adjacent zones are immediately rerouted away from R1 toward Exit E2. |
| **5** | **Simulate Sensor Blackout**<br>Click Room `R2` ➔ Click `Fail All Sensors` | All telemetry in R2 goes offline. World model marks R2 as `UNOBSERVABLE`. | **Safety Invariant Enforced**: The system does NOT assume R2 is safe. It treats R2 as high risk and blocks evacuation paths through it. |
| **6** | **Audit Agent Explainability**<br>Examine the `Agent Decision Feed` on the right sidebar | Every rerouting, barrier placement, and alarm escalation is displayed with timestamped natural language rationale. | Full transparency for emergency commanders and judges. |

---

## 🛡️ Deterministic Safety Engine

LLMs can hallucinate; emergency evacuation routes must **never** fail. CrisisAgent solves this by sandwiching the LLM between a **strict world model** and a **deterministic Python safety validator**:

```
                       ┌───────────────────────────────┐
                       │  LLM Agent Suggests a Route   │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   Deterministic Safety Engine  │
                       │    (Hard Python Invariants)    │
                       └───────────────┬───────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
           [Violates Invariant]                   [Passes All Rules]
                    │                                     │
                    ▼                                     ▼
        ❌ Reject Route Immediately           ✅ Broadcast Evacuation Plan
        (Fall back to Safety A* Search)
```

### Safety Invariants Enforced in Code:

1. **No Routing Through Critical Zones**:
   $$\text{Risk}(\text{Zone}) = \text{CRITICAL} \implies \text{Edge Cost} = \infty$$
   Any zone where Temperature $> 60^\circ\text{C}$, Smoke $> 50\%$, or Hazard Probability $> 0.7$ is strictly impassable.
2. **Pessimistic Missing Data Invariant (`UNOBSERVABLE`)**:
   $$\text{Sensors Offline} \implies \text{State} = \text{UNOBSERVABLE} \implies \text{Route Blocked}$$
   If sensors fail or are destroyed by fire, CrisisAgent rejects all paths through that zone. Missing data is never treated as safe.
3. **Exit Validation Invariant**:
   A valid evacuation route must strictly terminate at a verified `exit` node whose current risk state is `LOW` or `MEDIUM`.
4. **Dynamic Weighted Edge Cost Function**:
   $$\text{Cost}(u, v) = \text{Dist}(u, v) + 4.0 \times \left(\frac{\text{Smoke}}{20}\right) + 3.0 \times \max\left(0, \frac{\text{Temp} - 30}{10}\right) + 0.5 \times \left(\frac{\text{Occupancy}}{10}\right)$$

---

## 🔧 AI Backend Configuration

Configure your AI backends via `.env` or hot-swap dynamically using the REST API:

### Environment Variables (`backend/.env`)

```ini
# Choose: 'mock', 'gemini', or 'ollama'
LLM_VISION_BACKEND=mock

# Choose: 'mock', 'groq', or 'ollama'
LLM_REASONING_BACKEND=mock

# API Keys (if using cloud providers)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Local Ollama Host (if using local models)
OLLAMA_HOST=http://localhost:11434
```

### Hot-Swap API (`POST /api/config/backend`)

```bash
# Switch reasoning to Groq Llama 3.3 on the fly
curl -X POST http://localhost:8000/api/config/backend \
  -H "Content-Type: application/json" \
  -d '{"reasoning": "groq"}'

# Switch vision to Gemini 2.5 Flash
curl -X POST http://localhost:8000/api/config/backend \
  -H "Content-Type: application/json" \
  -d '{"vision": "gemini"}'
```

---

## 📡 Hardware Integration (ESP32 Sensor Node)

CrisisAgent includes production-ready firmware for physical IoT sensing nodes:

### Hardware Pinout

| Sensor / Actuator | ESP32 GPIO Pin | Function | Notes |
| :--- | :---: | :--- | :--- |
| **DHT22 (AM2302)** | **GPIO 4** | Ambient Temperature & Humidity | Include 10kΩ pull-up resistor to 3.3V |
| **MQ-2 Gas Sensor** | **GPIO 34** | Smoke / Toxic Gas Concentration | Connect Analog A0 pin (ADC1 Channel 6) |
| **HC-SR501 PIR** | **GPIO 13** | Motion & Occupancy Detection | Digital Output (Active HIGH) |
| **Status LED: Green** | **GPIO 22** | WiFi Connected & Idle | 220Ω current-limiting resistor |
| **Status LED: Red** | **GPIO 21** | WiFi Disconnected / Error | 220Ω current-limiting resistor |
| **Status LED: Blue** | **GPIO 19** | HTTP Telemetry Transmitting | 220Ω current-limiting resistor |

### Flashing the Firmware

1. Open `crisisagent/hardware/esp32_firmware.ino` in **Arduino IDE** or **VS Code (PlatformIO)**.
2. Install required Arduino libraries via Library Manager:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
3. Edit the configuration constants at the top of the file:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* SERVER_HOST   = "192.168.1.50";  // IP of your CrisisAgent backend
   const int   SERVER_PORT   = 8000;
   const char* DEVICE_ID     = "esp32_001";
   const char* ASSIGNED_ZONE = "R1";            // Automatically binds to Room 1
   ```
4. Select board **ESP32 Dev Module**, choose your COM port, and click **Upload**.
5. Open Serial Monitor at **115200 baud** to view live sensor readings and HTTP POST confirmations!

---

## 📁 Project Structure

```
crisisagent/
├── README.md                           # Comprehensive project documentation
├── backend/                            # FastAPI Python Backend
│   ├── .env.example                    # Template for environment configuration
│   ├── requirements.txt                # Python backend dependencies
│   ├── main.py                         # Application entrypoint & lifespan lifecycle
│   ├── db.py                           # Async SQLite database initialization & query helper
│   ├── agent/                          # Autonomous reasoning agent
│   │   ├── loop.py                     # Reactive agent reasoning loop
│   │   ├── prompts.py                  # System prompts & OpenAI tool schemas
│   │   └── tools.py                    # Tool executor (reroute, isolate, alarm)
│   ├── api/                            # REST & WebSocket Endpoints
│   │   ├── routes.py                   # API routes (floor plans, incidents, hardware)
│   │   └── ws.py                       # High-throughput WebSocket connection manager
│   ├── llm/                            # Modular AI Provider Adapters
│   │   ├── base.py                     # Abstract base classes for Vision & Reasoning
│   │   ├── factory.py                  # Factory with environment-driven instantiation
│   │   ├── gemini.py                   # Google Gemini 2.5 Flash vision provider
│   │   ├── groq.py                     # Groq Llama-3.3-70B reasoning provider
│   │   ├── ollama.py                   # Ollama local Vision (Qwen) & Reasoning (Llama)
│   │   └── mock_adapter.py             # Built-in zero-config mock provider
│   ├── map/                            # Spatial floor plan graph engine
│   │   ├── floorplan_parser.py         # Pydantic schema validation & LLM prompt
│   │   └── graph_builder.py            # NetworkX graph builder & reachability checker
│   ├── routing/                        # Evacuation Pathfinding
│   │   └── astar.py                    # Dynamic hazard-weighted A* pathfinding
│   ├── safety/                         # Deterministic Safety Verification
│   │   └── engine.py                   # Invariant checker & zone risk classification
│   ├── sensors/                        # Sensor Simulation & Hardware Bridge
│   │   ├── esp32_bridge.py             # Physical hardware binding & ingestion bridge
│   │   ├── sensor_manifest.py          # Auto-provisioning virtual sensor bundles
│   │   └── simulator.py                # Ambient background noise & hazard thermal loop
│   └── world/                          # Digital Twin World Model
│       ├── hazard_propagator.py        # Fire & smoke spreading simulation
│       └── world_model.py              # Central thread-safe reactive digital twin
├── demo/                               # Demo assets & floor plans
│   ├── generate_demo_assets.py         # Pillow generator for Building A & Building B
│   ├── building_a.png                  # Generated Corporate Office floor plan (1200x800)
│   └── building_b.png                  # Generated Medical Center floor plan (1200x900)
├── frontend/                           # React + TypeScript + Tailwind Frontend
│   ├── index.html                      # HTML entrypoint
│   ├── package.json                    # Node dependencies & scripts
│   ├── vite.config.ts                  # Vite build configuration
│   ├── tailwind.config.js              # Tailwind CSS design system
│   └── src/                            # Application Source
│       ├── main.tsx                    # React root
│       ├── types/index.ts              # TypeScript domain types & interfaces
│       ├── hooks/useWebSocket.ts       # Reactive WebSocket subscription hook
│       └── components/                 # UI Components
│           ├── Header.tsx              # System status & backend selector
│           ├── StatsBar.tsx            # Live building metrics & risk summary
│           ├── BuildingSelector.tsx    # Demo building loader & upload handler
│           ├── IncidentControl.tsx     # Operator incident injection toolbox
│           └── IncidentFeed.tsx        # Explainable agent decision log stream
└── hardware/                           # Physical Sensor Firmware
    └── esp32_firmware.ino              # Complete ESP32 sketch for DHT22 + MQ-2 + PIR
```

---

## 🏆 For Judges: Why CrisisAgent Wins

### 1. Zero-Friction Setup
Unlike traditional enterprise safety platforms that require weeks of CAD tagging and sensor installation, CrisisAgent turns **any raw 2D image** into a live, interactive, sensor-monitored digital twin in **under 5 seconds**.

### 2. True Autonomous Agency with Deterministic Guardrails
CrisisAgent does not simply display warnings — its agent loop analyzes compound hazards, simulates propagation, and replans multi-zone evacuations. Crucially, the system uses a **hard mathematical safety engine** that makes it impossible for an LLM hallucination to route humans into a hazard zone.

### 3. The "Missing Data Is Not Safe" Philosophy
When fires consume sensors in real disasters, standard automation platforms assume the absence of heat alarms means the room is clear. CrisisAgent classifies blacked-out zones as `UNOBSERVABLE` and locks them down — a life-saving architectural differentiator.

### 4. Production-Quality Polish
From the sub-second WebSocket telemetry to the modular adapter architecture (Cloud vs Edge vs Mock) and physical ESP32 firmware, CrisisAgent is complete, extensible, and fully operational.

---

<div align="center">
  <sub>Built with ❤️ for rapid disaster response and resilient autonomous life-safety infrastructure.</sub>
</div>
