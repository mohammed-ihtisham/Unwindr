# Unwindr

A local discovery platform for exploring places in Cambridge, MA and Boston, MA. Unwindr helps users discover interesting locations based on their interests, save favorite places, and explore curated media associated with each location.

## 📚 Key Documents

- **[Design Document](final-design-doc.md)** - Final design documentation detailing the evolution from initial concept to MVP
- **[Video & Trace](final-video.md)** - Project video and [trace log](trace-log.md) of incoming actions
- **[Reflections](reflection.md)** - Project reflections on challenges, successes, and lessons learned

## Overview

Unwindr is a concept-driven backend application built with Deno and TypeScript. It provides a focused platform for place discovery, prioritizing exploration over user-generated content. The application uses OpenStreetMap data to provide comprehensive place information for the Cambridge and Boston areas.

## Features

### Core Functionality

- **User Authentication**: Secure user registration, login, and session management
- **Place Discovery**: Browse places in Cambridge and Boston with detailed information
- **Interest-Based Filtering**: Filter places based on user interests and preferences
- **Bookmarking**: Save favorite places for quick access
- **Media Library**: Browse curated media (images, etc.) associated with places
- **Likert Surveys**: Collect user preferences through structured surveys

### Key Design Decisions

- **Geographic Scope**: Focused on Cambridge, MA and Boston, MA for manageable data volume
- **Data Sources**: OpenStreetMap (free, open-source) instead of premium APIs
- **Provider-Curated Content**: Places and media are curated by providers, not user-generated
- **MongoDB Integration**: Optimized geospatial queries using MongoDB's GeoJSON format

## Tech Stack

