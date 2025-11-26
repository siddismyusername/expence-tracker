# FinTrack - Family Expense Tracker

A full-stack MERN expense tracking application with **layered architecture** and **centralized database operations**, perfect for demonstrating professional software design patterns in course projects.

## 🎯 Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Family Management**: Create or join families to track shared expenses
- **Expense Tracking**: Add personal and common expenses with multiple categories
- **Multi-Currency Support**: Support for USD, EUR, GBP, INR, and JPY with automatic conversion
- **Budget Alerts**: Get notifications when spending exceeds threshold
- **Visual Analytics**: Dashboard with pie charts and spending breakdowns
- **Dark Theme**: Modern dark theme interface with high contrast accessibility

## 🏗️ Architecture Highlights

This project implements a **professional 3-tier layered architecture**:

```
Presentation Layer (HTML + JS)
    ↓
Application Layer (Routes → Controllers → Services)
    ↓
Data Access Layer (Repositories → Models → Database)
```

### Key Benefits
- ✅ **Separation of Concerns**: Each layer has a single responsibility
- ✅ **Centralized Database Operations**: All 35 MongoDB operations in repository layer
- ✅ **Reusable Code**: Repository methods used across multiple services
- ✅ **Easy Testing**: Each layer can be tested independently
- ✅ **Maintainable**: Changes isolated to appropriate layers

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## 📁 Project Structure

```
expence-tracker/
├── database/               # Database connection management
│   └── connection.js
├── repositories/          # 🔥 ALL DATABASE OPERATIONS (35 operations)
│   ├── UserRepository.js      # 10 user operations
│   ├── ExpenseRepository.js   # 16 expense operations
│   └── FamilyRepository.js    # 9 family operations
├── services/              # Business logic layer
│   ├── UserService.js         # User business logic + JWT
│   ├── ExpenseService.js      # Expense logic + currency conversion
│   └── FamilyService.js       # Family management logic
├── controllers/           # HTTP request handlers
│   ├── AuthController.js      # Authentication endpoints
│   ├── ExpenseController.js   # Expense endpoints
│   └── FamilyController.js    # Family endpoints
├── routes/               # API endpoint definitions
│   ├── auth.js
│   ├── expenses.js
│   └── family.js
├── models/               # Mongoose schemas
│   ├── User.js
│   ├── Expense.js
│   └── Family.js
├── middleware/           # Custom middleware
│   └── authMiddleware.js
├── js/                   # Client-side ES6 modules
├── css/                  # Stylesheets
├── *.html               # Frontend pages
└── server.js            # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expence-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/family-expense-tracker
   # OR for MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker

   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

4. **Start the application**
   
   Development mode (with auto-restart):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

## 📚 Database Operations Documentation

All database operations are centralized and documented in [DATABASE_OPERATIONS.md](DATABASE_OPERATIONS.md).

### Quick Overview

**35 Total Database Operations**:
- **3 CREATE operations**: User, Expense, Family document creation
- **19 READ operations**: Find by ID, email, family, date range, aggregations
- **7 UPDATE operations**: Profile updates, preferences, member management
- **3 DELETE operations**: User, expense, family deletion
- **3 AGGREGATE operations**: Category totals, user spending summaries

**MongoDB Features Used**:
- CRUD operations with Mongoose ODM
- Population (JOIN-like operations)
- Aggregation framework ($group, $sum, $match)
- Array operators ($addToSet, $pull)
- Query operators ($gte, $lte for date ranges)

## 🎓 Course Project Showcase

This project is ideal for demonstrating:

1. **Layered Architecture Pattern**
   - Clear separation between Routes, Controllers, Services, and Repositories
   - Professional software design principles

2. **Centralized Database Management**
   - All database operations in one layer (repositories)
   - Easy to track, maintain, and explain

3. **MongoDB Mastery**
   - CRUD operations
   - Aggregation pipeline
   - Population (relationships)
   - Query optimization

4. **RESTful API Design**
   - Well-structured endpoints
   - Consistent error handling
   - JWT authentication

5. **Modern JavaScript**
   - ES6 modules
   - Async/await
   - Class-based architecture
   - Singleton pattern

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/update` - Update profile (protected)

### Expenses
- `POST /api/expenses` - Create expense (protected)
- `GET /api/expenses` - Get all expenses (protected)
- `GET /api/expenses/:id` - Get expense by ID (protected)
- `PUT /api/expenses/:id` - Update expense (protected)
- `DELETE /api/expenses/:id` - Delete expense (protected)
- `GET /api/expenses/stats` - Get statistics (protected)

### Family
- `POST /api/family/create` - Create family (protected)
- `POST /api/family/join` - Join family (protected)
- `POST /api/family/leave` - Leave family (protected)
- `GET /api/family` - Get family details (protected)
- `GET /api/family/members` - Get family members (protected)
- `PUT /api/family` - Update family (protected)

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **Vanilla JavaScript** - ES6 modules
- **Tailwind CSS** - Utility-first CSS framework (CDN)
- **Chart.js** - Data visualization (CDN)
- **Material Symbols** - Icons (CDN)

## 📖 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture documentation
- [DATABASE_OPERATIONS.md](DATABASE_OPERATIONS.md) - Complete database operations reference
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Development guidelines

## 🎨 Features in Detail

### Currency Conversion
All amounts are stored in USD (`amountUSD`) and converted for display:
- Conversion rates managed in `ExpenseService`
- Supports: USD, EUR, GBP, INR, JPY
- User can set preferred currency in settings

### Family Expense Tracking
- Users can create or join one family
- Personal expenses: Only visible to creator
- Common expenses: Marked with `isCommon` flag
- Family total: Includes all family member expenses
- Individual totals: Personal + common expenses per user

### Budget Alerts
- Set notification threshold in settings
- Red toast notification when personal spending exceeds threshold
- Personal total excludes common expenses for fair comparison

## 📝 License

This project is created for educational purposes as a course project demonstration.

## 👨‍💻 Author

Created to demonstrate professional layered architecture and centralized database operations for software engineering course projects.

---

**Note**: This README demonstrates how to document a professional course project. For actual deployment, add sections for: Contributing Guidelines, Security Best Practices, and Production Deployment Instructions.
