# Caviendoo

Caviendoo is a sophisticated Agricultural Intelligence and Geospatial Data platform. Currently focused on Tunisia (as the initial launch country), the platform specializes in high-fidelity fruit production data, interactive geographic mapping, and seasonal environmental analysis. As the project evolves, we plan to expand the platform to cover more countries and regions worldwide.

## Project Vision & Aesthetic

The platform is designed with a premium, data-driven aesthetic—combining dark editorial visuals with complex data visualization, aiming for a "National Geographic meets Bloomberg Terminal" feel.

## Key Features

- **Interactive Geospatial Mapping**: Custom D3.js-powered map rendering utilizing GeoJSON data to visualize regional metrics.
- **Dynamic Data Overlays**:
  - **Récoltes (Harvests)**: Fruit density and distribution across different regions.
  - **Stress-Hydrique (Water Stress)**: Aquifer depletion rates, sustainability metrics, and water scarcity indicators.
  - **Indice-UV (UV Index)**: Sun exposure tracking during critical harvest periods.
- **Internationalization (i18n)**: Full support for English, French, and Arabic (including full RTL layout support).
- **Extensive Data Models**: Tracking seasonal data, sustainability metrics (blue/green water usage), nutritional data, and cultural heritage for numerous fruit varieties.

## Tech Stack

- **Frontend**: Next.js 16+ (App Router), React, TypeScript, TailwindCSS
- **State Management**: Zustand
- **Data Visualization**: D3.js
- **Internationalization**: next-intl
- **Deployment**: Dockerized, hosted on VPS via Coolify

## Architecture

The application is architected to seamlessly transition from a static-data frontend to a fully integrated full-stack application:

- `caviendoo-frontend/`: Next.js frontend application.
- `caviendoo-api/`: Backend API and Data services.
- `caviendoo-admin/`: Admin dashboard.

Data flows through a dedicated service layer abstraction, which ensures UI components remain fully decoupled from the underlying data source. Currently operating on mock static data, this structure allows for a drop-in replacement with live API calls without needing to modify the React components.
