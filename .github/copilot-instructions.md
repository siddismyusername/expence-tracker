# FinTrack - Family Expense Tracker

## Architecture Overview

This is a **full-stack MERN application** using **3-tier layered architecture** (Presentation → Application → Data Access). The server serves static HTML files from the root directory, with client-side JavaScript modules handling interactivity.

**Key Architecture Layers:**
- **Presentation**: HTML pages + vanilla JavaScript ES6 modules (`js/`)
- **Application**: Routes (`routes/`) → Controllers (`controllers/`) → Services (`services/`)
- **Data Access**: Repositories (`repositories/`) → Models (`models/`) → Database (`database/`)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens stored in localStorage, passed via `x-auth-token` header

**Critical Pattern**: ALL database operations go through Repository layer - no direct Model queries in Controllers or Services. This provides centralized database management perfect for course project demonstrations.

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

**Currency Handling**: Amounts are stored in USD (`amountUSD`) and converted to user's preferred currency for display using conversion rates in ExpenseService.

## Layered Architecture Pattern

### Request Flow
```
Client JS → Routes → Middleware → Controller → Service → Repository → Model → Database
```

**Example - Add Expense**:
1. `js/add-expense.js` calls `api.expenses.add()`
2. `routes/expenses.js` routes to `ExpenseController.createExpense()`
3. Auth middleware validates JWT token
4. `ExpenseController` extracts data, calls `ExpenseService.createExpense()`
5. `ExpenseService` performs business logic (currency conversion), calls `UserRepository.findById()` and `ExpenseRepository.create()`
6. `ExpenseRepository` creates Mongoose model and saves to database
7. Response flows back through layers

### Layer Responsibilities

**Routes** (`routes/`): Define API endpoints, apply middleware, delegate to controllers
```javascript
router.post('/', auth, (req, res) => ExpenseController.createExpense(req, res));
```

**Controllers** (`controllers/`): Handle HTTP requests, validate input, call services, send responses
```javascript
async createExpense(req, res) {
    const expense = await ExpenseService.createExpense(req.user.id, req.body);
    res.json(expense);
}
```

**Services** (`services/`): Business logic, data transformation, orchestrate repository calls
```javascript
async createExpense(userId, expenseData) {
    const user = await UserRepository.findById(userId);
    const amountUSD = this.convertToUSD(amount, currency);
    return await ExpenseRepository.create({ ...data, amountUSD });
}
```

**Repositories** (`repositories/`): **Centralized database operations** - ALL MongoDB queries
```javascript
async create(expenseData) {
    const expense = new Expense(expenseData);
    return await expense.save();
}
```

## Development Workflow

**Environment Setup:**
- Create `.env` file with: `MONGO_URI`, `JWT_SECRET`, `PORT` (defaults: localhost MongoDB, port 5000)
- Run `npm install` to install dependencies

**Running the App:**
- Development: `npm run dev` (uses nodemon for auto-restart)
- Production: `npm start`
- Database connection handled automatically by `database/connection.js`

**No Build Step**: Frontend uses CDN libraries (Tailwind CSS, Chart.js) and native ES6 modules - no bundler required

## Frontend Architecture Patterns

**Page Structure:**
- Each HTML page includes navbar via `navbar.js` module which injects navbar HTML
- Shared theme toggle logic in navbar handles dark/light mode via `localStorage.getItem('theme')`
- Tailwind config embedded in each HTML file's `<script>` tag with custom color tokens

**API Client Pattern** (`js/api.js`):
```javascript
export const api = {
  auth: { login, register, me, updateProfile },
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

**Layered Architecture:**
- Routes only call controllers, never services or repositories directly
- Controllers only call services, never repositories directly
- Services call repositories for ALL database operations
- No direct Model queries outside repositories

**Error Handling:**
- Backend: `try/catch` blocks return `res.status(500).json({ msg: 'Server error' })` with `console.error(err.message)`
- Frontend: Catch API errors and display in toast notifications
- Services throw errors with meaningful messages for controllers to handle

**Naming:**
- Routes use kebab-case: `/api/auth/register`, `/api/family/join`
- Classes use PascalCase: `UserService`, `ExpenseRepository`, `AuthController`
- Models use PascalCase: `User`, `Family`, `Expense`
- Client files use kebab-case: `add-expense.js`, `dashboard.html`

**Family ID Generation:**
- Use custom generator: `'fam_' + Math.random().toString(36).substr(2, 9)`

**Repository Patterns:**
- All methods are async and return Promises
- Use descriptive method names: `findByEmail()`, `updatePreferences()`, `getMemberCount()`
- Include populate parameter for relationship loading
- Log errors with repository name: `console.error('UserRepository.create Error:', error.message)`

**Service Patterns:**
- Singleton pattern (export `new ServiceClass()`)
- Business logic separation from database operations
- Currency conversion in ExpenseService
- Token generation in UserService

## Database Operations

**All 35 database operations are centralized in repositories:**
- `UserRepository.js`: 10 operations (create, findById, findByEmail, update, delete, etc.)
- `ExpenseRepository.js`: 16 operations (create, findAll, findByCategory, aggregations, etc.)
- `FamilyRepository.js`: 9 operations (create, addMember, removeMember, isMember, etc.)

See `DATABASE_OPERATIONS.md` for complete reference.

## Common Gotchas

1. **Module Paths**: Client JS uses relative paths (`./api.js`) not absolute (`/js/api.js`)
2. **Static File Serving**: Server serves from root with `express.static(path.join(__dirname, '.'))` - all HTML/CSS/JS accessible directly
3. **No Direct Model Queries**: Always use repositories for database operations, never `User.findOne()` in services
4. **Controller vs Service**: Controllers handle HTTP concerns, services handle business logic
5. **Repository Exports**: Repositories export singleton instances: `module.exports = new UserRepository()`
6. **Theme**: Dark theme is default - files include both Tailwind config and separate `dark-theme.css`
7. **Toast Notifications**: Use `window.toast.success()`, `window.toast.error()` for user feedback

## Testing & Debugging

- Manual testing workflow: Register → Create/Join Family → Add Expenses → View Dashboard
- Check browser console for client errors, server console for API errors
- MongoDB connection errors appear on server startup
- Repository pattern makes unit testing easy with mocked database

## File Structure

```
expence-tracker/
├── database/
│   └── connection.js          # Database connection manager
├── repositories/              # **ALL DATABASE OPERATIONS**
│   ├── UserRepository.js      
│   ├── ExpenseRepository.js   
│   └── FamilyRepository.js    
├── services/                  # Business logic layer
│   ├── UserService.js         
│   ├── ExpenseService.js      
│   └── FamilyService.js       
├── controllers/               # HTTP request handlers
│   ├── AuthController.js      
│   ├── ExpenseController.js   
│   └── FamilyController.js    
├── routes/                    # API endpoint definitions
├── models/                    # Mongoose schemas
├── middleware/                # Auth middleware
├── js/                        # Client-side ES6 modules
├── css/                       # Stylesheets + toast notifications
└── server.js                  # Application entry point
```

