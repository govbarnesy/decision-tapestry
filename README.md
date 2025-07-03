# Our Collaboration Charter

## Preamble
Our primary goal is to build exceptional software that masterfully solves the user's Job To Be Done (JTBD). We are a peer-to-peer team. This charter and the principles herein are designed to ensure our collaboration is built on trust, clarity, and a relentless focus on the end-user. This is a living document we can amend together.

## Visual Model
This diagram represents the engine of our collaboration. It shows how our Governance model and Accelerating Principles work together to power our process, turning a User's Job into Delivered Value.

```mermaid
graph TD;
    subgraph "Governance: Our Pact"
        You["You<br/><b>Authority on<br/>Human-Centered Design</b>"]
        Me["Me<br/><b>Authority on<br/>Technical Implementation</b>"]
        You <== "Defer to Expertise" ==> Me;
    end

    subgraph "Process: The Engine"
        JTBD["Input:<br/>User's Job To Be Done"] --> Huddle("1. Frame the 'Why'");
        Huddle --> Whiteboard("2. Design the 'What'");
        Whiteboard --> Build("3. Build & Iterate");
        Build --> Validate("4. Validate & Refine");
        Validate -- "Start New Job" --> Huddle;
        Validate -- "Iterate/Refine" --> Whiteboard;
        Validate --> DeliveredValue["Output:<br/>Delivered User Value"];
    end

    subgraph "Accelerators: How We Go Fast"
        A1["Debate Vigorously"];
        A2["Make it Concrete"];
        A3["Announce Intent"];
        A4["Plan is a Hypothesis"];
    end

    Governance -.->|Govern & Unblock| Process;
    Accelerators -.->|Optimize & Accelerate| Process;
```

---

## The Core Principles

### 1. We Defer to Expertise
- **The Rule:** We recognize our distinct areas of primary ownership.
  - **On matters of human-centered design (UX, UI, user workflow, and the ultimate interpretation of the JTBD), I will defer to you.** You are the authority on the user's experience.
  - **On matters of implementation (code architecture, performance, security, and maintainability), you will defer to me.** I am the authority on the technical execution.
- **How We Stay Accountable:** This is our ultimate tie-breaker. After vigorous debate, the owner of the domain makes the final call. We will respect that decision and commit to it fully.

### 2. The User's Job is Our North Star
- **The Rule:** We will not begin significant work until we can clearly articulate *what job the user is trying to do* and *why it matters*. All work is measured against its ability to help the user make progress.
- **How We Stay Accountable:** This is the focus of our initial "huddle." While you are the final arbiter (per Principle 1), we share the responsibility of asking "why" and ensuring we're solving the right problem.

### 3. Debate Ideas Vigorously, Respect People Unconditionally
- **The Rule:** The best ideas must win. We will engage in rigorous, critical debate of all proposals. This criticism is always directed at the idea, never the person.
- **How We Stay Accountable:** We use phrases like, "Help me understand the trade-offs..." knowing that at the end of the debate, Principle 1 will guide the final decision.

### 4. Make the Abstract Concrete
- **The Rule:** We avoid prolonged abstract discussions by quickly creating tangible artifacts for debate: pseudocode, API drafts, or diagrams.
- **How We Stay Accountable:** If we find ourselves going in circles, either of us can call for a "concreteness check" to ground the conversation.

### 5. Announce Intent Before Action
- **The Rule:** The person "at the keyboard" will announce their next logical step *before* diving deep into implementation to maintain alignment and enable real-time feedback.
- **How We Stay Accountable:** A simple "Next, I'm going to..." before starting a task. This creates a window for feedback and prevents rework.

### 6. The Plan is a Hypothesis, Not a Contract
- **The Rule:** We have the freedom to propose changes to the plan if implementation reveals a better way to solve the user's job or a more elegant technical path.
- **How We Stay Accountable:** We encourage observations like, "I know we planned X, but I'm seeing an opportunity for Y. Can we look at this?" This prioritizes the best outcome over the initial plan.

To start the server for development, run:

```bash
npm start
```

This will start the server using `nodemon`, which will automatically restart the server when files change.

### Running with Docker

For universal portability, you can run Decision Tapestry using Docker. This method does not require a local Node.js installation.

**1. Build the Docker image:**

From the root directory, run:

```bash
docker build -t decision-tapestry .
```

**2. Run the Docker container:**

To run the server and have it watch the `decisions.yml` from a project on your local machine, you need to mount the project directory as a volume.

From your project directory (the one containing your `decisions.yml`), run:

```bash
docker run -p 8080:8080 -v "$(pwd):/app/user_data" --name decision-tapestry-container decision-tapestry
```

This command does the following:
- `-p 8080:8080`: Maps port 8080 on your machine to port 8080 in the container.
- `-v "$(pwd):/app/user_data"`: Mounts your current working directory (e.g., `/path/to/your/project`) into a `/app/user_data` directory inside the container.
- `--name decision-tapestry-container`: Gives the container a memorable name.

The application will then be available at `http://localhost:8080`.

## Automated Releases

This project uses [semantic-release](https://semantic-release.gitbook.io/) for fully automated versioning, changelog generation, and publishing to npm and GitHub.

### How to Trigger a Release
- **Releases are triggered automatically** when commits are pushed to the `main` branch that follow [Conventional Commits](https://www.conventionalcommits.org/) format.
- The release process will:
  - Analyze commit messages to determine the next version.
  - Update `CHANGELOG.md` with release notes.
  - Publish the new version to npm (if configured).
  - Push changelog and version updates to GitHub.
  - Create a GitHub release with release notes.

### Manual Release (for testing)
You can run a release locally (dry run) to see what would happen:

```bash
yarn release --dry-run
```

To perform a real release (requires proper environment variables for npm and GitHub tokens):

```bash
yarn release
```

See the `package.json` for configuration details.

## How it Works 

## How to Use the Backlog and Decision Log

All backlog items and decisions are now managed in a single file: `decisions.yml`.
- The `backlog:` section contains open tasks, ideas, and features.
- The `decisions:` section contains completed, promoted, or superseded decisions.

> **New!** For new projects, start from the provided template: `decisions.template.yml`.
> This file contains example entries and comments to help you structure your backlog and decisions.

Update your backlog and promote items to decisions as you work. No separate PRODUCT_BACKLOG.md is needed. 