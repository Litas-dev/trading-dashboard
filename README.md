# Trading Dashboard

A modern, responsive trading dashboard built with React, Tailwind CSS, and Recharts. This project provides a sleek interface for viewing market summaries, stock indices, and watchlists.

![Trading Dashboard Screenshot](http://www.marketcalls.in/wp-content/uploads/2024/06/Screenshot-2024-06-23-at-9.40.41 AM.png)

## Features

- Live market summary cards with price and daily %
- Interactive line chart for visualizing market trends
- Watchlist with live prices, % change, and filter dropdown
- Responsive design for desktop and mobile devices
- Country flags for quick visual reference of market indices

## Technologies Used

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for data visualization
- [Lucide React](https://lucide.dev/) for icons

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/marketcalls/trading-dashboard.git
   ```

2. Navigate to the project directory:
   ```sh
   cd trading-dashboard
   ```

3. Install dependencies:
   ```sh
   npm install
   ```

4. Start the development server:
   ```sh
   npm start
   ```

5. Open your browser and visit `http://localhost:3000` to view the dashboard.

### Live Data (No API Keys)

This dashboard uses free, keyless sources:

- Equities/ETFs: Stooq CSV (close and open for daily %)
- Crypto: Binance 24h ticker with CoinGecko fallback
- FX: Frankfurter (latest and previous day) and open.er-api

Optional helpers:

- Generate local aggregated prices file:
  ```sh
  npm run prices:update
  ```
  Or continuously:
  ```sh
  npm run prices:watch
  ```
  The file is written to `public/prices.json` and read by the app every ~15 seconds.

- Development Stooq proxy (avoids CORS in dev):
  ```sh
  npm run stooq-proxy
  ```
  The app will use direct quotes when available; otherwise it prefers `prices.json`.

Notes:
- Truly real-time equities from browsers without a backend typically require a free API key. If you want consistent live quotes, use IEX Cloud or Finnhub; a small server can proxy those securely. 
- Recharts XAxis/YAxis defaultProps warnings are benign and do not affect functionality.

## Usage

The trading dashboard displays market summaries for major indices, an interactive chart, and a watchlist. Users can:

- View live market data from free sources
- Interact with the chart to view specific data points
- Filter the watchlist (All, Equities, Crypto, FX)
- Customize the watchlist (extend the array in code)

## Customization

### Adding New Indices

To add new indices to the market summary, edit the `indices` array in the `TradingDashboard` component:

```javascript
const indices = [
  // ... existing indices
  { name: 'New Index', value: 1000.00, change: 0.5, color: 'green', flag: '🇺🇸' },
];
```

### Modifying the Watchlist

To modify the watchlist, edit the `watchlistItems` array in the `TradingDashboard` component:

```javascript
const watchlistItems = [
  // ... existing items
  { symbol: 'NEW', price: 100.00, change: 1.5, color: 'green' },
];
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Lucide React](https://lucide.dev/)

## Build

Create an optimized production build:
```sh
npm run build
```
Serve locally:
```sh
npm install -g serve
serve -s build
```


