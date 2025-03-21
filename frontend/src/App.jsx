import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, DollarSign, Heart, User, Mail, Phone, MessageSquare } from 'lucide-react';
import './App.css';
import { getEventDetails, submitDonation } from './services/api';

function App() {
  const [donationAmount, setDonationAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [isLoading, setIsLoading] = useState(false);
  const [event, setEvent] = useState({
    name: "Memorial Fund for Samuel's Mother",
    description:
      "We are deeply saddened by the loss of our classmate's mother, Mr. Samuel Asante. As a class, we are coming together to support our friend during this difficult time.",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await getEventDetails();
        if (response.status === 'success') {
          // You can extract additional fields (e.g., goal, current_amount) if needed
          setEvent(response.data);
        } else {
          setError('Failed to load event details.');
        }
      } catch (err) {
        console.error('Failed to fetch event details:', err);
        setError('An error occurred while fetching event details.');
      }
    };

    fetchEventDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await submitDonation({
        name,
        email,
        phone,
        amount: donationAmount,
        message,
        paymentMethod,
      });
  
      if (response.status === 'success') {
        // Store the authorization URL
        const authUrl = response.data.authorization_url;
        
        // Add a small delay before redirecting
        setTimeout(() => {
          window.location.href = authUrl;
        }, 500);
      } else {
        setError('Payment initialization failed. Please try again.');
      }
    } catch (err) {
      console.error('Donation submission error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="py-10 bg-gradient-to-r from-purple-700 to-pink-600">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-white">
            Class Fundraiser
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-xl shadow-lg overflow-hidden bg-white">
          {/* Banner */}
          <div className="h-72 flex items-center justify-center bg-gradient-to-b from-purple-50 via-pink-50 to-white border-b border-purple-100">
            <div className="text-center px-4">
              <div className="bg-pink-50 p-5 rounded-full inline-block mb-6 shadow-sm">
                <Heart className="mx-auto" size={52} strokeWidth={1.5} color="#be185d" />
              </div>
              <h2 className="text-3xl font-bold text-purple-900 mb-3">
                {event.name}
              </h2>
              <p className="text-pink-600 font-medium">Supporting Our Community</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-semibold mb-5 text-purple-900 border-b border-purple-100 pb-3">
                About This Fundraiser
              </h3>
              <p className="mb-12 text-gray-700 leading-relaxed text-lg">
                {event.description}
              </p>

              {showSuccess && (
                <div className="px-6 py-5 rounded-lg mb-8 bg-green-50 border border-green-200 text-green-700">
                  <div className="flex items-center">
                    <CheckCircle className="mr-3 text-green-500" size={24} />
                    <span className="font-medium">Thank you for your contribution!</span>
                  </div>
                  <p className="mt-2 ml-9">Your donation has been received successfully.</p>
                </div>
              )}

              {error && (
                <div className="px-6 py-5 rounded-lg mb-8 bg-red-50 border border-red-200 text-red-700">
                  <span className="font-medium">Error:</span> {error}
                </div>
              )}

              {/* Donation Form */}
              <form onSubmit={handleSubmit} className="bg-white">
                <h3 className="text-2xl font-semibold mb-6 text-purple-800 border-b border-purple-100 pb-3">
                  Make a Contribution
                </h3>

                {/* Donation Amount */}
                <div className="mb-10">
                  <label htmlFor="amount" className="block font-medium mb-3 text-purple-900">
                    Donation Amount (GHS)
                  </label>
                  <div className="flex flex-wrap gap-3 mb-5">
                    {[50, 100, 200, 500].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setDonationAmount(amount.toString())}
                        className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                          donationAmount === amount.toString()
                            ? 'bg-pink-600 text-white shadow-md'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        GHS {amount}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="number"
                      id="amount"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Enter custom amount"
                      required
                    />
                  </div>
                </div>

                {/* Personal Information */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label htmlFor="name" className="block font-medium mb-2 text-purple-900">
                      Your Name
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label htmlFor="email" className="block font-medium mb-2 text-purple-900">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="mb-8">
                  <label htmlFor="phone" className="block font-medium mb-2 text-purple-900">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="mb-10">
                  <label htmlFor="message" className="block font-medium mb-2 text-purple-900">
                    Message (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare size={18} className="absolute left-3 top-3 text-gray-500" />
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Leave a message of support"
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-10">
                  <label className="block font-medium mb-4 text-purple-900">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'momo', title: 'Mobile Money', detail: 'MTN, Vodafone, AirtelTigo', icon: Phone },
                      { id: 'card', title: 'Credit/Debit Card', detail: 'Visa, Mastercard', icon: CreditCard },
                      { id: 'transfer', title: 'Bank Transfer', detail: 'Direct deposit', icon: DollarSign },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`border p-4 rounded-lg flex items-center cursor-pointer transition-all duration-200 ${
                          paymentMethod === method.id
                            ? 'bg-purple-50 border-purple-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-pink-200 hover:bg-pink-50/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="mr-3 accent-pink-600"
                        />
                        <div>
                          <div className="font-medium text-purple-900">
                            {method.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {method.detail}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-4 px-6 rounded-lg shadow-md transition duration-200 font-semibold text-lg ${
                    isLoading 
                      ? 'bg-pink-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-lg'
                  }`}
                  disabled={isLoading}
                  style={{ color: '#fff' }}
                >
                  {isLoading ? 'Processing...' : 'Donate Now'}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-8 border-t bg-purple-50">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold mb-4 text-purple-900">
                Contact Information
              </h3>
              <div className="leading-relaxed text-gray-700 bg-white p-6 rounded-lg shadow-sm">
                <p className="mb-4">
                  For any questions or assistance, please contact:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <User className="mr-3 text-pink-600" size={18} />
                    <div>
                      <span className="text-gray-500">Class Prefect:</span>
                      <div className="font-medium text-purple-900">Albert Amoako</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-3 text-pink-600" size={18} />
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium text-purple-900">+233 20 192 9434</div>
                    </div>
                  </div>
                  <div className="flex items-center md:col-span-2">
                    <Mail className="mr-3 text-pink-600" size={18} />
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <div className="font-medium text-purple-900">info.me.albert@gmail.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-gradient-to-r from-purple-800 to-pink-700 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="mb-2">© 2025 Class Fundraiser. All rights reserved.</p>
          <p className="text-sm text-pink-100">Supporting our community in times of need</p>
          <p className="text-sm text-pink-100">Let's gather our Arsenals</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
