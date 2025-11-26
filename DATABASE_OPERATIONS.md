# Centralized Database Operations

This document lists **ALL database operations** in the application. Every database query goes through the Repository layer, making it easy to track, maintain, and demonstrate for course projects.

## Database Connection Manager

**File**: `database/connection.js`

### DatabaseManager Methods

| Method | Description | Operation Type |
|--------|-------------|----------------|
| `connect()` | Establish MongoDB connection | CONNECTION |
| `disconnect()` | Close database connection | CONNECTION |
| `isConnected()` | Check connection status | READ |
| `getStats()` | Get database statistics | READ |

**Example Usage**:
```javascript
const db = require('./database/connection');
await db.connect();
```

---

## User Repository

**File**: `repositories/UserRepository.js`

All database operations related to User collection.

### CREATE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `create()` | `userData: Object` | `new User().save()` | Create new user document |

**Example**:
```javascript
const user = await UserRepository.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed_password'
});
```

### READ Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `findById()` | `userId: String, selectFields: String` | `User.findById().select()` | Find user by MongoDB ObjectId |
| `findByEmail()` | `email: String` | `User.findOne({ email })` | Find user by email address |
| `findByFamilyId()` | `familyId: String` | `User.find({ familyId })` | Find all users in a family |
| `count()` | None | `User.countDocuments()` | Get total user count |
| `emailExists()` | `email: String` | `User.findOne({ email })` | Check if email exists |

**Examples**:
```javascript
// Find by ID (exclude password)
const user = await UserRepository.findById('507f1f77bcf86cd799439011');

// Find by email
const user = await UserRepository.findByEmail('john@example.com');

// Get all family members
const members = await UserRepository.findByFamilyId('507f191e810c19729de860ea');

// Count total users
const totalUsers = await UserRepository.count();
```

### UPDATE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `update()` | `userId: String, updateData: Object` | `User.findByIdAndUpdate()` | Update user by ID |
| `updatePreferences()` | `userId: String, preferences: Object` | `user.save()` | Update user preferences |

**Examples**:
```javascript
// Update user profile
await UserRepository.update(userId, { 
    name: 'Jane Doe',
    profilePicture: 'base64...'
});

// Update preferences
await UserRepository.updatePreferences(userId, {
    currency: 'EUR',
    notificationThreshold: 5000
});
```

### DELETE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `delete()` | `userId: String` | `User.findByIdAndDelete()` | Delete user by ID |

**Example**:
```javascript
await UserRepository.delete('507f1f77bcf86cd799439011');
```

---

## Expense Repository

**File**: `repositories/ExpenseRepository.js`

All database operations related to Expense collection.

### CREATE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `create()` | `expenseData: Object` | `new Expense().save()` | Create new expense document |

**Example**:
```javascript
const expense = await ExpenseRepository.create({
    userId: '507f1f77bcf86cd799439011',
    amount: 100,
    amountUSD: 100,
    category: 'Food',
    description: 'Grocery shopping',
    isCommon: false
});
```

### READ Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `findById()` | `expenseId: String, populate: Boolean` | `Expense.findById().populate()` | Find expense by ID |
| `findAll()` | `filters: Object, populate: Boolean` | `Expense.find().sort().populate()` | Find expenses with filters |
| `findByUserId()` | `userId: String, populate: Boolean` | `Expense.find({ userId })` | Find all user's expenses |
| `findByFamilyId()` | `familyId: String, populate: Boolean` | `Expense.find({ familyId })` | Find all family expenses |
| `findByDateRange()` | `startDate: Date, endDate: Date, filters: Object` | `Expense.find({ date: { $gte, $lte } })` | Find expenses in date range |
| `findByCategory()` | `category: String, filters: Object` | `Expense.find({ category })` | Find expenses by category |
| `count()` | `filters: Object` | `Expense.countDocuments()` | Count expenses with filters |
| `getTotalAmount()` | `filters: Object` | `Expense.aggregate()` | Sum total amount (aggregation) |
| `getByCategory()` | `filters: Object` | `Expense.aggregate()` | Group expenses by category |
| `getByUser()` | `filters: Object` | `Expense.aggregate()` | Group expenses by user |

**Examples**:
```javascript
// Find by ID with user data populated
const expense = await ExpenseRepository.findById(expenseId, true);

// Find all family expenses sorted by date
const expenses = await ExpenseRepository.findByFamilyId(familyId, true);

// Find expenses in last 30 days
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const recent = await ExpenseRepository.findByDateRange(startDate, new Date());

// Get total spending
const total = await ExpenseRepository.getTotalAmount({ userId });

// Get spending by category (MongoDB aggregation)
const byCategory = await ExpenseRepository.getByCategory({ familyId });
// Returns: [{ _id: 'Food', total: 500, count: 10 }, ...]
```

### UPDATE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `update()` | `expenseId: String, updateData: Object` | `Expense.findByIdAndUpdate()` | Update expense by ID |

**Example**:
```javascript
await ExpenseRepository.update(expenseId, {
    amount: 150,
    category: 'Groceries'
});
```

### DELETE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `delete()` | `expenseId: String` | `Expense.deleteOne()` | Delete expense by ID |

**Example**:
```javascript
await ExpenseRepository.delete('507f1f77bcf86cd799439011');
```

---

## Family Repository

