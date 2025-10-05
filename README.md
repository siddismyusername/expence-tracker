AI-Powered Expense Tracker

Lightweight expense tracker with localStorage and MongoDB backend.

Project Structure

```
project/
├── public/
│   ├── css/
│   │   └── dark-theme.css
│   ├── js/
│   │   ├── page1.js
│   │   ├── page3.js
│   │   └── shared.js
│   └── pages/
│       ├── page1.html
│       ├── page2.html
│       ├── page3.html
│       └── settings.html
├── src/
│   ├── config/serverConfig.js
│   ├── controllers/pageController.js
│   ├── middleware/logger.js
│   ├── routes/index.js
│   ├── utils/helpers.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

Scripts

- npm run dev – start with nodemon
- npm start – start server

Env

Create `.env` with:

PORT=3000
MONGODB_URI=mongodb://localhost:27017/expense_tracker

Run

1. Install deps: npm i
2. Start MongoDB locally
3. npm run dev
4. Open http://localhost:3000

