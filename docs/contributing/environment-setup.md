# Environment Setup

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/)
- [PNPM](https://pnpm.io/installation)

## Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/dynamicabot/dynamica-v2.git
   ```

2. Change to the project directory:

   ```sh
   cd dynamica-v2
   ```

3. Install the project dependencies:

   ```sh
    pnpm install
   ```

4. Start the database:

   ```sh
   docker-compose up -d
   ```

5. Provide the environment variables:

   ```sh
   cp .env.example .env
   ```

6. Start the development server:

   ```sh
    pnpm dev
   ```
