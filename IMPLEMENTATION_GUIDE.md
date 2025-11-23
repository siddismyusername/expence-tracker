# Family Expense Tracker - DBMS Implementation

This project has been transformed into a comprehensive family expense tracking system demonstrating advanced Database Management System (DBMS) concepts.

## 🎯 DBMS Concepts Implemented

### 1. **Database Schema Design & Normalization**
- **3NF/BCNF Normalized Schema** with 7 separate collections:
  - `users` - User authentication and profiles
  - `families` - Family groups with embedded members
  - `expenses` - Individual and shared expenses
  - `budgets` - Budget tracking per category
  - `categories` - Hierarchical category management
  - `recurringexpenses` - Recurring expense templates
  - `auditlogs` - Complete audit trail

### 2. **Indexing Strategy**
- **Single-field indexes**: `userId`, `familyId`, `email`, `date`, `category`
- **Compound indexes**: 
  - `{familyId: 1, date: -1, category: 1}` for efficient expense queries
  - `{userId: 1, type: 1, date: -1}` for user expense filtering
  - `{familyId: 1, isActive: 1}` for family member queries
- **Text indexes**: Full-text search on `description` and `tags`
- **Geospatial indexes**: 2dsphere index for location-based expenses
- **Partial indexes**: Optimized queries for pending approvals
- **TTL indexes**: Auto-deletion of audit logs (365 days) and soft-deleted expenses (90 days)

### 3. **ACID Transactions**
- **Multi-document transactions** using MongoDB sessions:
  - Family creation (create family + update user)
  - Member removal (update family + reset user familyId)
  - Split expense creation (expense + budget updates)
  - Family invitation acceptance (add member + update user)

### 4. **Aggregation Pipelines**
Advanced analytics using MongoDB aggregation framework:
- **$facet**: Multi-dimensional analysis (category breakdown + member spending + daily trends)
- **$lookup**: Joining users with expenses for member analysis
- **$group**: Category totals, member comparisons, spending summaries
- **$bucket**: Spending range distribution
- **$graphLookup**: Hierarchical category traversal
- **$project**: Calculated fields and data transformation

### 5. **Data Integrity & Constraints**
- **Schema-level validation**: Mongoose validators for all fields
- **Enum constraints**: Category, role, approval status enumerations
- **Check constraints**: Positive amounts, budget limits
- **Unique constraints**: Email, expenseId, familyId uniqueness
- **Compound unique indexes**: Email per family
- **Referential integrity**: References between collections with population
- **Custom validators**: Budget vs actual spending validation
- **Pre-save hooks**: Cross-collection validation

### 6. **Query Optimization**
- **Connection pooling**: Configured with min/max pool sizes
- **Query explain logging**: Performance monitoring in middleware
- **Lean queries**: Using `.lean()` for read-only operations
- **Cursor-based pagination**: For large result sets
- **Projection**: Select only required fields
- **Performance monitoring**: Log slow queries (>1000ms)

### 7. **Concurrency Control**
- **Optimistic locking**: Version fields (`__v`) in all schemas
- **Atomic operations**: `$inc` for budget updates
- **Transaction isolation**: Session-based transactions
- **Document versioning**: Track changes with version numbers

### 8. **Advanced Features**
- **Soft deletes**: `deletedAt` field with partial indexes
- **Audit trail**: Comprehensive logging of all CRUD operations
- **Materialized views**: Dashboard summaries via aggregation
- **Triggers/Hooks**: Mongoose pre/post save/remove hooks
- **Virtual fields**: Calculated properties (budget remaining, percent used)
- **Discriminators**: Expense type discrimination (personal/family)
- **Embedded documents**: Members in families, splits in expenses
- **Document references**: Cross-collection relationships

### 9. **Security & Access Control**
- **Role-Based Access Control (RBAC)**: Admin, Parent, Child roles
- **Row-level security**: Users can only access their family's data
- **JWT authentication**: Secure token-based authentication
- **Password hashing**: Bcrypt with salt rounds
- **Session management**: Express sessions with secure cookies
- **Authorization middleware**: Permission checking on routes

### 10. **Additional DBMS Features**
- **Database backup documentation**: Replica set considerations
- **Data archiving**: Background jobs for old expense archival
- **Change streams**: Real-time notifications capability
- **GridFS consideration**: For receipt image storage
- **ETL processes**: Data transformation in analytics service
- **OLAP vs OLTP**: Separate analytics aggregations

## 🚀 Key Features

### Multi-User System
- User registration and authentication
- Role-based permissions (Admin, Parent, Child)
- Per-user expense tracking
- Personal budgets

