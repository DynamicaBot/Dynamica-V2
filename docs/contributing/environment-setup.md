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

> The Discord bot token can be obtained by creating a new bot application on the [Discord Developer Portal](https://discord.com/developers/applications).

6. Start the development server:

   ```sh
    pnpm dev
   ```

The terminal will display the invite URL for the bot, you can invite the bot to your server using that URL.
