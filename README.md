# 🐄 LivestockIQ

> **A comprehensive livestock management system designed for farmers and veterinarians**

LivestockIQ is a full-stack web application that enables efficient livestock management, health tracking, treatment scheduling, and veterinary coordination. Built with modern technologies, it provides separate interfaces for farmers and veterinarians to collaborate effectively.

## 🌟 Features

### 🧑‍🌾 For Farmers:
#### Animal & Herd Management
- **Complete Animal Registry**: Register livestock with official 12-digit ear tag IDs
- **Detailed Animal Profiles**: Track name, species, gender, date of birth, weight, and status
- **QR/Barcode Scanning**: Quick animal identification and registration
- **Animal History Tracking**: View complete medical and treatment history for each animal
- **Status Management**: Mark animals as Active, Sold, or Culled
- **Age Calculation**: Automatic age calculation from date of birth

#### Health & Treatment Management
- **Treatment Scheduling**: Request and schedule treatments for livestock
- **Treatment History**: Complete log of all treatments with status tracking
- **Withdrawal Period Monitoring**: Automatic tracking of drug withdrawal periods
- **Treatment Filtering**: Filter treatments by status, date, and other criteria
- **Prescription Management**: View and manage veterinary prescriptions
- **Health Alerts**: Get notified about upcoming treatments and health issues

#### Inventory & Supply Management
- **Drug Inventory System**: Track veterinary medicines and supplies
- **Expiry Date Monitoring**: Automatic alerts for expiring medications
- **Stock Level Tracking**: Monitor quantities and units of inventory items
- **Supplier Management**: Track suppliers and purchase information
- **Inventory Reports**: Generate reports on stock levels and usage

#### Sales & Compliance Management
- **Safe-to-Sell Tracking**: Automatic verification of withdrawal period compliance
- **Sales Logging**: Record sales of animal products with safety checks
- **Revenue Tracking**: Monitor sales prices and total revenue
- **Compliance Verification**: Ensure products meet safety standards before sale
- **Sales History**: Complete log of all recorded sales transactions

#### Reporting & Analytics
- **Dashboard Overview**: Real-time statistics and key metrics
- **AMU Reports**: Antimicrobial Usage reports with PDF generation
- **Treatment Analytics**: Analysis of treatment patterns and drug usage
- **Farm Performance Metrics**: Track livestock productivity and health trends
- **Custom Date Ranges**: Generate reports for specific time periods

### 👨‍⚕️ For Veterinarians:
#### Patient & Farm Management
- **Multi-Farm Access**: Manage multiple farmer clients
- **Animal Database**: Access detailed information for all client animals
- **Farmer Directory**: Maintain comprehensive client database
- **Treatment History**: View complete medical records for all animals
- **Cross-Farm Analytics**: Compare treatment patterns across farms

#### Treatment & Prescription Management
- **Treatment Request Processing**: Review and approve/reject treatment requests
- **Digital Prescriptions**: Create and send electronic prescriptions
- **Treatment Planning**: Schedule and plan treatment protocols
- **Drug Dosage Calculations**: Calculate appropriate drug dosages
- **Withdrawal Period Setting**: Set and manage withdrawal periods
- **Treatment Status Tracking**: Monitor treatment progress and outcomes

#### Professional Tools
- **Clinical Decision Support**: Access to treatment protocols and guidelines
- **Prescription Templates**: Pre-configured prescription formats
- **Treatment Protocols**: Standardized treatment procedures
- **Medical Record Management**: Comprehensive patient documentation
- **Regulatory Compliance**: Ensure all treatments meet regulatory standards

#### Reporting & Analysis
- **Farm-specific Reports**: Generate AMU reports for individual farms
- **Treatment Analytics**: Analyze treatment effectiveness and patterns
- **Compliance Monitoring**: Track regulatory compliance across all farms
- **Professional Reports**: Generate reports for regulatory authorities

### 🏛️ For Regulators:
#### Oversight & Monitoring
- **Multi-Farm Dashboard**: Overview of all registered farms and veterinarians
- **Compliance Statistics**: Real-time compliance rates and violations
- **Treatment Trend Analysis**: Monitor antimicrobial usage patterns
- **Geographic Heat Maps**: Visual representation of treatment intensity by location
- **Alert System**: Automatic alerts for compliance violations