### Family Management
- Create and manage families
- Invite members via email
- Member role management
- Family-wide settings

### Expense Tracking
- Personal and family expenses
- Expense approval workflow
- Split expenses with custom/equal distribution
- Recurring expenses (daily, weekly, monthly, yearly)
- Geolocation tagging
- Receipt attachments support

### Budget Management
- Personal and family budgets
- Budget alerts at configurable thresholds
- Automatic budget tracking
- Period-based budgets (daily, weekly, monthly, yearly)
- Budget rollover option

### Analytics & Reporting
- Category-wise spending analysis
- Member spending comparison
- Spending trends over time
- Budget utilization reports
- Top spending categories
- Dashboard with materialized views

### Notifications
- Email notifications (nodemailer)
- Budget threshold alerts
- Expense approval requests
- Weekly spending digest
- Approval confirmations

## 📁 Project Structure

```
src/
├── models/           # Mongoose schemas with indexes and hooks
│   ├── User.js
│   ├── Family.js
│   ├── Expense.js
│   ├── Budget.js
│   ├── Category.js
│   ├── RecurringExpense.js
│   └── AuditLog.js
├── routes/           # API route handlers
│   ├── index.js      # Expense routes
│   ├── authRoutes.js # Authentication routes
│   └── familyRoutes.js # Family management routes
├── middleware/       # Express middleware
│   ├── auth.js       # JWT authentication
│   ├── rbac.js       # Role-based access control
│   └── logger.js     # Request logging & performance
├── services/         # Business logic layer
│   ├── analyticsService.js    # Aggregation pipelines
│   ├── notificationService.js # Email notifications
│   └── recurringExpenseService.js # Recurring processing
├── config/
│   └── serverConfig.js # Configuration
└── utils/
    └── helpers.js    # Utility functions

public/
├── pages/           # HTML pages
│   ├── login.html
│   ├── register.html
│   ├── page1.html   # Add expense
│   ├── page2.html   # Expense list
│   └── page3.html   # Dashboard
└── js/              # Frontend JavaScript
    ├── shared.js    # Shared utilities
    └── navbar.js    # Navigation component
```

## 🔧 Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

3. Start MongoDB:
```bash
mongod
```

4. Run the server:
```bash
npm start
```

## 📊 Database Indexes Created

Run this script to verify indexes:
```javascript
db.users.getIndexes()
db.families.getIndexes()
db.expenses.getIndexes()
db.budgets.getIndexes()
db.recurringexpenses.getIndexes()
db.auditlogs.getIndexes()
```

## 🔍 Sample Queries

### Find expenses with aggregation:
```javascript
db.expenses.aggregate([
  { $match: { familyId: "fam_123", approvalStatus: "approved" } },
  { $group: { _id: "$category", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
```

### Check budget utilization:
```javascript
db.families.aggregate([
  { $match: { familyId: "fam_123" } },
  { $unwind: "$sharedBudgets" },
  { $project: {
      category: "$sharedBudgets.category",
      percentUsed: { $multiply: [{ $divide: ["$sharedBudgets.spent", "$sharedBudgets.limit"] }, 100] }
  }}
])
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - List expenses (with filtering)
- `POST /api/expenses` - Create expense (with transactions)
- `PATCH /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Soft delete expense

### Family
- `POST /api/family` - Create family (transactional)
- `GET /api/family/:id` - Get family details
- `POST /api/family/:id/invite` - Invite member
- `POST /api/family/accept-invite` - Accept invitation
- `GET /api/family/:id/budgets` - Get family budgets

## 🎓 Learning Outcomes

This project demonstrates:
1. Proper database schema design and normalization
2. Complex indexing strategies for query optimization
3. ACID transactions in MongoDB
4. Advanced aggregation pipeline usage
5. Referential integrity and constraints
6. Audit logging and data governance
7. Security best practices
8. Connection pooling and performance monitoring
9. Soft deletes and data archival
10. Real-world application architecture

## 📝 Notes

- All passwords are hashed using bcrypt
- JWT tokens expire in 7 days
- Audit logs auto-delete after 365 days
- Soft-deleted expenses auto-archive after 90 days
- Email notifications require SMTP configuration
- MongoDB 4.0+ required for transactions

## 🔐 Security Considerations

- Change JWT_SECRET and SESSION_SECRET in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting for authentication routes
- Regular security audits
- Keep dependencies updated

## 📈 Performance Optimizations

- Connection pooling (10 max connections)
- Query result limiting and pagination
- Lean queries for read operations
- Compound indexes for common queries
- Background jobs for recurring expenses
- Materialized views for dashboards

---

This implementation showcases maximum DBMS concepts while building a practical family expense tracking application!
