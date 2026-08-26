<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Technical Directives & Coding Standards

## 0. Active Skills Directory

- `.agents/skills/prisma-composer/.SKILL.md` (Prisma Database Operations)
- `.agents/skills/architecture/SKILL.md` (Clean Architecture & Zod Server Actions)

## 1. Context & Architecture Overview

This project is a **Multi-Tenant SaaS System for Local Retail Stores (Warung)** built with Next.js App Router, Prisma ORM, Neon PostgreSQL, Shadcn UI, and PWA capabilities.

### User Roles & Scopes

1. **SUPERADMIN**: Global platform management, cross-tenant system access.
2. **OWNER**: Single-tenant store operations (POS, inventory, price adjustments, stock opname, supplier assignment).
3. **SUPPLIER**: Vendor portal scope (view product stock, inventory levels, supplier report).

---

## 2. Mandatory Tech Stack & Libraries

- **Framework**: Next.js (App Router, Server Actions, Route Handlers).
- **Database**: Neon PostgreSQL (Serverless) via Prisma ORM.
- **Styling**: Tailwind CSS + Shadcn UI (Lucide Icons for iconography).
- **Validation**: `zod` for all form validations and Server Action payload parsing.
- **State Management**: `zustand` (for POS Cart state & offline queue).
- **PWA/Hardware**: `@ducanh2912/next-pwa`, Web Bluetooth API (ESC/POS) for thermal printing.

---

## 3. UI/UX Design System & Mobile-First Reference (CRITICAL)

Before generating any new UI component or page, you **MUST** read `src/app/admin/layout.tsx` and `src/app/admin/products/page.tsx` as your design baseline.

**Design Rules:**

- **Follow the UI/UX in 'rootproject/refference/refference.jfif' for the design system.**.
- **Mobile-First Wrapper**: All main layouts must use `<div className="max-w-md mx-auto min-h-screen relative shadow-xl overflow-hidden flex flex-col">` to simulate a mobile app experience on desktop browsers.
- **Color Palette**: Primary brand color is `slate-900` for headers and primary buttons. Backgrounds are `slate-50` or `white`. Error states use `red-500`.
- **Border Radius**: Use `rounded-xl` for cards, inputs, and standard buttons. Use `rounded-full` for Floating Action Buttons (FAB).
- **Navigation**: Rely on Fixed Bottom Navigation for primary routing. Avoid complex desktop sidebars.
- **Touch Targets**: All clickable elements (buttons, links, icon buttons) must have a minimum interactive area equivalent to `p-2` or `48x48px`.

---

## 4. Strict Rules & Clean Code Guardrails

### A. Multi-Tenancy Security (FATAL BUG IF VIOLATED)

- **NEVER** expose data without validating `storeId`.
- Every database query for tenant-specific tables (`Product`, `Order`, `StockOpname`, `Supplier`) **MUST** include `where: { storeId }`.

### B. Clean Architecture & Zod

- **NO `any` TYPE IS ALLOWED.**
- **Server Actions**: All Server Actions must validate inputs using `zod` schemas before executing Prisma queries.
- **Directory Structure**:
  - `src/lib/validations/` -> Store all Zod schemas here (e.g., `product.schema.ts`).
  - `src/actions/` -> Store all Server Actions here, grouped by domain.
  - `src/components/ui/` -> Shadcn primitives only.
  - `src/components/modules/` -> Domain-specific business logic components.

### C. Error Handling

- Never crash the client. Server Actions must return standardized objects: `{ success: boolean, data?: any, error?: string }`.