#### Regulatory Management
- **Farm Registration**: Oversee farm and veterinarian registrations
- **Compliance Alerts**: Track and manage compliance violations
- **Audit Trail**: Complete audit logs for all system activities
- **Regulatory Reporting**: Generate reports for government agencies
- **Policy Enforcement**: Monitor adherence to antimicrobial usage policies

#### Analytics & Demographics
- **Population Analytics**: Track livestock demographics and trends
- **AMU Trend Analysis**: Monitor antimicrobial usage over time
- **Compliance Trends**: Track improvement or deterioration in compliance
- **Geographic Distribution**: Map view of farms and treatment activities
- **Statistical Reports**: Comprehensive statistical analysis and reporting

### 🔧 Technical Features:
#### Security & Authentication
- **Multi-Role Authentication**: Secure login for farmers, veterinarians, and regulators
- **Role-based Access Control**: Different interfaces and permissions based on user roles
- **JWT Token Security**: Secure API authentication with JSON Web Tokens
- **Password Encryption**: bcrypt hashing for secure password storage
- **Session Management**: Secure session handling and token refresh

#### Data Management & Integration
- **MongoDB Database**: Scalable NoSQL database with Mongoose ODM
- **Real-time Synchronization**: Live data updates across all user interfaces
- **Data Validation**: Comprehensive server-side and client-side validation
- **Audit Logging**: Complete audit trail for all data changes
- **Data Export**: Export data in multiple formats (PDF, CSV, JSON)

#### Communication & Notifications
- **Email Integration**: Automated email notifications with Nodemailer
- **PDF Generation**: Automatic generation of prescriptions and reports
- **Alert System**: Real-time alerts for critical events
- **Communication Hub**: Centralized communication between all user types
- **Notification Preferences**: Customizable notification settings

#### User Experience & Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI Components**: Built with shadcn/ui component library
- **Interactive Dashboards**: Real-time charts and analytics with Recharts
- **Dark/Light Mode**: Theme switching for user preference
- **Accessibility**: WCAG compliant interface design

