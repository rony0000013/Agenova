
# Full-Stack Integration Guide: Stellar Freighter Wallet Auth, Supabase DB & NextJS-NestJS Architecture

> **Architecture Blueprint**: This guide details how to build a dApp with **Stellar Freighter Wallet Chrome Extension Authentication**, **Supabase PostgreSQL (Prisma ORM)**, and **NestJS + Next.js** cross-tier environment linkage.

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Step 1: Setting Up Freighter Chrome Extension Auth](#step-1-setting-up-freighter-chrome-extension-auth)
3. [Step 2: Backend Non-Custodial Wallet Authentication](#step-2-backend-non-custodial-wallet-authentication)
4. [Step 3: Supabase PostgreSQL Database Integration (Prisma ORM)](#step-3-supabase-postgresql-database-integration-prisma-orm)
5. [Step 4: Linking Frontend to Backend &amp; Unauthenticated Data Fetching](#step-4-linking-frontend-to-backend--unauthenticated-data-fetching)
6. [Step 5: Verification Checklist &amp; Common Gotchas](#step-5-verification-checklist--common-gotchas)

---

## 1. Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                  Freighter Wallet Extension                 │
 │                  (Chrome / Web Browser)                     │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Signs Auth Request / Gets Public Key (G...)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     Next.js Frontend                        │
 │  - Freighter Helper (freighter.ts)                          │
 │  - Dedicated Sign-In Page (/signin)                         │
 │  - Unauthenticated Public Fetching + Authenticated Bearer   │
 └──────────────────────────────┬──────────────────────────────┘
                                │ REST API (NEXT_PUBLIC_API_URL = http://localhost:3001/api)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     NestJS Backend                          │
 │  - CORS Allowed Origins (http://localhost:3000)             │
 │  - Auth Controller (@Post('auth/stellar-login'))            │
 │  - PrismaService (Supabase PostgreSQL Client)               │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Pooler / Direct Connection
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                 Supabase PostgreSQL DB                      │
 │  - users, events, tickets, logs                             │
 └─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Setting Up Freighter Chrome Extension Auth

### 1.1 Install `@stellar/freighter-api`

In your Next.js frontend project:

```bash
npm install @stellar/freighter-api
```

### 1.2 Create `frontend/src/lib/freighter.ts`

This module encapsulates browser detection, extension permissions, and public key retrieval:

```typescript
import { isConnected, isAllowed, setAllowed, getUserInfo } from '@stellar/freighter-api';

export class FreighterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FreighterError';
  }
}

/** Check if the Freighter Chrome extension is installed in the browser */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const res: any = await isConnected();
    if (typeof res === 'boolean') return res;
    if (res && typeof res.isConnected === 'boolean') return res.isConnected;
    return typeof window !== 'undefined' && !!(window as any).freighter;
  } catch {
    return typeof window !== 'undefined' && !!(window as any).freighter;
  }
}

/** Trigger Freighter popup, request permission, and return user's Stellar Public Key (G...) */
export async function connectFreighter(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterError(
      'Freighter Chrome Extension not detected. Please install Freighter from https://www.freighter.app/'
    );
  }

  try {
    const allowed: any = await setAllowed();
    if (allowed && allowed.error) {
      throw new FreighterError(allowed.error);
    }

    const userInfo: any = await getUserInfo();
    if (!userInfo || !userInfo.publicKey) {
      throw new FreighterError('Could not retrieve public key from Freighter wallet.');
    }

    return userInfo.publicKey;
  } catch (err: any) {
    if (err instanceof FreighterError) throw err;
    throw new FreighterError(err.message || 'Failed to connect Freighter wallet.');
  }
}
```

### 1.3 Create Dedicated `/signin` Page (`frontend/src/pages/signin.tsx`)

Ensure authentication is isolated to Stellar Wallet ID sign-in:

```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { connectFreighter } from '../lib/freighter';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function SignInPage() {
  const router = useRouter();
  const { loginWithWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFreighterConnect = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Trigger Freighter Chrome Extension handshake
      const publicKey = await connectFreighter();

      // 2. Authenticate with backend using public key
      await loginWithWallet(publicKey);

      // 3. Redirect to dashboard on success
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Freighter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <h1>Sign In with Stellar Wallet</h1>
      {error && <div className="error-banner">{error}</div>}
      <button className="btn btn-primary" onClick={handleFreighterConnect} disabled={loading}>
        {loading ? 'Connecting Wallet...' : 'Connect Freighter Wallet'}
      </button>
    </div>
  );
}
```

---

## Step 2: Backend Non-Custodial Wallet Authentication

### 2.1 NestJS Auth Controller (`backend/src/auth/auth.controller.ts`)

Create a dedicated endpoint `@Post('stellar-login')` that verifies the Stellar public key (`G...`), upserts the user record, and issues a session token:

```typescript
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { DatabaseService } from '../database.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly db: DatabaseService) {}

  @Public()
  @Post('stellar-login')
  async stellarLogin(@Body() payload: { walletAddress: string; role?: string; name?: string }) {
    const address = (payload.walletAddress || '').trim();

    // 1. Validate Stellar Public Key format
    if (!address || !address.startsWith('G') || address.length < 30) {
      throw new BadRequestException('Valid Stellar Public Key (starting with G) is required');
    }

    // 2. Find existing user or register new user non-custodially
    let user = Array.from(this.db.users.values()).find(
      u => u.walletAddress.toLowerCase() === address.toLowerCase()
    );

    if (!user) {
      const role = (payload.role || 'attendee') as any;
      const username = payload.name
        ? payload.name.toLowerCase().replace(/\s+/g, '_')
        : `stellar_${address.substring(1, 7).toLowerCase()}`;
      const userId = `usr-stl-${Date.now()}`;

      user = {
        id: userId,
        username,
        walletAddress: address,
        role,
        isSubscribed: role === 'organizer',
      };
    
      // Persist user to Supabase PostgreSQL DB
      await this.db.saveUserToSupabase(user);
    }

    return {
      token: 'mock-jwt-token-xyz-' + user.id,
      user: {
        ...user,
        name: user.username,
        email: `${user.username}@stellar.id`,
      },
    };
  }
}
```

---

## Step 3: Supabase PostgreSQL Database Integration (Prisma ORM)

### 3.1 `backend/prisma/schema.prisma`

Configure dual connection strings (`url` for pooled runtime connection, `directUrl` for migrations):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String   @id @default(uuid())
  username      String   @unique
  walletAddress String
  role          String   @default("attendee")
  isSubscribed  Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  events        Event[]
  tickets       Ticket[]

  @@map("users")
}

model Event {
  id                Int      @id @default(autoincrement())
  title             String
  description       String
  date              String
  venue             String
  category          String   @default("Concert")
  organizer         String
  organizerWallet   String
  priceGeneral      Float
  priceVIP          Float
  maxTickets        Int
  ticketsSold       Int      @default(0)
  settled           Boolean  @default(false)
  stellarContractId String?
  createdAt         DateTime @default(now())

  @@map("events")
}
```

### 3.2 `backend/.env` Configuration

Set your Supabase IPv4 transaction pooler string and direct session connection string:

```env
# Shared Transaction Pooler (Used for queries)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session Direct Connection (Used for schema push / migrations)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### 3.3 Apply Schema & Seed Database

```bash
cd backend
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

---

## Step 4: Linking Frontend to Backend & Unauthenticated Data Fetching

### 4.1 CORS Configuration in NestJS (`backend/src/main.ts`)

Allow requests from the frontend URL (`http://localhost:3000`):

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

### 4.2 Frontend Central Config (`frontend/src/lib/config.ts`)

```typescript
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  contractId: process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID || 'CDUHFTZNWCSV5EB4R3VZQFYG7XPLH7HNONOSTY22PAGFUNCXJN3YEFYX',
};
```

### 4.3 Unauthenticated Public Data Loading (`frontend/src/pages/index.tsx`)

**CRITICAL RULE**: Do **NOT** block public data fetching with `if (!token) return;`. Public events should load whether the user is signed in or browsing unauthenticated:

```typescript
const loadData = useCallback(async () => {
  setLoading(true);
  try {
    // 1. Fetch public events unconditionally (NO token required)
    const evsRes: any = await api.getEvents(token || undefined);
    const evsList = Array.isArray(evsRes) ? evsRes : (evsRes?.events || []);
    setEvents(evsList);

    // 2. Fetch user-specific tickets ONLY when token exists
    if (token) {
      const tixRes: any = await api.getMyTickets(token);
      setMyTickets(Array.isArray(tixRes) ? tixRes : []);
    }
  } catch (err) {
    console.error('Failed to load data from backend:', err);
  } finally {
    setLoading(false);
  }
}, [token]);
```

---

## Step 5: Verification Checklist & Common Gotchas

| Feature                          | Verification Step                                                                 | Common Gotcha to Avoid                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Freighter Extension**    | Install Freighter Chrome Extension from[freighter.app](https://www.freighter.app/) | If missing, handle`isFreighterInstalled()` gracefully and show clear download CTA.                 |
| **Stellar Address Format** | Public Key must start with letter`G` and be 56 characters long                  | Always validate`address.startsWith('G') && address.length >= 30` on backend before authenticating. |
| **Supabase Connection**    | Run`npx prisma db push` to create tables                                        | Ensure`%2F` URL encoding for special characters in Supabase database passwords.                    |
| **Public Data Access**     | Open`http://localhost:3000` in Incognito mode                                   | Make sure`loadData()` fetches `api.getEvents()` even when `token` is `null`.                 |
| **CORS Errors**            | Check browser console for`Access-Control-Allow-Origin` errors                   | Verify`CORS_ORIGIN=http://localhost:3000` matches Next.js port in `backend/.env`.                |
