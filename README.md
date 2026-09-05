# THE SHOP

## Features

- Full-featured e-commerce platform
- Admin management
- Seller and buyer roles
- Discounts and notifications
- Real-time chat and chatbot
  
## Usage

### Env Variables

Create a .env file in then root and add the following

```
NODE_ENV = 'production'
PORT = 5000
MONGO_URI = your mongo_database url
JWT_SECRET = your jwt_secret
PAYPAL_CLIENT_ID = your paypal_client_id
CLINET_ID = your client_id
CLIENT_SECRET = your client secret
BREVO_USER= brevo_username
BREVO_PASS = brevo password
BREVO_API_KEY = brevo api key
```
### Install Dependencies

```
# Install backend
npm install 
# Install frontend
cd frontend 
npm install
```

### Run

```
# Run frontend (:3000) & backend (:5000)
npm run dev

# Run production
npm start

```
## Build & Deploy

```
# Create frontend production build
cd frontend
npm run build
```

### Seed Database

```
# Import data
npm run data:import

# Destroy data
npm run data:destroy
```