**File**: `repositories/FamilyRepository.js`

All database operations related to Family collection.

### CREATE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `create()` | `familyData: Object` | `new Family().save()` | Create new family document |

**Example**:
```javascript
const family = await FamilyRepository.create({
    familyId: 'fam_abc123',
    name: 'Smith Family',
    createdBy: userId,
    members: [userId]
});
```

### READ Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `findById()` | `familyId: String, populate: Boolean` | `Family.findById().populate()` | Find family by MongoDB ID |
| `findByFamilyId()` | `familyId: String, populate: Boolean` | `Family.findOne({ familyId })` | Find family by family ID string |
| `findByCreator()` | `userId: String` | `Family.find({ createdBy })` | Find families created by user |
| `getMemberCount()` | `familyId: String` | `Family.findById()` | Get family member count |
| `isMember()` | `familyId: String, userId: String` | `Family.findById()` | Check if user is family member |
| `count()` | None | `Family.countDocuments()` | Get total family count |

**Examples**:
```javascript
// Find by family ID string with members populated
const family = await FamilyRepository.findByFamilyId('fam_abc123', true);

// Check if user is member
const isMember = await FamilyRepository.isMember(familyId, userId);

// Get member count
const count = await FamilyRepository.getMemberCount(familyId);
```

### UPDATE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `update()` | `familyId: String, updateData: Object` | `Family.findByIdAndUpdate()` | Update family details |
| `addMember()` | `familyId: String, userId: String` | `Family.findByIdAndUpdate({ $addToSet })` | Add member to family |
| `removeMember()` | `familyId: String, userId: String` | `Family.findByIdAndUpdate({ $pull })` | Remove member from family |

**Examples**:
```javascript
// Update family name
await FamilyRepository.update(familyId, { name: 'New Family Name' });

// Add member (uses $addToSet to prevent duplicates)
await FamilyRepository.addMember(familyId, newUserId);

// Remove member (uses $pull)
await FamilyRepository.removeMember(familyId, userId);
```

### DELETE Operations

| Method | Parameters | MongoDB Operation | Description |
|--------|-----------|-------------------|-------------|
| `delete()` | `familyId: String` | `Family.findByIdAndDelete()` | Delete family by ID |

**Example**:
```javascript
await FamilyRepository.delete('507f1f77bcf86cd799439011');
```

---

## MongoDB Operations Summary

### Operation Types Used

| Operation Type | Count | Methods |
|---------------|-------|---------|
| **CREATE** | 3 | `save()` |
| **READ** | 19 | `find()`, `findOne()`, `findById()`, `countDocuments()` |
| **UPDATE** | 7 | `findByIdAndUpdate()`, `save()` |
| **DELETE** | 3 | `findByIdAndDelete()`, `deleteOne()` |
| **AGGREGATE** | 3 | `aggregate()` with `$match`, `$group`, `$sum` |

**Total: 35 database operations** centralized in repositories

### MongoDB Operators Used

| Operator | Purpose | Used In |
|----------|---------|---------|
| `$addToSet` | Add to array without duplicates | FamilyRepository.addMember() |
| `$pull` | Remove from array | FamilyRepository.removeMember() |
| `$set` | Update specific fields | All update() methods |
| `$gte`, `$lte` | Date range queries | ExpenseRepository.findByDateRange() |
| `$match` | Aggregation filter | ExpenseRepository.getByCategory() |
| `$group` | Aggregation grouping | ExpenseRepository.getByCategory() |
| `$sum` | Aggregation sum | ExpenseRepository.getTotalAmount() |
| `$sort` | Sort results | ExpenseRepository.findAll() |

### Populate Operations

Used to join collections (similar to SQL JOIN):

```javascript
// Populate user data in expenses
.populate('userId', 'name email')

// Populate family members
.populate('members', 'name email profilePicture')

// Populate family creator
.populate('createdBy', 'name email')
```

---

## Benefits for Course Project

### 1. Easy to Track
All database operations are in 3 files:
- `repositories/UserRepository.js`
- `repositories/ExpenseRepository.js`
- `repositories/FamilyRepository.js`

### 2. No Duplication
Each database operation is written once and reused across services

### 3. Professional Pattern
Industry-standard Repository Pattern for data access

### 4. Documentation
This file serves as complete database operation documentation

### 5. Testability
Each repository method can be tested independently with mock database

### 6. Demonstrates Understanding
Shows knowledge of:
- MongoDB CRUD operations
- Aggregation framework
- Mongoose ODM
- Query optimization
- Population (joins)
- Indexing (via models)

---

## Example Service Using Multiple Repository Calls

```javascript
// services/ExpenseService.js - createExpense method
async createExpense(userId, expenseData) {
    // 1. User Repository - Read operation
    const user = await UserRepository.findById(userId);
    
    // 2. Currency conversion (business logic)
    const amountUSD = this.convertToUSD(amount, currency);
    
    // 3. Expense Repository - Create operation
    const expense = await ExpenseRepository.create({
        userId,
        familyId: user.familyId,
        amount,
        amountUSD,
        category,
        isCommon
    });
    
    // 4. Expense Repository - Read with populate
    return await ExpenseRepository.findById(expense._id, true);
}
```

This demonstrates:
- Multiple repository calls in single service method
- Separation of business logic (currency conversion) from database operations
- Use of different repositories in one transaction
