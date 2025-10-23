# EVM Next.js Application

A Next.js application for Electronic Voting Machine simulation with Hindi/English support.

## Docker Setup

### Prerequisites
- Docker
- Docker Compose

### Quick Start

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Open your browser and go to `http://localhost:3000`

### Docker Commands

**Build the Docker image:**
```bash
docker build -t evm-app .
```

**Run the container:**
```bash
docker run -p 3000:3000 evm-app
```

**Run in detached mode:**
```bash
docker-compose up -d --build
```

**Stop the application:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f evm-app
```

### Development

For local development without Docker:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

### Features

- Hindi/English bilingual interface
- Dynamic ballot numbers based on election phase
- Audio feedback with splash and confetti sounds
- School bag symbol download on vote
- Responsive design with Tailwind CSS
- CSV-based candidate data management

### File Structure

```
├── app/
│   ├── api/candidates/     # API routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── public/
│   ├── assets/            # CSV data files
│   ├── audio/             # Audio files
│   └── *.png              # Images
├── Dockerfile
├── docker-compose.yml
└── next.config.ts
```

### Environment Variables

The application runs with default settings. No environment variables are required for basic functionality.

### Health Check

The Docker container includes a health check that verifies the application is responding on port 3000.