# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import sqlite3
import requests
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS more specifically
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database configuration
DB_NAME = "fundraiser.db"

# Paystack configuration (for Ghana payments)
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
if not PAYSTACK_SECRET_KEY:
    print("WARNING: Paystack API key not found. Please set PAYSTACK_SECRET_KEY in your .env file")
PAYSTACK_API_URL = "https://api.paystack.co"

# Initialize database
def init_db():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS donations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            amount REAL NOT NULL,
            message TEXT,
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            reference TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            goal REAL NOT NULL,
            current_amount REAL NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT,
            status TEXT NOT NULL
        )
        ''')
        
        # Insert a default event if none exists
        cursor.execute("SELECT COUNT(*) FROM events")
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
            INSERT INTO events (id, name, description, goal, current_amount, start_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4()),
                "Memorial Fund for James Agyeman",
                "We are deeply saddened by the loss of our classmate's father, Mr. James Agyeman. As a class, we are coming together to support our friend during this difficult time.",
                5000.0,
                2250.0,
                datetime.now().isoformat(),
                "active"
            ))
        
        conn.commit()
        conn.close()
        print("Database initialized successfully!")
        return True
    except Exception as e:
        print(f"Database initialization error: {e}")
        return False

# Initialize Paystack payment
def initialize_paystack_transaction(email, amount, reference):
    if not PAYSTACK_SECRET_KEY:
        print("ERROR: Cannot initialize payment without Paystack API key")
        return {"status": False, "message": "Payment service not configured"}
    
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    # Get callback URL (handle both development and production)
    base_url = request.host_url.rstrip('/')
    callback_url = f"{base_url}/api/verify_payment"
    
    data = {
        "email": email,
        "amount": int(amount * 100),  # Convert to pesewas (smallest unit)
        "currency": "GHS",
        "reference": reference,
        "callback_url": callback_url,
        "channels": ["card", "bank", "ussd", "qr", "mobile_money"]
    }
    
    try:
        response = requests.post(f"{PAYSTACK_API_URL}/transaction/initialize", json=data, headers=headers)
        return response.json()
    except requests.RequestException as e:
        print(f"Paystack API error: {e}")
        return {"status": False, "message": "Payment service unavailable"}

# Verify Paystack payment
def verify_paystack_transaction(reference):
    if not PAYSTACK_SECRET_KEY:
        return {"status": False, "message": "Payment service not configured"}
    
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"
    }
    
    try:
        response = requests.get(f"{PAYSTACK_API_URL}/transaction/verify/{reference}", headers=headers)
        return response.json()
    except requests.RequestException as e:
        print(f"Paystack verification error: {e}")
        return {"status": False, "message": "Payment verification failed"}

# Routes
@app.route('/api/event', methods=['GET'])
def get_event():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM events WHERE status = 'active' LIMIT 1")
        event = cursor.fetchone()
        
        if event:
            event_dict = dict(event)
            conn.close()
            return jsonify({"status": "success", "data": event_dict})
        else:
            conn.close()
            return jsonify({"status": "error", "message": "No active event found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/donate', methods=['POST'])
def donate():
    try:
        data = request.json
        print(f"Received donation request: {data}")
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'amount', 'paymentMethod']
        for field in required_fields:
            if field not in data:
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Generate unique reference
        reference = f"FUND-{str(uuid.uuid4())[:8]}"
        
        # Initialize payment with Paystack
        payment_response = initialize_paystack_transaction(data['email'], float(data['amount']), reference)
        
        if payment_response.get('status'):
            # Save donation to database with pending status
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            
            cursor.execute('''
            INSERT INTO donations (id, name, email, phone, amount, message, payment_method, payment_status, reference, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4()),
                data['name'],
                data['email'],
                data['phone'],
                float(data['amount']),
                data.get('message', ''),
                data['paymentMethod'],
                'pending',
                reference,
                datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            
            # Return payment authorization URL
            return jsonify({
                "status": "success", 
                "data": {
                    "reference": reference,
                    "authorization_url": payment_response['data']['authorization_url']
                }
            })
        else:
            error_msg = payment_response.get('message', 'Payment initialization failed')
            return jsonify({"status": "error", "message": error_msg}), 400
    except Exception as e:
        print(f"Donation error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/verify_payment', methods=['GET'])
def verify_payment():
    try:
        reference = request.args.get('reference')
        
        if not reference:
            return jsonify({"status": "error", "message": "No reference provided"}), 400
        
        # Verify payment with Paystack
        verify_response = verify_paystack_transaction(reference)
        
        if verify_response.get('status') and verify_response.get('data', {}).get('status') == 'success':
            # Update donation status in database
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            
            cursor.execute("UPDATE donations SET payment_status = 'success' WHERE reference = ?", (reference,))
            
            # Get the donation amount
            cursor.execute("SELECT amount FROM donations WHERE reference = ?", (reference,))
            donation = cursor.fetchone()
            
            if donation:
                amount = donation[0]
                
                # Update event current amount
                cursor.execute("UPDATE events SET current_amount = current_amount + ? WHERE status = 'active'", (amount,))
            
            conn.commit()
            conn.close()
            
            # Redirect to success page
            return jsonify({"status": "success", "message": "Payment verified successfully"})
        else:
            # Update donation status to failed
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            
            cursor.execute("UPDATE donations SET payment_status = 'failed' WHERE reference = ?", (reference,))
            conn.commit()
            conn.close()
            
            error_msg = verify_response.get('message', 'Payment verification failed')
            return jsonify({"status": "error", "message": error_msg}), 400
    except Exception as e:
        print(f"Payment verification error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/donations', methods=['GET'])
def get_donations():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM donations WHERE payment_status = 'success' ORDER BY created_at DESC")
        donations = cursor.fetchall()
        
        donations_list = [dict(donation) for donation in donations]
        conn.close()
        
        return jsonify({"status": "success", "data": donations_list})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Simple health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "success", "message": "API is running"})

# Run the app
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Default to 5000 if not set
    if init_db():
        print(f"Starting Flask server on port {port}...")
        app.run(debug=False, host='0.0.0.0', port=port)
    else:
        print("Failed to initialize database. Exiting.")