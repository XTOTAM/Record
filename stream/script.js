  const symbol = 'btcusdt';
  const tradeStreamUrl = `wss://stream.binance.com:9443/ws/${symbol}@trade`;

  const tradeStream = new WebSocket(tradeStreamUrl);

  // Initialize a rolling window of the last 100 trade quantities
  const last100TradeQuantities = [];
  const maxTrades = 100;

  function calculateStandardDeviation(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDifferences = data.map(val => (val - mean) * (val - mean));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / squaredDifferences.length;
    return Math.sqrt(variance);
  }

  function handleTradeMessage(event) {
    const tradeData = JSON.parse(event.data);
    const tradeInfoElement = document.getElementById('tradeInfo');
    const quantity = parseFloat(tradeData.q);
    const price = parseFloat(tradeData.p);
  
    // Add the current trade quantity to the rolling window
    last100TradeQuantities.push(quantity);
  
    // If the rolling window exceeds the maximum size, remove the oldest trade quantity
    if (last100TradeQuantities.length > maxTrades) {
      last100TradeQuantities.shift();
    }
  
    // Calculate the average trade quantity and standard deviation
    const averageQuantity = last100TradeQuantities.reduce((sum, q) => sum + q, 0) / last100TradeQuantities.length;
    const standardDeviation = calculateStandardDeviation(last100TradeQuantities);
  
    // Normalize the current trade quantity using the average trade quantity
    const normalizedQuantity = quantity / averageQuantity;
  
    const barColor = tradeData.m ? 'red' : 'green';
    const barWidth = Math.abs(normalizedQuantity) * 50; // Adjust the multiplier for better visualization
  
    // Anomaly detection: check if the trade is more than 3 standard deviations away from the mean
    const anomalyThreshold = 3;
    const isAnomaly = Math.abs(quantity - averageQuantity) > anomalyThreshold * standardDeviation;
    const anomalyLabel = isAnomaly ? 'ANOMALY' : '';
  
    const tradeInfo = `
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="margin-right: 10px;">${price.toFixed(2)}</span>
        <div style="background-color: ${barColor}; width: ${barWidth}px; height: 20px;"></div>
        <span style="margin-left: 10px; color: ${isAnomaly ? 'red' : ''};">${anomalyLabel}</span>
      </div>
    `;
  
    tradeInfoElement.innerHTML = tradeInfo + tradeInfoElement.innerHTML;
  }
  


  tradeStream.addEventListener('message', handleTradeMessage);

  tradeStream.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });

  tradeStream.addEventListener('close', () => {
    console.log('WebSocket closed.');
  });
