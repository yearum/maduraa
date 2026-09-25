# API Specification — Initial Baseline

> This document records the initial contract for the application. Exact request/response
> fields should be finalized together with the backend implementation.

Base URL:

`/api/v1`

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /auth/login | Login user |
| POST | /auth/logout | Logout user |
| GET | /auth/session | Get current session |

## Categories

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /categories | List categories |
| POST | /categories | Create category |
| PUT | /categories/:id | Update category |
| DELETE | /categories/:id | Delete category |

## Products

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /products | List products |
| POST | /products | Create product |
| PUT | /products/:id | Update product |
| DELETE | /products/:id | Delete product |

## Transactions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /transactions | Create transaction and update stock |
| GET | /transactions | List transactions |

## Reports / Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /dashboard/summary | Dashboard summary |
| GET | /reports/sales | Sales/revenue report |

Authentication, validation, authorization, error format, pagination, and exact schemas remain implementation details to be finalized.
