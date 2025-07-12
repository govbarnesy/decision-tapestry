# Installation Guide

## Requirements

- **Node.js 20.0.0 or higher** (required for all dependencies)
- **npm** or **yarn** for package management

### Why Node.js 20+?
This project uses modern JavaScript features and dependencies that require Node.js 20+:
- `commander@14.0.0` requires Node.js >=20
- `marked@13.0.2` requires Node.js >=18  
- Various other dependencies require Node.js 18+

## Installation Methods

### Global Installation (Recommended)
```bash
npm install -g decision-tapestry
```

### Using npx (No Installation Required)
```bash
# Run commands without installing globally
npx decision-tapestry init
npx decision-tapestry start
npx decision-tapestry validate
```

### Local Development Setup
```bash
# Clone the repository
git clone https://github.com/your-username/decision-tapestry.git
cd decision-tapestry

# Install dependencies
npm install

# Run locally
npm run cli init
npm run start
```

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