#### Advanced Features
- **Offline Capability**: Works with intermittent internet connectivity
- **Data Caching**: Intelligent caching for improved performance
- **Search & Filtering**: Advanced search and filtering across all data
- **Barcode Integration**: QR code and barcode scanning capabilities
- **Geographic Services**: Location-based features and mapping
- **Multi-language Support**: Internationalization ready

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
│   │   └── db.js                        # Database configuration
│   ├── controllers/
│   │   ├── animal.controller.js         # Animal management
│   │   ├── auth.controller.js           # Authentication & authorization
│   │   ├── farmer.controller.js         # Farmer profile management
│   │   ├── inventory.controller.js      # Inventory management
│   │   ├── prescription.controller.js   # Prescription handling
│   │   ├── regulator.controller.js      # Regulatory oversight
│   │   ├── reports.controller.js        # Report generation
│   │   ├── sales.controller.js          # Sales tracking
│   │   ├── treatment.controller.js      # Treatment management
│   │   └── vet.controller.js            # Veterinarian operations
│   ├── middlewares/
│   │   └── auth.middleware.js           # JWT authentication middleware
│   ├── models/
│   │   ├── animal.model.js              # Animal schema & model
│   │   ├── complianceAlert.model.js     # Compliance alerts
│   │   ├── farmer.model.js              # Farmer profile schema
│   │   ├── inventory.model.js           # Inventory item schema
│   │   ├── prescription.model.js        # Prescription schema
│   │   ├── regulator.model.js           # Regulator profile schema
│   │   ├── sale.model.js                # Sales record schema
│   │   ├── treatment.model.js           # Treatment record schema
│   │   └── vet.model.js                 # Veterinarian profile schema
│   ├── routes/
│   │   ├── animal.routes.js             # Animal management endpoints
│   │   ├── auth.routes.js               # Authentication endpoints
│   │   ├── farmer.routes.js             # Farmer-specific endpoints
│   │   ├── inventory.routes.js          # Inventory management endpoints
│   │   ├── prescription.routes.js       # Prescription endpoints
│   │   ├── regulator.routes.js          # Regulatory endpoints
│   │   ├── reports.routes.js            # Report generation endpoints
│   │   ├── sales.routes.js              # Sales tracking endpoints
│   │   ├── treatment.routes.js          # Treatment management endpoints
│   │   └── vet.routes.js                # Veterinarian endpoints
│   ├── utils/
│   │   ├── createPrescriptionPdf.js     # PDF generation for prescriptions
│   │   ├── createTreatmentPdf.js        # PDF generation for treatments
│   │   └── sendEmail.js                 # Email notification utility
│   ├── .env                         # Environment variables
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Main server entry point
│
├── Frontend/LivestockIQ/
│   ├── public/
│   │   ├── logo.png                     # Application logo
│   │   ├── pwa-192x192.png              # PWA icons
│   │   └── pwa-512x512.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                      # shadcn/ui component library
│   │   │   │   ├── button.jsx              # UI components
│   │   │   │   ├── card.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── table.jsx
│   │   │   │   ├── calendar.jsx
│   │   │   │   └── ... (40+ UI components)
│   │   │   ├── auth/                    # Authentication components
│   │   │   │   ├── FarmerSignUpStep.jsx
│   │   │   │   ├── LoginView.jsx
│   │   │   │   ├── RoleSelectionStep.jsx
│   │   │   │   └── VetSignUpStep.jsx
│   │   │   ├── animals/                 # Animal-specific components
│   │   │   │   └── BarcodeScannerDialog.jsx
│   │   │   └── layout/                  # Layout components
│   │   │       ├── AppLayout.jsx
│   │   │       ├── Footer.jsx
│   │   │       ├── Layout.jsx
│   │   │       └── VetAppLayout.jsx
│   │   ├── pages/
│   │   │   ├── farmer/                  # Farmer dashboard & pages
│   │   │   │   ├── AnimalsPage.jsx         # Animal registry & management
│   │   │   │   ├── DashboardPage.jsx       # Farmer dashboard
│   │   │   │   ├── AlertsPage.jsx          # Health alerts
│   │   │   │   ├── InventoryPage.jsx       # Drug inventory management
│   │   │   │   ├── ReportsPage.jsx         # AMU reports
│   │   │   │   ├── SellPage.jsx            # Sales logging
│   │   │   │   ├── SettingsPage.jsx        # Profile settings
│   │   │   │   └── TreatmentsPage.jsx      # Treatment management
│   │   │   ├── vet/                     # Veterinarian pages
│   │   │   │   ├── VetDashboardPage.jsx    # Vet dashboard
│   │   │   │   ├── TreatmentRequestsPage.jsx # Treatment requests
│   │   │   │   ├── FarmerDirectoryPage.jsx # Client management
│   │   │   │   ├── VetAnimalsPage.jsx      # Patient database
│   │   │   │   ├── VetPrescriptionsPage.jsx # Prescription management
│   │   │   │   ├── VetReportsPage.jsx      # Vet reports
│   │   │   │   ├── VetAlertsPage.jsx       # Vet alerts
│   │   │   │   └── VetSettingsPage.jsx     # Vet profile settings
│   │   │   ├── regulator/               # Regulatory oversight pages
│   │   │   │   ├── DashboardPage.jsx       # Regulatory dashboard
│   │   │   │   ├── CompliancePage.jsx      # Compliance monitoring
│   │   │   │   ├── TrendsPage.jsx          # AMU trend analysis
│   │   │   │   ├── DemographicsPage.jsx    # Livestock demographics
│   │   │   │   ├── MapViewPage.jsx         # Geographic heat maps
│   │   │   │   ├── ReportsPage.jsx         # Regulatory reports
│   │   │   │   └── SettingsPage.jsx        # Regulator settings
│   │   │   ├── AuthPage.jsx             # Authentication page
│   │   │   ├── HomePage.jsx             # Landing page
│   │   │   ├── LoginPage.jsx            # Login page
│   │   │   └── LandingPage.tsx          # Marketing landing page
│   │   ├── services/                    # API service functions
│   │   │   ├── animalService.js         # Animal API calls
│   │   │   ├── treatmentService.js      # Treatment API calls
│   │   │   ├── vetService.js            # Veterinarian API calls
│   │   │   ├── farmerService.js         # Farmer API calls
│   │   │   ├── inventoryService.js      # Inventory API calls
│   │   │   └── salesService.js          # Sales API calls
│   │   ├── contexts/                    # React contexts
│   │   │   └── AuthContext.jsx          # Authentication context
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── use-toast.js             # Toast notifications
│   │   │   ├── use-mobile.tsx           # Mobile detection
│   │   │   └── useTreatmentFilter.js    # Treatment filtering
│   │   ├── lib/                         # Utility functions
│   │   │   ├── utils.js                 # General utilities
│   │   │   └── queryClient.ts           # React Query client
│   │   ├── assets/                      # Static assets
│   │   │   └── generated_images/        # Generated images
│   │   ├── App.jsx                      # Main app component
│   │   ├── main.jsx                     # React entry point
│   │   └── index.css                    # Global styles
│   ├── package.json                     # Frontend dependencies
│   ├── tailwind.config.js               # Tailwind CSS configuration
│   ├── vite.config.js                   # Vite build configuration
│   ├── components.json                  # shadcn/ui components config
│   └── tsconfig.json                    # TypeScript configuration
│
├── .gitignore                           # Git ignore patterns
└── README.md                            # Project documentation
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
- `POST /api/auth/register` - Register new user (farmer/vet/regulator)
- `POST /api/auth/login` - User login with role-based access
- `GET /api/auth/me` - Get current authenticated user profile
- `POST /api/auth/logout` - User logout and token invalidation
- `POST /api/auth/refresh` - Refresh authentication token

