# Week 2 Checklist: Authentication Implementation

## Prerequisites

Before starting Week 2, you need to set up your database:

### Database Setup Options

#### Option 1: Vercel Postgres (Recommended for Production)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database" → "Postgres"
3. Name it "mood-tracker" or similar
4. Copy the connection strings:
   ```bash
   # From Vercel dashboard, copy these to .env.local:
   DATABASE_URL="postgres://..."
   DIRECT_URL="postgres://..."
   ```
5. Run the initial migration:
   ```bash
   npx prisma migrate dev --name init
   ```

#### Option 2: Local PostgreSQL (For Development)

1. Install PostgreSQL if not already installed:
   ```bash
   # macOS with Homebrew
   brew install postgresql@15
   brew services start postgresql@15

   # Or use Postgres.app from https://postgresapp.com/
   ```

2. Create the database:
   ```bash
   createdb mood_tracker
   ```

3. Your `.env.local` already has the local connection string:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mood_tracker"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5432/mood_tracker"
   ```

4. Run the migration:
   ```bash
   npx prisma migrate dev --name init
   ```

### OAuth Setup (Google)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.vercel.app/api/auth/callback/google` (production)
5. Copy Client ID and Client Secret to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="xxx"
   ```

### Email Provider Setup (Resend - Recommended)

1. Sign up at [Resend](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```bash
   EMAIL_SERVER="smtp://resend:YOUR_API_KEY@smtp.resend.com:587"
   EMAIL_FROM="noreply@your-domain.com"
   ```

## Week 2 Tasks

### Task 1: Auth Configuration
- [ ] Create `lib/auth.ts` with NextAuth config
- [ ] Configure Google OAuth provider
- [ ] Configure Email (Resend) provider
- [ ] Set up Prisma adapter
- [ ] Add session callbacks

### Task 2: Auth API Route
- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Export GET and POST handlers

### Task 3: Auth UI Pages
- [ ] Create `app/auth/signin/page.tsx` (sign in page)
- [ ] Create `app/auth/verify/page.tsx` (email verification)
- [ ] Create `app/auth/error/page.tsx` (error page)
- [ ] Style with Tailwind CSS

### Task 4: Route Protection
- [ ] Create `middleware.ts` for auth checks
- [ ] Redirect unauthenticated users to sign-in
- [ ] Redirect authenticated users away from auth pages
- [ ] Test protected routes

### Task 5: Type Extensions
- [ ] Create `types/next-auth.d.ts`
- [ ] Extend Session type to include user ID
- [ ] Ensure TypeScript recognizes custom session properties

### Task 6: Testing
- [ ] Test Google OAuth sign-in flow
- [ ] Test email magic link sign-in
- [ ] Test sign-out functionality
- [ ] Test route protection
- [ ] Verify sessions persist correctly

## Verification Steps

After completing Week 2, you should be able to:

1. ✅ Visit `http://localhost:3000`
2. ✅ Get redirected to `/auth/signin` (not authenticated)
3. ✅ Click "Sign in with Google" → authenticate → redirect to homepage
4. ✅ See your authenticated state
5. ✅ Sign out → get redirected back to sign-in page
6. ✅ Try email magic link → receive email → click link → authenticate
7. ✅ Session persists across page refreshes

## Useful Commands

```bash
# Start development server
npm run dev

# Check database with Prisma Studio
npx prisma studio

# View database schema
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

## Troubleshooting

### "Prisma Client could not find DATABASE_URL"
- Make sure `.env.local` exists and has `DATABASE_URL` set
- Restart your dev server after changing `.env.local`

### "Failed to connect to database"
- Check that PostgreSQL is running
- Verify connection string is correct
- Check firewall/network settings

### "OAuth Error: redirect_uri_mismatch"
- Make sure redirect URI in Google Console matches exactly
- Include `http://` or `https://` protocol
- No trailing slashes

### "Email not sending"
- Verify Resend API key is correct
- Check EMAIL_FROM domain is verified in Resend
- Check Resend dashboard for delivery logs

---

**Ready to Start Week 2?** Just let me know and we'll begin implementing authentication!
