// src/services/api.js
import axios from 'axios';

const API_URL = 'https://fund-backend.onrender.com/api'; ;


// Get event details
export const getEventDetails = async () => {
  try {
    const response = await axios.get(`${API_URL}/event`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
};

// Submit donation
// src/services/api.js
export const submitDonation = async (donationData) => {
  try {
    // Add a longer timeout for the payment initialization
    const response = await axios.post(`${API_URL}/donate`, donationData, {
      timeout: 30000 // 30 seconds
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting donation:', error);
    // Properly handle and rethrow the error
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request was made but no response received');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

// Get list of donations
export const getDonations = async () => {
  try {
    const response = await axios.get(`${API_URL}/donations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching donations:', error);
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(`${API_URL}/verify_payment?reference=${reference}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};