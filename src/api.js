const axios = require('axios');
const products = require('../products.json');

const fetchGoldPrice = async () => {
  try {
    const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
      headers: {
        'x-access-token': 'goldapi-2qoqfsm4ng7qkv-io',
        'Content-Type': 'application/json',
      },
    });

    const pricePerGram = response.data.price / 31.1035; // 1 troy ounce = 31.1035 grams
    return pricePerGram;
  } catch (error) {
    console.error('Error fetching gold price:', error.message);
    return 85; // Fallback default
  }
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://jewelry-products.netlify.app/',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
    };
  }

  const goldPrice = await fetchGoldPrice();

  const enrichedProducts = products.map((product) => {
    const price = ((product.popularityScore + 1) * product.weight * goldPrice).toFixed(2);
    return {
      ...product,
      price: parseFloat(price),
      popularityScore: parseFloat((product.popularityScore * 5).toFixed(1)),
    };
  });

  const queryParams = event.queryStringParameters || {};
  const { minPrice, maxPrice, minPopularity, maxPopularity } = queryParams;

  const filteredProducts = enrichedProducts.filter((product) => {
    const priceFilter =
      (!minPrice || product.price >= parseFloat(minPrice)) &&
      (!maxPrice || product.price <= parseFloat(maxPrice));

    const popularityFilter =
      (!minPopularity || product.popularityScore >= parseFloat(minPopularity)) &&
      (!maxPopularity || product.popularityScore <= parseFloat(maxPopularity));

    return priceFilter && popularityFilter;
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(filteredProducts),
  };
};

