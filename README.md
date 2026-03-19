# BurgerOps

BurgerOps is a multi-tenant SaaS application for managing restaurant operations. It models how real restaurant brands track locations, assets, vendors, and operational incidents across multiple business units.

The system is designed to reflect real-world workflows where maintenance issues, equipment failures, and operational disruptions are tracked, assigned, and resolved.

---

## Why This Project Exists

This project was built to bridge the gap between learning concepts and building real systems. Rather than focusing on small, isolated exercises, BurgerOps is designed to reflect how a production application is structured.

The focus is on modeling realistic data relationships, implementing practical workflows, and maintaining a clear, scalable architecture. It is being developed incrementally, with each feature building toward a system that behaves like a real-world SaaS product.

---

## Overview

Each tenant represents a restaurant brand. Within each tenant:

* Multiple locations are managed independently
* Each location contains assets (equipment)
* Vendors are shared across the tenant
* Tickets represent operational issues tied to locations and assets

This structure allows BurgerOps to simulate a realistic operations environment similar to enterprise tools used in multi-location businesses.

---

## Tech Stack

* Next.js (App Router)
* TypeScript
* PostgreSQL (Neon)
* React Server and Client Components
* Tailwind CSS

---

## Core Features

### Multi-Tenant Routing

Dynamic routing using `/[tenant]/...` allows each business to operate in isolation while sharing the same application.

### Location Management

Each tenant contains multiple locations, each with its own operational context.

### Asset Tracking

Assets are tied to specific locations and include:

* Name
* Type
* Status
* Installation date

### Vendor Management

Vendors belong to a tenant and can service multiple locations. Each vendor includes:

* Category
* Contact information
* SLA level
* Active status

### Ticket System

The core of the application is the ticketing system for operational incidents.

Tickets include:

* Title and description
* Category and priority
* Location (required)
* Asset (optional)
* Vendor (optional)
* Due date

### Ticket Creation Workflow

* Server-side validation ensures data integrity
* Asset must belong to selected location
* Vendor must belong to tenant
* Status is automatically assigned:

  * `open`
  * `vendor_assigned`

### Ticket Updates

Each ticket automatically generates an entry in `ticket_updates` when created, forming the basis for a future activity log.

### Work Orders

Work orders are tied to tickets and vendors and track:

* Scheduling
* Labor cost
* Parts cost
* Status

---

## Architecture

The application separates responsibilities between server and client components.

### Server Responsibilities

* Database queries
* Data validation
* Ticket creation (server actions)

### Client Responsibilities

* Form interactivity
* Dynamic filtering (location → assets)
* User input handling

### Component Structure

* `page.tsx` handles data loading and server logic
* `new-ticket-form.tsx` handles UI and interactivity

---

## Database Design

Core tables:

* tenants
* locations
* assets
* vendors
* tickets
* ticket_updates
* work_orders

Relationship model:

Tenant
→ Locations
→ Assets
→ Tickets

Tenant
→ Vendors

This structure enforces clear boundaries and reflects real-world operational systems.

---

## Demo Data

The database is seeded with a large dataset including:

* 100+ tenants
* Hundreds of locations
* Hundreds of vendors
* Hundreds of assets
* Hundreds of tickets and work orders

The dataset is designed to simulate realistic operational scenarios across multiple restaurant brands.

Seed file:

* `seed.sql` (reset-safe dataset)

---

## Setup

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open in browser:

```
http://localhost:3000
```

---

## Database Configuration

The application connects to PostgreSQL via:

```
DATABASE_URL
```

Database is hosted on Neon.

---

## Current Functionality

* Multi-tenant navigation
* Tenant dashboards
* Ticket list view
* Ticket detail page
* Ticket creation workflow
* Server-side validation
* Asset validation per location
* Vendor validation per tenant
* Ticket update logging
* Dynamic asset filtering in form

---

## Roadmap

### Authentication and Access Control

* User login and session handling
* Tenant-based access restrictions
* Role-based permissions

### Error Handling and Validation

* Improved user-facing error messages
* Client-side validation feedback
* Robust server-side error handling

### Ticket System Enhancements

* Edit ticket workflow
* Status update controls
* Assignment tracking
* Ticket comments and activity history

### Analytics and Reporting

* KPI dashboards per tenant
* Ticket trends and metrics
* Vendor performance tracking

### API Layer

* REST or GraphQL API
* External integrations

---

## Known Limitations

* Asset names are currently duplicated across locations
  Planned improvement: make asset names location-specific in seed data

* No authentication implemented yet
  Application is currently open for demo purposes

* Limited UI error feedback
  Errors are handled server-side but not fully surfaced to users

---

## What This Project Demonstrates

BurgerOps showcases practical, real-world software development beyond basic tutorials.

### Full-Stack Development

* End-to-end feature development from database to UI
* Integration of server actions with database operations
* Clear separation of concerns between layers

### Scalable Architecture

* Multi-tenant design with data isolation
* Relational modeling with meaningful constraints
* Maintainable component structure

### Database Design

* Normalized schema with multiple relationships
* Enforcement of data integrity across entities

### Backend Logic

* Server-side validation for all critical operations
* Safe handling of optional relationships
* Consistent data insertion patterns

### Product-Oriented Thinking

* Built around a real operational use case
* Structured workflows and system behavior
* Incremental, roadmap-driven development

### Modern Development Practices

* Next.js App Router architecture
* TypeScript usage
* Cloud database integration

### Iterative Development

* Continuous refactoring and improvement
* Transition from monolithic to component-based design
* Built with future expansion in mind

This project reflects the ability to design, build, and evolve a production-style SaaS application.

---

## Notes

This project is actively evolving. Features and structure will continue to improve as additional capabilities are implemented.
