# Decision Tapestry: Product Backlog

This document serves as a living backlog for the Decision Tapestry project. It's a place to capture, refine, and prioritize ideas before they become formal, committed decisions in `decisions.yml`.

---

## Roadmap: Portability & Developer Experience

Our primary focus is to evolve Decision Tapestry from an internal tool into a portable, accessible product that can be adopted by any development team.

### Phase 1: Foundational CLI Tool (Complete)

- **Goal**: Package the application as a standalone NPM CLI tool.
- **Status**: Complete.
- **Key Features**:
    - `decision-tapestry init`: Scaffolds a new project with `decisions.yml` and `PRODUCT-BACKLOG.md`.
    - `decision-tapestry start`: Runs the dashboard server, reading data from the user's current project directory.

### Phase 2: Enhanced Developer Experience (Next Up)

- **Goal**: Deeply integrate the tool into the developer's primary workflow within their editor.
- **Implementation**: A VS Code Extension.
- **Key Features**:
    - **Integrated Dashboard**: A new panel in the VS Code sidebar to view the decision map and analytics without leaving the editor.
    - **YAML IntelliSense**: Provide autocompletion, validation, and hover-information for `decisions.yml` to guide users.
    - **Code-to-Decision Linking**: Gutter indicators next to code that is mentioned in the `affected_components` of a decision.
    - **Command Palette Integration**: Add commands like "Decision Tapestry: Create New Decision" to scaffold new entries.

### Phase 3: Universal Portability (Future)

- **Goal**: Make the tool accessible to a developer in any language or environment.
- **Implementation**: A Docker image.
- **Key Features**:
    - A self-contained Docker image published to Docker Hub.
    - Simple `docker run` command to mount a project directory and start the server, requiring no local Node.js installation.

---

### Future Architecture: Granular Data Binding

*A plan for evolving the frontend architecture to be more performant and scalable as the number of decisions grows.*

- **Goal**: Instead of re-rendering the entire dashboard on every change, implement a more granular data-binding strategy to update only the components that have actually changed.
- **Current State**: The application calls `initializeDashboard()` on every update, which re-fetches all data and re-builds the entire UI from scratch.
- **Future Approaches**:
    - **1. Minimal DOM Diffing (Vanilla JS)**: Manually compare the old and new data sets and apply specific, targeted updates to the `vis.js` network and the DOM.
        - **Pros**: No new dependencies. Full control over the rendering process.
        - **Cons**: Can be complex to implement correctly. Prone to bugs and difficult to maintain as the UI grows.
    - **2. Lightweight Frontend Library (e.g., Preact, Lit)**: Introduce a lightweight library to handle virtual DOM diffing and DOM updates automatically.
        - **Pros**: Significant improvement in performance and maintainability with minimal overhead. Modernizes the development workflow.
        - **Cons**: Requires a one-time effort to refactor the rendering logic into components and integrate the new library.
    - **3. Full Frontend Framework (e.g., React, Vue)**: Rewrite the client-side application using a modern, full-featured framework.
        - **Pros**: The most robust, scalable, and maintainable long-term solution. Provides access to a rich ecosystem of tools and libraries.
        - **Cons**: High implementation cost. A full rewrite would be a significant project and may be overkill for the current scope.

---

## Completed Milestones

*Foundational features that have been implemented and are now in use.*

- **Interactive Dashboard Application**: Evolved the system from a static site generator to a dynamic client-server application with real-time updates and a rich, interactive UI. (Decisions #11, #12, #16, #20, #21)
- **Analytics & Health Metrics**: Implemented a dedicated analytics panel with data visualizations for decision velocity and project health. (Decisions #23, #24, #25, #26, #27)
- **Search & Filtering**: Added UI and logic for searching and filtering decisions. (Decision #22)
- **CLI Foundation**: Created the initial command-line tool for managing tasks. (Decision #19)
- **Foundational CLI Tool**: Packaged the application as a standalone NPM CLI tool that can be initialized in any project. (Decision #28)