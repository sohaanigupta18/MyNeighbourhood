# MyNeighbourhood
### **Your Voice. Your Community. Your Impact.**

**MyNeighbourhood** is an immersive, full-stack civic engagement platform that connects citizens directly with municipal authorities. It bridges the trust gap in city maintenance by providing transparent tracking, AI-powered triage, community validation, and a gamified resident marketplace.

---

## 🚀 Key Features

### 1. 🗺️ Live Map Grid & Interactive Queue
* **Interactive City Grid**: A real-time spatial SVG mapping canvas displaying Portland's local streets.
* **Proximity-Sorted Queue**: A robust sidebar panel showcasing all reported neighborhood tickets. Issues are dynamically ordered by real-time distance proximity to the user, and secondary-sorted by community upvotes.
* **Expanded Inline Inspection**: Clicking any item in the queue or pinpoint on the grid smoothly reveals the complete evidence attachment, current department routing, progress logs, and action prompts.

### 2. 🧠 Server-Side AI Triage Agent (Gemini 1.5 Flash)
* **Automated Image & Damage Assessment**: Municipal dispatches analyze uploaded damage photos using Gemini 1.5 Flash's vision processing to classify hazard types.
* **Dynamic Severity & Routing Categorization**: The AI automatically infers severity levels (`Critical`, `High`, `Medium`, `Low`) and tags appropriate departments (`Roadway`, `Sanitation`, `Public Safety`, etc.) to minimize dispatch friction.

### 3. 💬 Grounded AI Assistant Bot
* **Real-Time Telemetry Grounding**: An interactive civic companion chatbot grounded directly on active system tickets and Portland district configurations.
* **Intelligent Query Resolution**: Citizens can ask about specific ticket resolutions, local district statistics, or ongoing service delays in natural language.

### 4. 🛠️ Officer Dispatch Queue Workstation
* **Active Crew Dashboards**: Dedicated administrative panel for city officers to manage active tickets within their jurisdiction.
* **Pipeline Management**: Move dispatches seamlessly from `Assigned` ➔ `Work-In-Progress` ➔ `Resolved`.
* **Evidence-Locked Completion**: Officers are required to upload visual work evidence and complete patch notes before officially closing critical hazards.

### 5. 🎁 Sponsor-Backed Citizen Rewards Marketplace
* **Citizen XP Progression**: Earn Experience Points (XP) for filing genuine reports, verifying neighboring alerts, or voting to close tickets. Level up across regional leaderboards.
* **Rewards Shop**: Redeem accumulated XP for actual city-sponsored vouchers such as regional transit passes, county library coupons, and community pool tickets.

---

## 🛠️ Tech Stack

### **Frontend**
* **React 18**: Main SPA structure using functional components, state hooks, and robust context bindings.
* **Tailwind CSS v4.0**: Fully responsive custom layout implementing the eye-friendly, high-contrast **Cosmic Slate and Emerald** theme.
* **Lucide React**: Clean vector icons utilized across all navigational rails, action buttons, and status indicator flags.

### **Backend & APIs**
* **Express.js (Node.js)**: High-performance backend router managing secure `/api/*` proxies, state management, and asset deployment.
* **Google GenAI Node.js SDK**: Interacts with **Gemini 1.5 Flash** models for vision analysis, system prompt grounding, and multi-turn conversational agents.

### **Build & Packaging**
* **Vite**: Rapid asset compilation and developer execution environment.
* **esbuild**: Packages the TypeScript backend cleanly into a optimized CJS bundle (`dist/server.cjs`) for ultra-fast production container restarts.
