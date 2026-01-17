# THE SHOP

## Features

- Full featured shopping cart
- Product reviews and ratings
- Top products carousel
- Product pagination
- Product search feature
- User profile with orders
- Admin product management
- Admin user management
- Admin Order details page
- Mark orders as delivered option
- Checkout process (shipping, payment method, etc)
- PayPal / credit card integration
- Database seeder (products & users)
  
## Usage

### Env Variables

Create a .env file in then root and add the following

```
NODE_ENV = 'production'
PORT = 5000
MONGO_URI = your mongo_database url
JWT_SECRET = 'mernshop'
PAYPAL_CLIENT_ID = your paypal_client_id
CLINET_ID= your client_id
CLIENT_SECRET= your client secret
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
