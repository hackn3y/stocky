# Stock Prediction Frontend

React-based web interface for the Stock Market Predictor app.

## Features

- 📊 Real-time stock predictions (UP/DOWN)
- 📈 Interactive price charts (3-month history)
- 🎯 Confidence levels and probabilities
- 💼 Stock information display
- 🔍 Search any ticker symbol
- 📱 Responsive design with Tailwind CSS

## Prerequisites

- Node.js 14+ and npm
- Flask API backend running on http://localhost:5000

## Installation

```bash
# Install dependencies
npm install
```

## Running the App

### 1. Start the Backend API First

In a separate terminal:
```bash
cd ../backend
python app.py
```

Backend should be running on http://localhost:5000

### 2. Start the React App

```bash
npm start
```

The app will open at http://localhost:3000

## Usage

1. Enter a stock ticker symbol (e.g., SPY, AAPL, TSLA, QQQ)
2. Click "Predict" button
3. View:
   - Prediction direction (UP/DOWN)
   - Confidence percentage
   - Current price
   - 3-month price chart
   - Stock information

## Built With

- **React** - UI framework
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## API Endpoints Used

- `GET /api/predict/<symbol>` - Get prediction
- `GET /api/historical/<symbol>` - Get historical data
- `GET /api/info/<symbol>` - Get stock info

## Development

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Troubleshooting

### "Network Error" or "CORS Error"

**Solution:** Make sure the Flask backend is running on port 5000

### Predictions not loading

**Solution:**
1. Check backend is running: http://localhost:5000/api/health
2. Check browser console for errors
3. Ensure model is trained (backend/models/spy_model.pkl exists)

### Chart not displaying

**Solution:** Historical data may take a few seconds to load. Check network tab for API calls.

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application component
│   ├── index.js        # Entry point
│   └── index.css       # Tailwind styles
├── package.json
└── tailwind.config.js
```

## Disclaimer

This is for educational purposes only. Not financial advice. Do not risk real money based on these predictions.
