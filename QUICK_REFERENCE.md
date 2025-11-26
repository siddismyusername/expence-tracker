# Quick Reference - Layered Architecture

## When to Use Each Layer

### Routes (`routes/`)
**Use When**: Defining API endpoints and applying middleware

```javascript
// ✅ DO
router.post('/register', (req, res) => AuthController.register(req, res));
router.get('/', auth, (req, res) => ExpenseController.getExpenses(req, res));

// ❌ DON'T - No business logic in routes
router.post('/login', async (req, res) => {
    const user = await User.findOne({ email });  // ❌
    // ...
});
```

### Controllers (`controllers/`)
**Use When**: Handling HTTP requests and responses

```javascript
// ✅ DO - Validate, delegate to service, send response
async register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Missing fields' });
    }
    const result = await UserService.register({ name, email, password });
    res.json(result);
}

// ❌ DON'T - No database queries in controllers
async register(req, res) {
    const user = await User.findOne({ email });  // ❌
    // ...
}

// ❌ DON'T - No business logic in controllers
async register(req, res) {
    const hashedPassword = await bcrypt.hash(password, 10);  // ❌
    // This belongs in service layer
}
```

### Services (`services/`)
**Use When**: Implementing business logic

```javascript
// ✅ DO - Business logic + repository calls
async createExpense(userId, expenseData) {
    // Get user data
    const user = await UserRepository.findById(userId);
    
    // Business logic: currency conversion
    const amountUSD = this.convertToUSD(amount, currency);
    
    // Business logic: determine familyId
    const familyId = user.familyId || null;
    
    // Create via repository
    return await ExpenseRepository.create({ 
        ...data, 
        amountUSD, 
        familyId 
    });
}

// ❌ DON'T - No direct model queries in services
async createExpense(userId, expenseData) {
    const user = await User.findById(userId);  // ❌
    const expense = await Expense.create(data);  // ❌
    // Use repositories instead!
}
```

### Repositories (`repositories/`)
**Use When**: Performing database operations

```javascript
// ✅ DO - Pure database operations
async findByEmail(email) {
    return await User.findOne({ email });
}

async create(userData) {
    const user = new User(userData);
    return await user.save();
}

// ❌ DON'T - No business logic in repositories
async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);  // ❌
    // Password hashing is business logic - belongs in service
}

// ❌ DON'T - No HTTP concerns in repositories
async findByEmail(email, res) {  // ❌
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ msg: 'Not found' });  // ❌
    }
}
```

## Layer Communication Rules

```
✅ ALLOWED:
Routes       → Controllers
Controllers  → Services
Services     → Repositories
Repositories → Models

❌ NOT ALLOWED:
Routes       → Services (skip controller)
Controllers  → Repositories (skip service)
Services     → Models (skip repository)
Routes       → Models (skip everything)
```

## Common Patterns

### Pattern 1: Simple CRUD
```javascript
// Route
router.get('/me', auth, (req, res) => AuthController.getMe(req, res));

// Controller
async getMe(req, res) {
    const user = await UserService.getProfile(req.user.id);
    res.json(user);
}

// Service
async getProfile(userId) {
    return await UserRepository.findById(userId);
}

// Repository
async findById(userId) {
    return await User.findById(userId).select('-password');
}
```

### Pattern 2: Multiple Repository Calls
```javascript
// Service
async createExpense(userId, expenseData) {
    // Call multiple repositories
    const user = await UserRepository.findById(userId);
    const expense = await ExpenseRepository.create({
        ...expenseData,
        familyId: user.familyId
    });
    
    // Return with population
    return await ExpenseRepository.findById(expense._id, true);
}
```

### Pattern 3: Complex Business Logic
```javascript
// Service
async joinFamily(userId, familyId) {
    // 1. Get user
    const user = await UserRepository.findById(userId);
    
    // 2. Business rule check
    if (user.familyId) {
        throw new Error('User already has family');
    }
    
    // 3. Find family
    const family = await FamilyRepository.findByFamilyId(familyId);
    if (!family) {
        throw new Error('Family not found');
    }
    
    // 4. Update both collections
    await FamilyRepository.addMember(family._id, userId);
    await UserRepository.update(userId, { familyId: family._id });
    
    // 5. Return populated result
    return await FamilyRepository.findById(family._id, true);
}
```

