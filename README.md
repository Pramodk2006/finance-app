# AI-Powered Financial Management System

This is a comprehensive financial management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and enhanced with AI capabilities to help users master their money.

## Features

- **Automatic Transaction Categorization**: Uses natural language processing to automatically categorize transactions
- **Expense Tracking and Visualization**: Real-time tracking with interactive charts and graphs
- **Spending Trend Detection**: AI-powered analysis to identify spending patterns and habits
- **Personalized Budget Recommendations**: Smart budget suggestions based on spending behavior
- **AI Financial Assistant**: Chatbot interface for financial guidance and insights

## Tech Stack

- **Frontend**: React.js, Material UI, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **AI/ML**: Natural Language Processing with natural.js

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Setup Instructions

1. Clone the repository
```
git clone https://github.com/yourusername/finance-app.git
cd finance-app
```

2. Install dependencies
```
npm install
cd frontend
npm install
cd ..
```

3. Create a .env file in the backend directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. Run the application in development mode
```
npm run dev
```

## Deployment

### Preparing for Production

1. Create a production build of the React frontend
```
cd frontend
npm run build
cd ..
```

2. Set up environment variables for production in .env.production

3. Deploy to your preferred hosting service (Heroku, AWS, etc.)
```
npm run build
```

## Project Structure

```
finance-app/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── .env
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json
```

## AI Features Implementation

### Transaction Categorization
The system uses natural language processing to analyze transaction descriptions and automatically categorize them. The categorization model is trained on common financial transaction patterns and can be further improved through user feedback.

### Spending Pattern Detection
The application analyzes transaction history to identify recurring expenses, spending trends, and unusual transactions. This helps users understand their financial habits and make informed decisions.

### Budget Recommendations
Based on spending patterns and financial goals, the system provides personalized budget recommendations. These suggestions help users optimize their spending and improve their financial health.

## Testing

Run tests with:
```
npm test
```

The test suite includes:
- API endpoint tests
- Transaction categorization tests
- Spending pattern detection tests
- Budget recommendation tests

## License

This project is licensed under the MIT License.
