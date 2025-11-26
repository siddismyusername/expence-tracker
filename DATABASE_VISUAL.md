# Database Operations Visual Reference

This document provides a visual breakdown of all 35 database operations organized by repository.

## Operations by Repository

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER REPOSITORY (10 ops)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CREATE (1)                                                         │
│  ├─ create(userData)           → new User().save()                 │
│                                                                     │
│  READ (5)                                                           │
│  ├─ findById(userId)           → User.findById()                   │
│  ├─ findByEmail(email)         → User.findOne({ email })           │
│  ├─ findByFamilyId(familyId)   → User.find({ familyId })           │
│  ├─ count()                    → User.countDocuments()             │
│  └─ emailExists(email)         → User.findOne({ email })           │
│                                                                     │
│  UPDATE (3)                                                         │
│  ├─ update(userId, data)       → User.findByIdAndUpdate()          │
│  └─ updatePreferences(...)     → user.save()                       │
│                                                                     │
│  DELETE (1)                                                         │
│  └─ delete(userId)             → User.findByIdAndDelete()          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    EXPENSE REPOSITORY (16 ops)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CREATE (1)                                                         │
│  ├─ create(expenseData)        → new Expense().save()              │
│                                                                     │
│  READ (10)                                                          │
│  ├─ findById(id, populate)     → Expense.findById().populate()     │
│  ├─ findAll(filters)           → Expense.find().sort()             │
│  ├─ findByUserId(userId)       → Expense.find({ userId })          │
│  ├─ findByFamilyId(familyId)   → Expense.find({ familyId })        │
│  ├─ findByDateRange(...)       → Expense.find({ date: {...} })     │
│  ├─ findByCategory(category)   → Expense.find({ category })        │
│  ├─ count(filters)             → Expense.countDocuments()          │
│  ├─ getTotalAmount(filters)    → Expense.aggregate([...])          │
│  ├─ getByCategory(filters)     → Expense.aggregate([...])          │
│  └─ getByUser(filters)         → Expense.aggregate([...])          │
│                                                                     │
│  UPDATE (1)                                                         │
│  ├─ update(id, data)           → Expense.findByIdAndUpdate()       │
│                                                                     │
│  DELETE (1)                                                         │
│  └─ delete(expenseId)          → Expense.deleteOne()               │
│                                                                     │
│  AGGREGATIONS (3)                                                   │
│  ├─ getTotalAmount()           → $match → $group → $sum            │
│  ├─ getByCategory()            → $match → $group → $sum → $sort    │
│  └─ getByUser()                → $match → $group → $sum → $sort    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FAMILY REPOSITORY (9 ops)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CREATE (1)                                                         │
│  ├─ create(familyData)         → new Family().save()               │
│                                                                     │
│  READ (5)                                                           │
│  ├─ findById(id, populate)     → Family.findById().populate()      │
│  ├─ findByFamilyId(familyId)   → Family.findOne({ familyId })      │
│  ├─ findByCreator(userId)      → Family.find({ createdBy })        │
│  ├─ getMemberCount(familyId)   → Family.findById()                 │
│  ├─ isMember(familyId, userId) → Family.findById()                 │
│  └─ count()                    → Family.countDocuments()           │
│                                                                     │
│  UPDATE (2)                                                         │
│  ├─ update(id, data)           → Family.findByIdAndUpdate()        │
│  ├─ addMember(id, userId)      → Family.findByIdAndUpdate($addToSet)│
│  └─ removeMember(id, userId)   → Family.findByIdAndUpdate($pull)   │
│                                                                     │
│  DELETE (1)                                                         │
│  └─ delete(familyId)           → Family.findByIdAndDelete()        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow with Database Operations

### Example: User Adds Expense

```
┌─────────────────┐
│   Client Side   │
│ add-expense.js  │
└────────┬────────┘
         │ POST /api/expenses
         │ { amount: 100, category: 'Food', ... }
         ↓
┌─────────────────┐
│  Route Layer    │
│ routes/         │  → Apply auth middleware
│ expenses.js     │  → Route to controller
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Controller Layer│
│ ExpenseController│ → Extract req.body
│ .createExpense()│  → Call service
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Service Layer   │
│ ExpenseService  │  Business Logic:
│ .createExpense()│  ├─ Get user info
└────────┬────────┘  ├─ Convert currency
         │            └─ Prepare expense data
         │
         │  Database Operations Begin
         ↓
┌──────────────────────────────────────────────┐
│         Repository Layer                     │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ UserRepository.findById(userId)     │    │
│  │ → User.findById()                   │    │
│  │ → MongoDB: db.users.findOne({_id})  │    │
│  └─────────────────────────────────────┘    │
│               ↓ returns user                │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ ExpenseRepository.create(data)      │    │
│  │ → new Expense(data).save()          │    │
│  │ → MongoDB: db.expenses.insertOne()  │    │
│  └─────────────────────────────────────┘    │
│               ↓ returns expense             │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │ ExpenseRepository.findById(id, true)│    │
│  │ → Expense.findById().populate()     │    │
│  │ → MongoDB: db.expenses.findOne()    │    │
│  │          + db.users.findOne()       │    │
│  └─────────────────────────────────────┘    │
│               ↓ returns populated           │
└──────────────────────────────────────────────┘
         │
         │ Response flows back
         ↓
    Client receives JSON
```

## MongoDB Operations Summary

### Operation Types

