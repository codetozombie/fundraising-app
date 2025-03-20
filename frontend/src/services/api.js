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
export const submitDonation = async (donationData) => {
  try {
    const response = await axios.post(`${API_URL}/donate`, donationData);
    return response.data;
  } catch (error) {
    console.error('Error submitting donation:', error);
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