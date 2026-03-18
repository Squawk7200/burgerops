# 🍔 BurgerOps

BurgerOps is a multi-tenant SaaS application for managing restaurant operations, built with Next.js.

It simulates a real-world system where restaurant teams can track maintenance issues, manage vendors, and organize locations within a tenant-based architecture.

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- PostgreSQL (seeded database)
- React Server Components

---

##  Core Features

- Multi-tenant routing (`/[tenant]/...`)
- Tenant-scoped dashboards
- Ticket management (list view)
- Vendor management
- Location management
- Seeded relational database

---

## Architecture Highlights

- Dynamic tenant routing using Next.js App Router
- Data modeled around real business entities:
  - Tickets
  - Vendors
  - Locations
  - Tenants
- Structured for tenant isolation
- Modular, scalable page design

---

## In Progress

- Ticket detail pages
- Create ticket workflow
- Status updates (Open → In Progress → Closed)
- Vendor assignment to tickets
- Role-based access control

---

## Project Goal

To demonstrate the design and development of a real-world multi-tenant SaaS application, including:
- scalable architecture
- relational data modeling
- practical business workflows

---

## Local Development

```bash
npm install
npm run dev
