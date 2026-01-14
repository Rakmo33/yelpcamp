# 🥾 HikeHub

HikeHub is a full-stack web application for discovering, reviewing, and managing trekking destinations.  
It demonstrates real-world backend engineering concepts such as authentication, payments, geolocation, role-based access, and secure data handling.

---

## 🧠 What This Project Demonstrates

- Building a **production-style Node.js application**
- Secure authentication with **email verification**
- **Payment integration** using Stripe
- **Geospatial data handling** with maps
- Clean **RESTful API design**
- End-to-end **CRUD workflows**
- Scalable MongoDB schema design

---

## 🛠️ Tech Stack (with Rationale)

### 🌐 Frontend
- **HTML, CSS, JavaScript** — Core web technologies for building a responsive and accessible UI
- **EJS** — Server-side templating to dynamically render pages with backend data

---

### ⚙️ Backend
- **Node.js** — Event-driven runtime ideal for scalable I/O-heavy applications
- **Express.js** — Minimal and flexible framework for building RESTful APIs

---

### 🗄️ Database
- **MongoDB** — NoSQL database suited for hierarchical data like posts, comments, and users
- **Mongoose** — ODM for schema validation, relationships, and query abstraction

---

### 🔐 Authentication & Security
- **Passport.js** — Handles authentication strategies and session management
- **JWT / Sessions** — Secure user sessions and access control
- **Email OTP Verification** — Ensures verified users during registration
- **Role-Based Access Control** — Differentiates admin and regular user privileges

---

### 💳 Payments
- **Stripe** — Secure and industry-standard payment processing for user registration

---

### 🗺️ Maps & Geolocation
- **Google Maps API** — Displays trek locations using real-world coordinates
- **Geocoding** — Converts human-readable locations into latitude/longitude

---

### 🖼️ Media Handling
- **Cloudinary** — Cloud-based image storage and optimization
- **Multer** — Middleware for handling multipart file uploads

---

### 🔍 Search
- **Fuzzy Search** — Improves user experience by allowing flexible text matching

---

### 🧪 Tooling & Dev Practices
- **dotenv** — Environment-based configuration for secrets and keys
- **Nodemon** — Faster development with auto-reload
- **Git & GitHub** — Version control and collaboration

---

## ✨ Core Features (Tech-Oriented)

- Secure user registration with **OTP email verification**
- **Stripe-powered payment flow** during signup
- Full **CRUD operations** for trek posts and comments
- **Geospatial visualization** of treks on interactive maps
- **Ratings and reviews** system
- Admin moderation tools
- Search and filtering capabilities

---

## 🖼️ Demo Screenshots

### 🏕️ Landing Page
![Landing Page](./img/Screenshot%202026-01-13%20at%204.45.05 PM.png)

### 🏞️ Trek Details Page
![Single Post](./img/Screenshot%202026-01-13%20at%204.45.23 PM.png)

### ⭐ Ratings & Comments
![Ratings & Comments](./img/Screenshot%202026-01-13%20at%204.45.26 PM.png)

---

## 🎥 Demo GIFs

### 🔐 User Registration (OTP Email + Stripe Payment)
![Registration Demo](./img/gif1.gif)

### 🗺️ Trek Posts, Geolocation & Comments
![Trek Interaction Demo](./img/gif2.gif)

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js
- MongoDB (local installation)

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Rakmo33/HikeHub_Blog_App.git
cd HikeHub_Blog_App
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Environment Configuration

Create a .env file in the root directory:

```bash
# Database
DATABASE_URL=mongodb://localhost/yelp_camp

# Email (OTP Verification)
GMAILPW=your_gmail_app_password

# Payments (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Geocoding / Maps
GEOCODER_API_KEY=your_geocoder_api_key

# Real-time Features
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_KEY=your_pusher_app_key
PUSHER_APP_SECRET=your_pusher_app_secret
PUSHER_APP_CLUSTER=your_pusher_app_cluster

# Media Storage
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4️⃣ Start MongoDB
```bash
mongod
```

### 5️⃣ Run the Application
```bash
npm start
```

### 6️⃣ Visit 👉 http://localhost:8000

## 💳 Stripe Test Card (Development Only)

Use the following Stripe test card details for testing the registration payment flow:

```yaml
Card Number: 4242 4242 4242 4242
Expiry Date: 12 / 34
CVV: 123
ZIP Code: 12345
```

## 🚀 Why This Project Matters

HikeHub is not a UI demo — it reflects real-world backend challenges:

- Authentication flows
- Payments
- Secure data handling
- API design
- External service integrations
- This project mirrors how production applications are built and maintained.


## 🤝 Acknowledgements

HikeHub is inspired by the **YelpCamp project** from the *Full Stack Web Developer Bootcamp* by **Colt Steele** on Udemy.  
This project was built independently, adding trekking-focused features, custom UI, and personal enhancements.
