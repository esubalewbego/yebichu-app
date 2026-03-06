const axios = require('axios');

const initializePayment = async (req, res) => {
  try {
    const { amount, currency, email, first_name, last_name, phone_number, tx_ref, callback_url, return_url } = req.body;

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount,
        currency: currency || 'ETB',
        email,
        first_name,
        last_name,
        phone_number,
        tx_ref,
        callback_url,
        return_url,
        "customization[title]": "Yebichu Booking",
        "customization[description]": "Payment for grooming services",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('---- CHAPA INITIALIZE ERROR ----');
    console.error('Request Body:', req.body);
    console.error('Error Details:', error.response ? error.response.data : error.message);
    console.error('--------------------------------');
    res.status(500).json({
      error: error.response ? error.response.data : error.message
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({
      error: error.response ? error.response.data : error.message
    });
  }
};

module.exports = { initializePayment, verifyPayment };
