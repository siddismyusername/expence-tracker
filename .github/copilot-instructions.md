# FinTrack - Family Expense Tracker

## Architecture Overview

This is a **full-stack MERN application** with a traditional multi-page architecture (not SPA). The server serves static HTML files from the root directory, with client-side JavaScript modules handling interactivity.

**Key Components:**
- **Backend**: Express.js API (`server.js`, `routes/`, `models/`, `middleware/`)
- **Frontend**: Vanilla JavaScript ES6 modules (`js/`) + static HTML pages
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens stored in localStorage, passed via `x-auth-token` header

## Data Model & Relationships

**User → Family (Optional Many-to-One)**
- Users can belong to 0 or 1 family via `User.familyId` (ObjectId reference)
- Families track members array and have a shareable `familyId` string (e.g., `fam_abc123`)

**Expense Ownership:**
- `userId`: The user who created/paid for the expense
- `amount`: Display amount in user's preferred currency
- `amountUSD`: Stored amount in USD for consistent conversion
- `familyId`: Set to user's family (whether personal or common expense)
- `isCommon`: Boolean flag indicating if expense is marked as "common"

**Critical Pattern**: When user has a family, ALL expenses (personal + common) are associated with `familyId`. This allows family total to include everyone's spending.

**Currency Handling**: Amounts are stored in USD and converted to user's preferred currency for display using conversion rates in frontend JavaScript.

## Authentication Flow

1. **Login/Register** (`routes/auth.js`): Returns JWT token with payload `{ user: { id: userId } }`
2. **Token Storage**: Client stores token in `localStorage.setItem('token', token)`
3. **Protected Routes**: Middleware `authMiddleware.js` validates `x-auth-token` header, attaches `req.user.id`
4. **Client API**: `js/api.js` exports centralized API client with `getHeaders()` helper that includes token

**Important**: All client-side JS files use ES6 modules (`type="module"` in HTML script tags)

## Development Workflow

**Environment Setup:**
- Create `.env` file with: `MONGO_URI`, `JWT_SECRET`, `PORT` (defaults: localhost MongoDB, port 5000)
- Run `npm install` to install dependencies

**Running the App:**
- Development: `npm run dev` (uses nodemon for auto-restart)
- Production: `npm start`
- Database must be running (local MongoDB or Atlas connection string)

**No Build Step**: Frontend uses CDN libraries (Tailwind CSS, Chart.js) and native ES6 modules - no bundler required

## Frontend Architecture Patterns

**Page Structure:**
- Each HTML page includes navbar via `navbar.js` module which injects navbar HTML
- Shared theme toggle logic in navbar handles dark/light mode via `localStorage.getItem('theme')`
- Tailwind config embedded in each HTML file's `<script>` tag with custom color tokens

**API Client Pattern** (`js/api.js`):
```javascript
export const api = {
  auth: { login, register, me },
  family: { create, join, leave, members },
  expenses: { add, list, delete }
}
```
All page-specific JS files import from `./api.js` (relative path required for ES6 modules)

**Client-Side Routing:**
- No router - pages use `window.location.href` for navigation
- Protected pages check authentication on load via `api.auth.me()` call
- Server default route (`/`) serves `dashboard.html`

## Key Conventions

**Error Handling:**
- Backend: `try/catch` blocks return `res.status(500).send('Server error')` with `console.error(err.message)`
- Frontend: Catch API errors and display in `errorMessage` elements with `.classList.remove('hidden')`

**Naming:**
- Routes use kebab-case: `/api/auth/register`, `/api/family/join`
- Models use PascalCase: `User`, `Family`, `Expense`
- Client files use kebab-case: `add-expense.js`, `dashboard.html`

**Family ID Generation:**
- Use custom generator in `routes/family.js`: `'fam_' + Math.random().toString(36).substr(2, 9)`
- Despite uuid package being installed, it's not consistently used

**Mongoose Patterns:**
- Use `.findById()` for single docs, `.findOne()` for queries
- Password hashing with bcryptjs (salt rounds: 10) before save in auth routes
- Populate references when needed (though not currently implemented for expense user details)

## Common Gotchas

1. **Module Paths**: Client JS uses relative paths (`./api.js`) not absolute (`/js/api.js`)
2. **Static File Serving**: Server serves from root with `express.static(path.join(__dirname, '.'))` - all HTML/CSS/JS accessible directly
3. **Expense Deletion**: Uses deprecated `.remove()` method - should use `.deleteOne()` or `findByIdAndDelete()`
4. **User Display Names**: Dashboard charts show user IDs instead of names (TODO: needs population or mapping)
5. **Theme**: Dark theme is default - files include both Tailwind config and separate `dark-theme.css`

## Testing & Debugging

- No automated tests currently configured
- Manual testing workflow: Register → Create/Join Family → Add Expenses → View Dashboard
- Check browser console for client errors, server console for API errors
- MongoDB connection errors appear on server startup
