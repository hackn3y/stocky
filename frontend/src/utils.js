// Export prediction to CSV
export const exportToCSV = (prediction, historicalData, stockInfo) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${prediction.symbol}_prediction_${timestamp}.csv`;

  let csvContent = "Stock Prediction Report\n\n";
  csvContent += "Symbol,Prediction,Confidence,Current Price,Up Probability,Down Probability\n";
  csvContent += `${prediction.symbol},${prediction.prediction},${prediction.confidence}%,$${prediction.current_price},${prediction.probabilities.up}%,${prediction.probabilities.down}%\n\n`;

  if (stockInfo) {
    csvContent += "Stock Information\n";
    csvContent += "Name,Exchange,Sector,Industry\n";
    csvContent += `"${stockInfo.name}",${stockInfo.exchange},${stockInfo.sector || 'N/A'},${stockInfo.industry || 'N/A'}\n\n`;
  }

  if (historicalData && historicalData.length > 0) {
    csvContent += "Historical Data (Last 30 Days)\n";
    csvContent += "Date,Price\n";
    historicalData.slice(-30).forEach(data => {
      csvContent += `${data.date},${data.price}\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// Share prediction
export const sharePrediction = (prediction, platform = 'twitter') => {
  const text = `${prediction.symbol} prediction: ${prediction.prediction} with ${prediction.confidence.toFixed(1)}% confidence! 📈\n\nCheck it out at https://stocky-mu.vercel.app/`;

  const urls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://stocky-mu.vercel.app/')}&summary=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://stocky-mu.vercel.app/')}&quote=${encodeURIComponent(text)}`
  };

  window.open(urls[platform] || urls.twitter, '_blank', 'width=600,height=400');
};

// Copy to clipboard
export const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    return true;
  }
  return false;
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Calculate portfolio statistics
export const calculatePortfolioStats = (portfolio) => {
  const totalValue = portfolio.reduce((sum, item) => sum + (item.shares * item.currentPrice), 0);
  const totalCost = portfolio.reduce((sum, item) => sum + (item.shares * item.purchasePrice), 0);
  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalPL,
    totalPLPercent
  };
};
