import axios from 'axios';
const products = require('../products.json');

const fetchGoldPrice = async () => {
  try {
    const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
      headers: {
        'x-access-token': process.env.GOLD_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const pricePerGram = response.data.price / 31.1035; // 1 troy ounce = 31.1035 grams
    return pricePerGram;
  } catch (error) {
    console.error('Error fetching gold price:', error.response?.data || error.message);
    return 85.2; // If the API fails, return a default value
  }
};

const allowedOrigins = ['https://jewelry-products.netlify.app'];

exports.handler = async (event) => {
    const origin = event.headers.origin;
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://jewelry-products.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

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

