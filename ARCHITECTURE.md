# Layered Architecture - FinTrack Expense Tracker

## Architecture Overview

This application follows a **3-tier layered architecture** with separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (HTML Pages + Client-Side JavaScript)                       │
│  - login.html, register.html, dashboard.html, etc.          │
│  - js/api.js, js/dashboard.js, js/expenses.js, etc.        │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP Requests
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │ Controllers  │  │  Services    │     │
│  │              │→ │              │→ │              │     │
│  │ Define API   │  │ Handle HTTP  │  │ Business     │     │
│  │ endpoints    │  │ requests     │  │ logic        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  routes/auth.js    controllers/         services/           │
│  routes/family.js  AuthController.js    UserService.js     │
│  routes/expenses.js ExpenseController.js ExpenseService.js │
│                    FamilyController.js  FamilyService.js   │
└─────────────────────────────────────────────────────────────┘
                            ↓ Data Operations
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Repositories │  │   Models     │  │   Database   │     │
│  │              │→ │              │→ │              │     │
│  │ Centralized  │  │ Mongoose     │  │  MongoDB     │     │
│  │ DB queries   │  │  schemas     │  │  connection  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  repositories/     models/            database/             │
│  UserRepository    User.js            connection.js         │
│  ExpenseRepository Expense.js                               │
│  FamilyRepository  Family.js                                │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Presentation Layer (Client-Side)
- **Location**: HTML files + `js/` folder
- **Responsibility**: User interface and client-side logic
- **Files**:
  - HTML: `login.html`, `register.html`, `dashboard.html`, `expenses.html`, `family.html`, `settings.html`
  - JavaScript: `js/api.js`, `js/dashboard.js`, `js/expenses.js`, `js/family.js`, etc.
- **Key Pattern**: All API calls go through `js/api.js` for centralized HTTP communication

### 2. Routes Layer
- **Location**: `routes/` folder
- **Responsibility**: Define API endpoints and route HTTP requests to controllers
- **Files**: `auth.js`, `family.js`, `expenses.js`
- **Pattern**: Maps URL patterns to controller methods
```javascript
router.post('/register', (req, res) => AuthController.register(req, res));
```

### 3. Controller Layer
- **Location**: `controllers/` folder
- **Responsibility**: Handle HTTP requests, validate input, call services, send responses
- **Files**: `AuthController.js`, `ExpenseController.js`, `FamilyController.js`
- **Pattern**: Controllers delegate business logic to services
```javascript
async register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Missing fields' });
    }
    const result = await UserService.register({ name, email, password });
    res.json(result);
}
```

### 4. Service Layer
- **Location**: `services/` folder
- **Responsibility**: Business logic, data transformation, orchestrate multiple repository calls
- **Files**: `UserService.js`, `ExpenseService.js`, `FamilyService.js`
- **Pattern**: Services use repositories for data access and implement business rules
```javascript
async createExpense(userId, expenseData) {
    const user = await UserRepository.findById(userId);
    const amountUSD = this.convertToUSD(amount, currency);
    return await ExpenseRepository.create({ ...data, amountUSD });
}
```

### 5. Repository Layer
- **Location**: `repositories/` folder
- **Responsibility**: **Centralized database operations** - ALL database queries happen here
- **Files**: `UserRepository.js`, `ExpenseRepository.js`, `FamilyRepository.js`
- **Pattern**: Repository methods are reusable, focused database operations
```javascript
async findByEmail(email) {
    return await User.findOne({ email });
}
```

### 6. Model Layer
- **Location**: `models/` folder
- **Responsibility**: Define data structure and schema validation
- **Files**: `User.js`, `Expense.js`, `Family.js`
- **Pattern**: Mongoose schemas with field validation

### 7. Database Layer
- **Location**: `database/` folder
- **Responsibility**: Database connection management
- **Files**: `connection.js`
- **Pattern**: Singleton DatabaseManager class

## Request Flow Example

**User adds an expense:**

```
1. Client (add-expense.html)
   ↓ User fills form and clicks submit
   
2. Client JavaScript (js/add-expense.js)
   ↓ Calls api.expenses.add({ amount, category, ... })
   
3. API Client (js/api.js)
   ↓ POST /api/expenses with token header
   
4. Route (routes/expenses.js)
   ↓ router.post('/', auth, ExpenseController.createExpense)
   
5. Middleware (middleware/authMiddleware.js)
   ↓ Validates JWT token, attaches req.user.id
   
6. Controller (controllers/ExpenseController.js)
   ↓ Extracts data, calls ExpenseService.createExpense()
   
7. Service (services/ExpenseService.js)
   ↓ - Calls UserRepository.findById() to get user
   ↓ - Converts currency to USD
   ↓ - Calls ExpenseRepository.create()
   
8. Repository (repositories/ExpenseRepository.js)
   ↓ Creates Expense model and saves to DB
   
9. Model (models/Expense.js)
   ↓ Validates data against schema
   
10. Database (MongoDB)
    ↓ Stores expense document
    
← Response flows back through the layers
```

## Database Operations Reference

See `DATABASE_OPERATIONS.md` for complete list of all centralized database operations.

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Testability**: Each layer can be tested independently with mocks
3. **Reusability**: Repository methods can be used by multiple services
4. **Maintainability**: Changes to database queries only happen in repositories
5. **Scalability**: Easy to add new features or modify existing ones
6. **Centralized Database Logic**: All DB operations in one place for your course project

## Course Project Highlights

For your course project presentation, emphasize:

1. **Layered Architecture Pattern**: Clear separation of Routes → Controllers → Services → Repositories
2. **Centralized Database Layer**: All MongoDB operations are in `repositories/` folder
3. **DRY Principle**: Reusable repository methods prevent code duplication
4. **Business Logic Isolation**: Services contain all business rules, not mixed with DB code
5. **Error Handling**: Consistent error handling at each layer
6. **Database Connection Management**: Singleton pattern in `database/connection.js`

## File Structure

```
expence-tracker/
├── database/
│   └── connection.js          # Database connection manager
├── repositories/
│   ├── UserRepository.js      # User database operations
│   ├── ExpenseRepository.js   # Expense database operations
│   └── FamilyRepository.js    # Family database operations
├── services/
│   ├── UserService.js         # User business logic
│   ├── ExpenseService.js      # Expense business logic
│   └── FamilyService.js       # Family business logic
├── controllers/
│   ├── AuthController.js      # Authentication HTTP handlers
│   ├── ExpenseController.js   # Expense HTTP handlers
│   └── FamilyController.js    # Family HTTP handlers
├── routes/
│   ├── auth.js               # Auth API endpoints
│   ├── expenses.js           # Expense API endpoints
│   └── family.js             # Family API endpoints
├── models/
│   ├── User.js               # User Mongoose schema
│   ├── Expense.js            # Expense Mongoose schema
│   └── Family.js             # Family Mongoose schema
├── middleware/
│   └── authMiddleware.js     # JWT authentication
├── js/                       # Client-side JavaScript
├── css/                      # Stylesheets
└── server.js                 # Application entry point
```

## Getting Started

1. **Install dependencies**: `npm install`
2. **Configure environment**: Create `.env` with `MONGO_URI` and `JWT_SECRET`
3. **Start server**: `npm run dev`
4. **Database connection**: Automatic via `database/connection.js`

## API Endpoints

All endpoints are documented in the respective route files with `@route`, `@desc`, and `@access` comments.