### Animals
- `GET /api/animals` - Get all animals for authenticated farmer
- `POST /api/animals` - Register new animal with tag ID
- `GET /api/animals/:id` - Get specific animal details
- `PUT /api/animals/:id` - Update animal information
- `DELETE /api/animals/:id` - Delete animal record
- `GET /api/animals/:tagId/history` - Get complete treatment history

### Treatments
- `GET /api/treatments` - Get all treatments with filtering options
- `POST /api/treatments` - Request new treatment
- `GET /api/treatments/:id` - Get specific treatment details
- `PUT /api/treatments/:id` - Update treatment status/information
- `DELETE /api/treatments/:id` - Cancel treatment request
- `POST /api/treatments/:id/approve` - Approve treatment (vet only)
- `POST /api/treatments/:id/reject` - Reject treatment (vet only)

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `POST /api/prescriptions` - Create new prescription (vet only)
- `GET /api/prescriptions/:id` - Get prescription details
- `PUT /api/prescriptions/:id` - Update prescription
- `GET /api/prescriptions/:id/pdf` - Download prescription PDF

### Veterinarians
- `GET /api/vets` - Get all registered veterinarians
- `GET /api/vets/profile` - Get vet profile information
- `PUT /api/vets/profile` - Update vet profile
- `GET /api/vets/requests` - Get pending treatment requests
- `GET /api/vets/farmers` - Get farmer directory
- `GET /api/vets/animals` - Get all animals under vet's care
- `POST /api/vets/prescriptions` - Create digital prescription

### Farmers
- `GET /api/farmers/profile` - Get farmer profile information
- `PUT /api/farmers/profile` - Update farmer profile
- `GET /api/farmers/dashboard` - Get farmer dashboard statistics
- `GET /api/farmers/alerts` - Get farmer-specific alerts

### Inventory Management
- `GET /api/inventory` - Get all inventory items for farmer
- `POST /api/inventory` - Add new inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Remove inventory item
- `GET /api/inventory/expiring` - Get items expiring soon

### Sales Management
- `GET /api/sales` - Get all sales records for farmer
- `POST /api/sales` - Log new sale (with withdrawal period checks)
- `GET /api/sales/:id` - Get specific sale details
- `PUT /api/sales/:id` - Update sale record
- `DELETE /api/sales/:id` - Delete sale record
- `GET /api/sales/safe-animals` - Get animals safe for sale

### Reports & Analytics
- `POST /api/reports/amu` - Generate AMU report for farmer
- `POST /api/reports/farm-amu` - Generate farm AMU report for vet
- `GET /api/reports/dashboard` - Get dashboard analytics
- `POST /api/reports/custom` - Generate custom date-range reports
- `GET /api/reports/compliance` - Get compliance statistics

### Regulatory (Regulator Access)
- `GET /api/regulator/dashboard` - Get regulatory dashboard statistics
- `GET /api/regulator/compliance` - Get compliance data and trends
- `GET /api/regulator/trends` - Get antimicrobial usage trend analysis
- `GET /api/regulator/demographics` - Get livestock demographics
- `GET /api/regulator/farms` - Get all registered farms
- `GET /api/regulator/vets` - Get all registered veterinarians
- `POST /api/regulator/alerts` - Create compliance alerts
- `GET /api/regulator/heatmap` - Get treatment intensity heatmap data
- `POST /api/regulator/reports` - Generate regulatory reports

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
