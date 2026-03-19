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

---

### Location Management

Each tenant contains multiple locations, each with its own operational context.

---

### Asset Tracking

Assets are tied to specific locations and include:

* Name
* Type
* Status
* Installation date

---

### Vendor Management

Vendors belong to a tenant and can service multiple locations. Each vendor includes:

* Category
* Contact information
* SLA level
* Active status

---

### Ticket System

The core of the application is the ticketing system for operational incidents.

Tickets include:

* Title and description
* Category and priority
* Location (required)
* Asset (optional)
* Vendor (optional)
* Due date

---

### Ticket Creation Workflow

* Server-side validation ensures data integrity
* Asset must belong to selected location
* Vendor must belong to tenant
* Status is automatically assigned:

  * `open`
  * `vendor_assigned`

---

### Ticket Detail System (Enhanced)

The ticket detail page now acts as the operational control center.

Includes:

* Full ticket metadata display
* Status management (dropdown update)
* Vendor assignment / reassignment
* Timeline tracking
* Work order creation and visibility

Supported statuses:

* `open`
* `vendor_assigned`
* `scheduled`
* `in_progress`
* `resolved`
* `closed`

---

### Activity Timeline (New)

Each ticket now maintains a full activity log.

Tracked events include:

* Ticket creation
* Status changes
* Vendor assignment / removal
* Work order creation
* System-triggered updates

All activity is stored in:

```
ticket_updates
```

This creates a complete audit trail of ticket lifecycle events.

---

### Work Orders (Enhanced)

Work orders are tied to tickets and vendors and track:

* Scheduling
* Labor cost
* Parts cost
* Status
* Notes

Work orders can now be created directly from the ticket detail page.

---

### Automated Workflow Logic (New)

The system now includes state-driven behavior.

When a work order is created:

* `scheduled` → ticket status becomes `scheduled`
* `in_progress` → ticket status becomes `in_progress`

Additionally:

* These changes are automatically logged in the activity timeline
* Tickets now reflect real operational state without manual updates

This introduces behavior similar to real-world operations platforms.

---

## Architecture

The application separates responsibilities between server and client components.

### Server Responsibilities

* Database queries
* Data validation
* Ticket creation (server actions)
* Work order creation
* Automated status updates

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

Tickets
→ Work Orders
→ Updates (timeline)

---

## Demo Data

The database is seeded with a large dataset including:

* 100+ tenants
* Hundreds of locations
* Hundreds of vendors
* Hundreds of assets
* Hundreds of tickets and work orders

Seed file:

* `seed.sql`

---

## Setup

```bash
npm install
npm run dev
```

---

## Roadmap

* Lock ticket status based on work orders
* Build dashboard metrics
* Authentication and roles
* Improved validation and error handling

---

## Notes

This project is actively evolving.