## Error Handling by Layer

### Controllers
```javascript
// Handle service errors and convert to HTTP responses
try {
    const result = await UserService.register(data);
    res.json(result);
} catch (error) {
    if (error.message === 'User already exists') {
        return res.status(400).json({ msg: error.message });
    }
    res.status(500).json({ msg: 'Server error' });
}
```

### Services
```javascript
// Throw meaningful errors
async register(userData) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
        throw new Error('User already exists');
    }
    // ...
}
```

### Repositories
```javascript
// Log and re-throw errors
async create(userData) {
    try {
        const user = new User(userData);
        return await user.save();
    } catch (error) {
        console.error('UserRepository.create Error:', error.message);
        throw error;
    }
}
```

## Singleton Pattern

All services and repositories use singleton pattern:

```javascript
// ✅ Correct way to export
class UserService {
    async register(data) { /* ... */ }
}

module.exports = new UserService();  // Export instance

// Usage
const UserService = require('../services/UserService');
await UserService.register(data);  // Call directly on instance
```

## Testing Strategy

Each layer can be tested independently:

```javascript
// Testing Repository (with mock database)
describe('UserRepository', () => {
    it('should create user', async () => {
        const user = await UserRepository.create(mockUserData);
        expect(user.email).toBe('test@example.com');
    });
});

// Testing Service (with mock repository)
jest.mock('../repositories/UserRepository');
describe('UserService', () => {
    it('should throw error if user exists', async () => {
        UserRepository.findByEmail.mockResolvedValue(existingUser);
        await expect(UserService.register(data))
            .rejects.toThrow('User already exists');
    });
});

// Testing Controller (with mock service)
jest.mock('../services/UserService');
describe('AuthController', () => {
    it('should return 400 if missing fields', async () => {
        const req = { body: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await AuthController.register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
```

## Checklist for Adding New Feature

- [ ] **Model**: Define schema in `models/` (if new collection)
- [ ] **Repository**: Add database operations in `repositories/`
- [ ] **Service**: Implement business logic in `services/`
- [ ] **Controller**: Create HTTP handlers in `controllers/`
- [ ] **Routes**: Define endpoints in `routes/`
- [ ] **Frontend**: Create client-side logic in `js/`

## Common Mistakes to Avoid

❌ **Skipping layers**
```javascript
// In route
router.post('/login', async (req, res) => {
    const user = await User.findOne({ email });  // ❌ Skip to model
});
```

✅ **Use all layers**
```javascript
router.post('/login', (req, res) => AuthController.login(req, res));
// → Controller → Service → Repository → Model
```

❌ **Business logic in repository**
```javascript
// In repository
async create(userData) {
    const token = jwt.sign({ id: userData._id });  // ❌ Business logic
    return user;
}
```

✅ **Business logic in service**
```javascript
// In service
async register(userData) {
    const user = await UserRepository.create(userData);
    const token = this.generateToken(user._id);  // ✅ In service
    return { user, token };
}
```

❌ **HTTP concerns in service**
```javascript
// In service
async getProfile(userId, res) {  // ❌ res parameter
    const user = await UserRepository.findById(userId);
    res.json(user);  // ❌ HTTP response
}
```

✅ **HTTP only in controller**
```javascript
// In controller
async getMe(req, res) {
    const user = await UserService.getProfile(req.user.id);
    res.json(user);  // ✅ HTTP response here
}
```

## Quick Decision Tree

```
Need to do something?
│
├─ Is it about HTTP (req/res)?
│  └─ Yes → Controller
│
├─ Is it a database query?
│  └─ Yes → Repository
│
├─ Is it business logic?
│  └─ Yes → Service
│
└─ Is it defining data structure?
   └─ Yes → Model
```

## Benefits Summary

✅ **Separation of Concerns**: Each layer has one job
✅ **Testability**: Mock one layer to test another
✅ **Reusability**: Repository methods used by multiple services
✅ **Maintainability**: Changes isolated to appropriate layer
✅ **Scalability**: Easy to add features without breaking existing code
✅ **Professional**: Industry-standard architecture pattern

---

**Remember**: The key to layered architecture is **discipline** - always use the right layer for the job!