```
┌──────────────┬───────┬────────────────────────────────┐
│ Operation    │ Count │ MongoDB Methods                │
├──────────────┼───────┼────────────────────────────────┤
│ CREATE       │   3   │ save()                         │
│ READ         │  20   │ find(), findOne(), findById()  │
│ UPDATE       │   6   │ findByIdAndUpdate(), save()    │
│ DELETE       │   3   │ findByIdAndDelete(),deleteOne()│
│ AGGREGATE    │   3   │ aggregate()                    │
├──────────────┼───────┼────────────────────────────────┤
│ TOTAL        │  35   │                                │
└──────────────┴───────┴────────────────────────────────┘
```

### Collections

```
┌─────────────┬──────────────┬────────────┐
│ Collection  │ Documents    │ Operations │
├─────────────┼──────────────┼────────────┤
│ users       │ User records │     10     │
│ expenses    │ Expense logs │     16     │
│ families    │ Family groups│      9     │
└─────────────┴──────────────┴────────────┘
```

## Service → Repository Mapping

### UserService Methods
```
register()         → UserRepository.findByEmail()
                  → UserRepository.create()

login()           → UserRepository.findByEmail()

getProfile()      → UserRepository.findById()

updateProfile()   → UserRepository.update()

updatePreferences() → UserRepository.updatePreferences()
```

### ExpenseService Methods
```
createExpense()   → UserRepository.findById()
                  → ExpenseRepository.create()
                  → ExpenseRepository.findById()

getUserExpenses() → UserRepository.findById()
                  → ExpenseRepository.findByFamilyId()
                  OR ExpenseRepository.findByUserId()

deleteExpense()   → ExpenseRepository.findById()
                  → ExpenseRepository.delete()

getStatistics()   → UserRepository.findById()
                  → ExpenseRepository.getTotalAmount()
                  → ExpenseRepository.count()
                  → ExpenseRepository.getByCategory()
                  → ExpenseRepository.getByUser()
```

### FamilyService Methods
```
createFamily()    → UserRepository.findById()
                  → FamilyRepository.create()
                  → UserRepository.update()
                  → FamilyRepository.findById()

joinFamily()      → UserRepository.findById()
                  → FamilyRepository.findByFamilyId()
                  → FamilyRepository.addMember()
                  → UserRepository.update()
                  → FamilyRepository.findById()

leaveFamily()     → UserRepository.findById()
                  → FamilyRepository.findById()
                  → FamilyRepository.removeMember()
                  → UserRepository.update()
                  → FamilyRepository.delete()

getFamilyDetails() → UserRepository.findById()
                   → FamilyRepository.findById()

getFamilyMembers() → UserRepository.findById()
                   → UserRepository.findByFamilyId()
```

## MongoDB Operators Used

```
┌────────────┬──────────────────────────────────────────┐
│ Operator   │ Purpose                                  │
├────────────┼──────────────────────────────────────────┤
│ $addToSet  │ Add to array without duplicates          │
│ $pull      │ Remove from array                        │
│ $set       │ Update specific fields                   │
│ $gte       │ Greater than or equal (date ranges)      │
│ $lte       │ Less than or equal (date ranges)         │
│ $match     │ Filter documents in aggregation          │
│ $group     │ Group documents in aggregation           │
│ $sum       │ Sum values in aggregation                │
│ $sort      │ Sort results                             │
└────────────┴──────────────────────────────────────────┘
```

## Population (Joins)

```
Expense.populate('userId', 'name email')
    ↓
┌─────────────────────────────────────────┐
│ Before Population                       │
├─────────────────────────────────────────┤
│ {                                       │
│   _id: "...",                           │
│   userId: "507f1f77bcf86cd799439011",   │ ← Just ID
│   amount: 100,                          │
│   category: "Food"                      │
│ }                                       │
└─────────────────────────────────────────┘
         │
         │ MongoDB JOIN operation
         ↓
┌─────────────────────────────────────────┐
│ After Population                        │
├─────────────────────────────────────────┤
│ {                                       │
│   _id: "...",                           │
│   userId: {                             │ ← Full object
│     _id: "507f1f77bcf86cd799439011",    │
│     name: "John Doe",                   │
│     email: "john@example.com"           │
│   },                                    │
│   amount: 100,                          │
│   category: "Food"                      │
│ }                                       │
└─────────────────────────────────────────┘
```

## Aggregation Pipeline Example

```javascript
ExpenseRepository.getByCategory({ familyId })

MongoDB Pipeline:
┌─────────────────────────────────────────┐
│ Stage 1: $match                         │
│ Filter: { familyId: "..." }             │
│                                         │
│ Input: All expenses                     │
│ Output: Family expenses only            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Stage 2: $group                         │
│ Group by: category                      │
│ Calculate: total amount, count          │
│                                         │
│ Output: [{                              │
│   _id: "Food",                          │
│   total: 500,                           │
│   count: 10                             │
│ }, ...]                                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Stage 3: $sort                          │
│ Sort by: total (descending)             │
│                                         │
│ Final Output: Categories sorted by      │
│ spending, highest first                 │
└─────────────────────────────────────────┘
```

## Index Strategy

```
users collection:
  _id (default)
  email (unique)

expenses collection:
  _id (default)
  userId (indexed for faster queries)
  familyId (indexed for family queries)

families collection:
  _id (default)
  familyId (unique string for sharing)
```

---

**Total Operations**: 35 database operations across 3 repositories
**Total Collections**: 3 MongoDB collections
**Architecture Benefit**: Single source of truth for all database logic
