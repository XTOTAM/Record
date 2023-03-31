const symbol = 'btcusdt';
const tradeStreamUrl = `wss://stream.binance.com:9443/ws/${symbol}@trade`;

const tradeStream = new WebSocket(tradeStreamUrl);

// Initialize a rolling window of the last 100 trade quantities, prices, and price change speeds
const last100TradeQuantities = [];
const last100TradePrices = [];
const last100PriceChangeSpeeds = [];

const maxTrades = 1000;

function calculateStandardDeviation(data) {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDifferences = data.map(val => (val - mean) * (val - mean));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / squaredDifferences.length;
  return Math.sqrt(variance);
}

// Add a variable to keep track of the total traded quantity
let totalTradedQuantity = 0;

function handleTradeMessage(event) {
  const tradeData = JSON.parse(event.data);
  const tradeInfoElement = document.getElementById('tradeInfo');
  const totalQuantityElement = document.getElementById('totalQuantity');
  const quantity = parseFloat(tradeData.q);
  const price = parseFloat(tradeData.p);
  const timestamp = tradeData.T;

  // Update the total traded quantity
  totalTradedQuantity += quantity;
  totalQuantityElement.innerHTML = `BTC: ${totalTradedQuantity.toFixed(1)}`;


  // Add the current trade quantity and price to the rolling windows
  last100TradeQuantities.push(quantity);
  last100TradePrices.push(price);

  // Calculate the price change speed and add it to the rolling window
  if (last100TradePrices.length > 1) {
    const previousPrice = last100TradePrices[last100TradePrices.length - 2];
    const priceChangeSpeed = Math.abs(price - previousPrice) / previousPrice;
    last100PriceChangeSpeeds.push(priceChangeSpeed);

    // If the rolling window exceeds the maximum size, remove the oldest price change speed
    if (last100PriceChangeSpeeds.length > maxTrades - 1) {
      last100PriceChangeSpeeds.shift();
    }
  }

  // If the rolling windows exceed the maximum size, remove the oldest trade quantity and price
  if (last100TradeQuantities.length > maxTrades) {
    last100TradeQuantities.shift();
    last100TradePrices.shift();
  }

  // Calculate the average trade quantity, standard deviation, and average price
  const averageQuantity = last100TradeQuantities.reduce((sum, q) => sum + q, 0) / last100TradeQuantities.length;
  const standardDeviation = calculateStandardDeviation(last100TradeQuantities);
  const averagePrice = last100TradePrices.reduce((sum, p) => sum + p, 0) / last100TradePrices.length;

  // Calculate the average price change speed and its standard deviation
  const averagePriceChangeSpeed = last100PriceChangeSpeeds.reduce((sum, speed) => sum + speed, 0) / last100PriceChangeSpeeds.length;
  const priceChangeSpeedStandardDeviation = calculateStandardDeviation(last100PriceChangeSpeeds);

  // Normalize the current trade quantity using the average trade quantity
  const normalizedQuantity = quantity / averageQuantity;

  const barColor = tradeData.m ? 'red' : 'green';
  const barWidth = Math.abs(normalizedQuantity) * 50; // Adjust the multiplier for better visualization

  // Anomaly detection: check if the trade is more than 2 standard deviations away from the mean
  const quantityAnomalyThreshold = 5;
  const isQuantityAnomaly = Math.abs(quantity - averageQuantity) > quantityAnomalyThreshold * standardDeviation;

  // Anomaly detection: check if the price change speed is more than 3 standard deviations away from the mean
  const priceChangeSpeedAnomalyThreshold = 5;
  const isPriceChangeAnomaly = last100PriceChangeSpeeds.length > 0 && Math.abs(last100PriceChangeSpeeds[last100PriceChangeSpeeds.length - 1] - averagePriceChangeSpeed) > priceChangeSpeedAnomalyThreshold * priceChangeSpeedStandardDeviation;
  
  const isAnomaly = isQuantityAnomaly && isPriceChangeAnomaly;
  

  // Convert the timestamp to a date and time string
  const date = new Date(timestamp);
  const dateString = date.toLocaleString();

  var anomalyLabel = "";
  var tradeInfo = ""
  if (isAnomaly) {
    anomalyLabel = (price - averagePrice) > 0 ? 'PUMP ' : 'DUMP ';
    tradeInfo = `
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <span style="margin-left: 10px; color: ${isAnomaly ? 'red' : ''};">${anomalyLabel}</span>
      <span style="margin-right: 10px;">${price.toFixed(2)}</span>
      <span style="margin-right: 10px;">${dateString}</span>
      <div style="background-color: ${barColor}; width: ${barWidth}px; height: 20px;"></div>
    </div>
  `;
  }


  tradeInfoElement.innerHTML = tradeInfo + tradeInfoElement.innerHTML;
  }
  
  tradeStream.addEventListener('message', handleTradeMessage);
  
  tradeStream.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
  });
  
  tradeStream.addEventListener('close', () => {
  console.log('WebSocket closed.');
  }); 
