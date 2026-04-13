# MarketMint — Mini Amazon Clone

Full-stack e-commerce demo: browse products, manage a cart, check out with Stripe, and handle auth with session-backed Express and MongoDB. Email flows use **AWS SES** (when configured).

## Features

- Sign up / sign in with validation and flash messages
- Product listing, search, and product detail pages
- Cart (add, update quantity, remove)
- Product reviews (add, edit, delete) for signed-in users
- Checkout with **Stripe** (test mode)
- Order history and line-item cancellation
- CSRF protection on forms

## Tech stack

- **Runtime:** Node.js  
- **Server:** Express 5  
- **Views:** EJS  
- **Database:** MongoDB (Mongoose)  
- **Session store:** `connect-mongodb-session`  
- **Email:** AWS SES (`@aws-sdk/client-ses`)  
- **Payments:** Stripe  

## Prerequisites

- Node.js (v18+ recommended; project was developed with newer LTS)
- npm
- A **MongoDB** instance (e.g. MongoDB Atlas)
- AWS account with **SES** set up and a verified sender/domain (for signup emails)
- **Stripe** account (test keys) for checkout

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/aditinaik74/amazon-mini-clone.git
   cd amazon-mini-clone
   npm install
   ```

2. Copy environment template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your AWS credentials (and region) for SES.

3. **MongoDB:** Set `MONGODB_URI` in `.env` to your Atlas (or local) connection string. The app exits on startup if it is missing.

4. **Stripe:** Set `STRIPE_SECRET_KEY` in `.env` (use a **test** key for local development).

5. **SES “From” address:** Ensure the sender address used when sending mail matches an address or domain verified in SES (see `controller/email.js`).

## Run locally

```bash
npm start
```

Or:

```bash
node app.js
```

Open [http://localhost:3000/home](http://localhost:3000/home).

## Useful routes

| Path | Description |
|------|-------------|
| `/home`, `/products` | Home / product listing |
| `/products/search` | Search |
| `/product/:id` | Product detail & reviews |
| `/signup`, `/signin` | Auth |
| `/cart` | Cart (requires sign-in for actions) |
| `/checkout` | Checkout (requires sign-in) |
| `/orders` | Orders |

## Project layout (high level)

- `app.js` — Express app, session, CSRF, MongoDB connection  
- `routes/auth.js` — Main HTTP routes  
- `controller/` — Auth, products, orders, email  
- `models/` — Mongoose models (user, product, cart, order, SES client)  
- `views/` — EJS templates  
- `public/` — Static assets  
- `middelware/` — e.g. `isAuth`  

## Assignment PDFs (optional)

Course deliverables included in the repo:

- `ay5211_Services Relationship Document.pdf` — architecture & AWS services  
- `ay5211_Installatio and Execution .pdf` — install and run notes  

## Security reminders

- Do **not** commit `.env`, `*.pem`, or API keys. Use `.env.example` as a template only.  
- Rotate any credentials that were ever committed to git.  
- Use Stripe **test** keys locally; restrict IAM permissions for AWS in non-production environments.  
