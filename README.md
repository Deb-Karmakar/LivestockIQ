# 🐄 LivestockIQ

> **A comprehensive livestock management system designed for farmers and veterinarians**

LivestockIQ is a full-stack web application that enables efficient livestock management, health tracking, treatment scheduling, and veterinary coordination. Built with modern technologies, it provides separate interfaces for farmers and veterinarians to collaborate effectively.

## 🌟 Features

### For Farmers:
- **Animal Management**: Register and track livestock with detailed information
- **Health Monitoring**: Record health status, treatments, and medical history
- **Treatment Tracking**: Schedule and monitor animal treatments
- **Prescription Management**: View and manage veterinary prescriptions
- **Barcode Scanning**: Quick animal identification using QR/barcode scanning
- **Dashboard Analytics**: View livestock statistics and health insights
- **Alert System**: Get notified about upcoming treatments and health issues

### For Veterinarians:
- **Patient Management**: Access farmer's livestock information
- **Treatment Requests**: Receive and manage treatment requests from farmers
- **Prescription Writing**: Create and send digital prescriptions
- **Farmer Directory**: Maintain client database
- **Medical Records**: Comprehensive animal health history
- **Report Generation**: Generate treatment and health reports

### Technical Features:
- **Authentication System**: Secure login for farmers and veterinarians
- **Role-based Access**: Different interfaces based on user roles
- **PDF Generation**: Automatic prescription and treatment report PDFs
- **Email Notifications**: Automated email alerts and communications
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live data synchronization

## 🛠️ Tech Stack

### Backend:
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation
- **Nodemailer** - Email functionality
- **CORS** - Cross-origin resource sharing

### Frontend:
- **React 19** - UI library with modern hooks
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and state management
- **Framer Motion** - Animations and transitions
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Lucide React** - Icon library

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v6.0 or higher) - [Download here](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- **Git** - [Download here](https://git-scm.com/downloads)
- **npm** or **yarn** package manager (comes with Node.js)

## 🚀 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Deb-Karmakar/LivestockIQ.git
cd LivestockIQ
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd Backend
```

#### Install Backend Dependencies
```bash
npm install
```

#### Create Environment File
Create a `.env` file in the Backend directory:

```bash
touch .env
```

Add the following environment variables to your `.env` file:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/livestockiq
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/livestockiq

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Optional - for email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

#### Start MongoDB
Make sure MongoDB is running on your system:

**Local MongoDB:**
```bash
# On Windows
net start MongoDB

# On macOS (with Homebrew)
brew services start mongodb/brew/mongodb-community

# On Ubuntu/Linux
sudo systemctl start mongod
```

**Or use MongoDB Atlas (Cloud):**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- Create a new cluster
- Get your connection string and replace `MONGO_URI` in the `.env` file

#### Start the Backend Server
```bash
npm start
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

#### Open a New Terminal and Navigate to Frontend Directory
```bash
cd Frontend/LivestockIQ
```

#### Install Frontend Dependencies
```bash
npm install
```

#### Start the Frontend Development Server
```bash
npm run dev
```

The frontend application will start on `http://localhost:5173`

## 🎯 Usage

### 1. Access the Application
Open your browser and go to `http://localhost:5173`

### 2. Create an Account
- Choose your role (Farmer or Veterinarian)
- Fill in the registration form
- Verify your account (if email is configured)

### 3. Login
Use your credentials to log into the system

### 4. Start Managing Livestock
- **Farmers**: Add animals, schedule treatments, view prescriptions
- **Veterinarians**: Manage treatment requests, write prescriptions, view patient records

## 🏗️ Project Structure

```
LivestockIQ/
├── Backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   ├── animal.controller.js
│   │   ├── auth.controller.js
│   │   ├── treatment.controller.js
│   │   └── vet.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js  # Authentication middleware
│   ├── models/
│   │   ├── animal.model.js
│   │   ├── farmer.model.js
│   │   ├── treatment.model.js
│   │   └── vet.model.js
│   ├── routes/
│   │   ├── animal.routes.js
│   │   ├── auth.routes.js
│   │   ├── prescription.routes.js
│   │   ├── treatment.routes.js
│   │   └── vet.routes.js
│   ├── utils/
│   │   ├── createPrescriptionPdf.js
│   │   ├── createTreatmentPdf.js
│   │   └── sendEmail.js
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
│
├── Frontend/LivestockIQ/
│   ├── public/
│   │   ├── logo.png
│   │   └── ...
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── animals/       # Animal-related components
│   │   │   └── layout/        # Layout components
│   │   ├── pages/
│   │   │   ├── farmer/        # Farmer-specific pages
│   │   │   ├── vet/           # Veterinarian-specific pages
│   │   │   └── ...
│   │   ├── services/          # API service functions
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── ...
│
├── .gitignore
└── README.md
```

## 🔧 Development Scripts

### Backend Scripts
```bash
cd Backend

# Start development server with auto-restart
npm start

# Run in production mode
npm run prod
```

### Frontend Scripts
```bash
cd Frontend/LivestockIQ

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Animals
- `GET /api/animals` - Get all animals
- `POST /api/animals` - Create new animal
- `GET /api/animals/:id` - Get animal by ID
- `PUT /api/animals/:id` - Update animal
- `DELETE /api/animals/:id` - Delete animal

### Treatments
- `GET /api/treatments` - Get all treatments
- `POST /api/treatments` - Create new treatment
- `GET /api/treatments/:id` - Get treatment by ID
- `PUT /api/treatments/:id` - Update treatment

### Veterinarians
- `GET /api/vets` - Get all vets
- `GET /api/vets/requests` - Get treatment requests
- `POST /api/vets/prescriptions` - Create prescription

## 🚀 Deployment

### Backend Deployment (Railway/Heroku/DigitalOcean)

1. **Set Environment Variables:**
   ```env
   MONGO_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   NODE_ENV=production
   ```

2. **Deploy to Railway:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Build the application:**
   ```bash
   cd Frontend/LivestockIQ
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Deb Karmakar**
- GitHub: [@Deb-Karmakar](https://github.com/Deb-Karmakar)
- Repository: [LivestockIQ](https://github.com/Deb-Karmakar/LivestockIQ)

## 🐛 Issues & Support

If you encounter any issues or need support:
1. Check existing [Issues](https://github.com/Deb-Karmakar/LivestockIQ/issues)
2. Create a [New Issue](https://github.com/Deb-Karmakar/LivestockIQ/issues/new)
3. Provide detailed information about the problem

## 🙏 Acknowledgments

- Thanks to all the open-source libraries that made this project possible
- Special thanks to the React and Node.js communities
- MongoDB for providing excellent database solutions
- Vercel and Railway for deployment platforms

---

**Happy Livestock Management! 🐄🚀**