- **Runtime**: [Deno](https://deno.com) (TypeScript runtime)
- **Database**: MongoDB (MongoDB Atlas)
- **Data Source**: OpenStreetMap (via Overpass API)
- **Language**: TypeScript
- **Architecture**: Concept-driven design pattern

## Architecture

Unwindr uses a concept-driven architecture where functionality is organized into:

1. **Concepts**: Self-contained, modular increments of functionality (e.g., `UserAuth`, `PlaceCatalog`, `Bookmark`)
2. **Synchronizations**: Rules that orchestrate interactions between concepts

### Core Concepts

- **UserAuth**: User registration, authentication, and session management
- **PlaceCatalog**: Place data management and geospatial queries
- **MediaLibrary**: Media metadata storage and retrieval
- **InterestFilter**: Interest-based place filtering
- **Bookmark**: User bookmark management
- **LikertSurvey**: Survey collection and analysis
- **Requesting**: HTTP request handling and API routing

### Directory Structure

```
Unwindr/
├── src/
│   ├── concepts/          # Concept implementations
│   │   ├── UserAuth/
│   │   ├── PlaceCatalog/
│   │   ├── MediaLibrary/
│   │   ├── InterestFilter/
│   │   ├── Bookmark/
│   │   ├── LikertSurvey/
│   │   └── Requesting/
│   ├── syncs/             # Synchronizations between concepts
│   ├── engine/            # Framework-provided engine
│   ├── utils/             # Utility functions
│   └── main.ts            # Application entry point
├── scripts/               # Data import and seeding scripts
├── design/                # Design documentation
├── context/               # Context tool history (immutable)
└── deno.json              # Deno configuration
```

## Prerequisites

- [Deno](https://deno.com) (latest version)
- MongoDB Atlas account (free tier works)
- Gemini API key (for LLM features, if using Context tool)
- Obsidian (optional, for viewing design documentation)

## Setup

### 1. Install Deno

Install Deno from the [official website](https://deno.com).

For VSCode users, consider installing the [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).

### 2. Clone the Repository

```bash
git clone https://github.com/mohammed-ihtisham/Unwindr.git
cd Unwindr
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=unwindr

# Server Configuration (optional, defaults shown)
PORT=10000
REQUESTING_BASE_URL=/api
REQUESTING_TIMEOUT=10000
REQUESTING_SAVE_RESPONSES=true

# Gemini API (optional, for Context tool)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Setup MongoDB Atlas

1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
2. Create a free M0 cluster
3. Configure network access to allow all IPs (for development)
4. Create a database user and get the connection string
5. Add the connection string to your `.env` file

### 5. Context Tool (Optional)

The Context tool is used for working with design documentation. If the `ctx` binary doesn't exist, you can compile it (the source location may vary depending on your setup). The `context/` directory contains immutable snapshots of all design documents and their history.

### 6. Build the Project

Generate imports for concepts and synchronizations:

```bash
deno run build
```

Or:

```bash
deno run --allow-read --allow-write --allow-env src/utils/generate_imports.ts
```

### 7. Seed Initial Data (Optional)

Import places from OpenStreetMap:

```bash
deno run --allow-all scripts/load-boston-cambridge.ts
```

Or use other seeding scripts in the `scripts/` directory as needed.

## Running the Application

### Start the Main Server (with Requesting concept)

This starts the server using the concept-driven architecture with the Requesting concept:

```bash
deno run start
```

Or:

```bash
deno run --allow-net --allow-write --allow-read --allow-sys --allow-env src/main.ts
```

The server will start on port 10000 by default (configurable via `PORT` environment variable) with the base URL `/api`.

### Start Concept Server (Alternative)

This starts a standalone concept server using Hono framework:

```bash
deno task concepts
```

Or:

```bash
deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api
```

This server runs on port 8000 by default and can be configured via command-line arguments.

## Testing

Run all tests:

```bash
deno test -A
```

Or use specific test tasks:

```bash
deno task test:user          # Test UserAuth concept
deno task test:place         # Test PlaceCatalog concept
deno task test:media-library # Test MediaLibrary concept
deno task test:interest-filter # Test InterestFilter concept
deno task test:bookmark      # Test Bookmark concept
deno task test:likert        # Test LikertSurvey concept
```

## API Usage

The application uses the `Requesting` concept which provides passthrough routes for direct access to concept actions. See the [Requesting README](src/concepts/Requesting/README.md) for details.

Example API endpoints (via passthrough):

- `POST /api/UserAuth/register` - Register a new user
- `POST /api/UserAuth/login` - Login a user
- `POST /api/PlaceCatalog/getPlacesInViewport` - Get places in a viewport
- `POST /api/Bookmark/bookmarkPlace` - Bookmark a place
- `POST /api/Bookmark/getUserBookmarks` - Get user's bookmarks

**Note:** All passthrough routes use `POST` method and the format is `/api/{ConceptName}/{actionName}`. The request body should be a JSON object matching the action's parameters.

## Development

### Adding New Concepts

1. Create a new directory under `src/concepts/YourConcept/`
2. Implement `YourConceptConcept.ts` following the concept pattern
3. Run `deno run build` to regenerate imports
4. Add tests in `YourConceptConcept.test.ts`

### Adding Synchronizations

1. Create a new file in `src/syncs/your-sync.ts`
2. Implement synchronizations following the sync pattern
3. Import and register in `src/syncs/syncs.ts`
4. The syncs will be automatically registered when the server starts

### Design Documentation

Design documents are stored in the `design/` directory:
- `design/concepts/` - Concept specifications
- `design/background/` - Architecture and implementation guides
- `design/brainstorming/` - Design exploration and notes

Use the Context tool to work with design documents:

```bash
./ctx prompt design/path/to/document.md
```

## Project History

This project evolved from an initial nationwide platform design to a focused local discovery app. Key changes:

- **Geographic scope**: Reduced from nationwide to Cambridge/Boston
- **Data source**: Switched from Google Maps API to OpenStreetMap
- **Feature focus**: Shifted from user contributions to exploration
- **Architecture**: Optimized for MongoDB geospatial queries

See [final-design-doc.md](final-design-doc.md) and [reflection.md](reflection.md) for detailed design evolution and project reflections.

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

See LICENSE file for details (if applicable).

## Acknowledgments

- Built as part of MIT 6.104 course
- Uses OpenStreetMap data (© OpenStreetMap contributors)
- Concept-driven architecture framework provided by course materials
