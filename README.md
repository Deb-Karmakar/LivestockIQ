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
- **MRL (Maximum Residue Limit) Compliance**: Track drug residue limits and safety periods

#### Health & Treatment Management
- **Treatment Scheduling**: Request and schedule treatments for livestock
- **Treatment History**: Complete log of all treatments with status tracking
- **Withdrawal Period Monitoring**: Automatic tracking of drug withdrawal periods
- **Treatment Filtering**: Filter treatments by status, date, and other criteria
- **Prescription Management**: View and manage veterinary prescriptions
- **Health Alerts**: Get notified about upcoming treatments and health issues
- **Medicated Feed Administration**: Track and manage medicated feed programs
- **WHO AWaRe Drug Classification**: Automatic classification of antibiotics (Access/Watch/Reserve)

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
- **Real-time Synchronization**: Live data updates via Socket.IO across all user interfaces
- **Data Validation**: Comprehensive server-side and client-side validation
- **Blockchain Audit System**: Immutable, tamper-proof audit logging with three layers of protection:
  - **Layer 1 - Hash Chain**: Each record cryptographically linked to the previous one
  - **Layer 2 - Merkle Tree**: Batch verification with Merkle roots for efficient validation
  - **Layer 3 - Blockchain**: Public anchoring to Polygon Amoy testnet for permanent proof
- **Digital Signatures**: RSA-based digital signatures for veterinarian treatment approvals
- **Audit Trail Verification**: Complete verifiability with hash chain integrity checks
- **Blockchain Certificate Download**: Downloadable blockchain verification certificates
- **Data Export**: Export data in multiple formats (PDF, CSV, JSON)
- **WHO AWaRe Drug Database**: Integrated MRL database with 24+ drugs and WHO classifications

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

#### AI-Powered Features
- **AI Health Assistant (IQ Buddy)**: Intelligent chatbot powered by Groq/LLaMA for livestock health guidance
- **Personalized Health Tips**: AI-generated health recommendations based on animal profiles and treatment history
- **Automated AMU Analysis**: ML-powered antimicrobial usage spike detection with 6 alert types:
  - Historical Spike Detection (2x baseline)
  - Peer Comparison Benchmarking (1.5x peer average)
  - Absolute Threshold Monitoring (0.5 treatments/animal/month)
  - Trend Increase Analysis (30% increase over 3 months)
  - Critical Drug Usage Tracking (40% WHO Watch/Reserve antibiotics)
  - Sustained High Usage Detection (4+ consecutive weeks)
- **Peer Comparison Analytics**: Compare farm AMU patterns with similar operations (species/herd size)
- **Disease Prediction**: Predictive analytics for early disease outbreak detection
- **Intelligent Alerts**: AI-driven alerts for abnormal treatment patterns and health risks
- **Speech-to-Text (STT)**: Voice input for hands-free operation
- **Text-to-Speech (TTS)**: Audio feedback for accessibility

#### Advanced Analytics & Automation
- **Automated Background Jobs**: Scheduled analysis of treatment patterns and health trends
- **Historical Pattern Analysis**: Machine learning analysis of treatment effectiveness over time
- **Real-time Anomaly Detection**: Automatic detection of unusual antimicrobial usage spikes
- **Predictive Health Modeling**: Early warning systems for potential disease outbreaks
- **Smart Recommendations**: Context-aware suggestions for treatment and management decisions

#### Administrative & Management Tools
- **Admin Dashboard**: Comprehensive system administration and monitoring
- **Manual Job Triggers**: On-demand execution of analysis and prediction jobs
- **System Health Monitoring**: Real-time monitoring of application performance and data integrity
- **Advanced User Management**: Role-based access control with admin privileges
- **Data Analytics Suite**: Comprehensive analytics tools for system administrators
- **AMU Configuration Management**: Customizable thresholds for all 6 alert types
- **Blockchain Management**: Manual blockchain anchoring and verification tools
- **Support Ticket System**: Integrated help desk and issue tracking

#### Technical Excellence
- **Offline Capability**: Works with intermittent internet connectivity
- **Data Caching**: Intelligent caching for improved performance
- **Search & Filtering**: Advanced search and filtering across all data
- **Barcode Integration**: QR code and barcode scanning capabilities
- **Geographic Services**: Location-based features and mapping
- **Multi-language Support**: Internationalization ready
- **Microservices Architecture**: Modular backend design with specialized controllers
- **Background Processing**: Automated job scheduling with node-cron
  - Daily: Historical spike detection
  - Weekly: Absolute threshold checks, critical drug monitoring, sustained usage tracking
  - Monthly: Peer comparison analysis, trend detection
- **AI/ML Integration**: Seamless integration with Groq AI (LLaMA models) and Google Generative AI
- **Real-time Communications**: Socket.IO for live updates and notifications
- **Email Notifications**: Automated email alerts via Nodemailer

## 🛠️ Tech Stack

### Backend:
- **Node.js** - Runtime environment
- **Express.js 5** - Web application framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation for prescriptions and reports
- **jsPDF** - Additional PDF generation capabilities
- **Nodemailer** - Email functionality
- **CORS** - Cross-origin resource sharing
- **Socket.IO** - Real-time bidirectional communication
- **Groq AI** - AI-powered chat and health recommendations (LLaMA models)
- **Google Generative AI** - Additional AI capabilities
- **node-cron** - Automated background job scheduling
- **date-fns** - Advanced date manipulation and formatting
- **Hardhat** - Ethereum development environment for smart contracts
- **ethers.js** - Blockchain interaction library
- **Polygon Amoy** - Blockchain network for immutable audit trail anchoring
- **QRCode** - QR code generation
- **EJS** - Email template rendering
- **Axios** - HTTP client for external API calls

### Frontend:
- **React 19** - UI library with modern hooks
- **Vite 7** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library (40+ components)
- **React Router 7** - Client-side routing
- **React Query / TanStack Query** - Data fetching and state management
- **Framer Motion** - Animations and transitions
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Lucide React** - Icon library
- **Recharts** - Chart and data visualization
- **Leaflet** - Interactive maps with heat map support
- **jsPDF & jsPDF-AutoTable** - Client-side PDF generation
- **React Hot Toast** - Toast notifications
- **React Markdown** - Markdown rendering for AI responses
- **Socket.IO Client** - Real-time communication
- **Dexie** - IndexedDB wrapper for offline storage
- **html5-qrcode** - QR/barcode scanning
- **next-themes** - Dark/light mode support
- **Vite PWA Plugin** - Progressive Web App capabilities

### Mobile:
- **React Native 0.81** - Cross-platform mobile framework
- **Expo SDK 54** - Development platform and tools
- **React Navigation 7** - Mobile navigation (Stack & Bottom Tabs)
- **Expo Camera** - Camera access for QR/barcode scanning
- **Expo Location** - GPS and location services
- **Expo Notifications** - Push notification support
- **Expo Speech** - Text-to-speech functionality
- **AsyncStorage** - Local data persistence
- **NetInfo** - Network connectivity monitoring
- **date-fns** - Date manipulation
- **Expo Linear Gradient** - Gradient UI components

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

# AI Configuration
GROQ_API_KEY=your_groq_api_key_here

# Admin Configuration
ADMIN_EMAIL=admin@livestockiq.com
ADMIN_PASSWORD=secure_admin_password

# Blockchain Configuration (Polygon Amoy Testnet)
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
BLOCKCHAIN_PRIVATE_KEY=your_polygon_wallet_private_key
BLOCKCHAIN_CONTRACT_ADDRESS=deployed_audit_contract_address
BLOCKCHAIN_ENABLED=true

# Google AI Configuration (Optional)
GOOGLE_API_KEY=your_google_ai_api_key

# Socket.IO Configuration
CLIENT_URL=http://localhost:5173
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

#### Configure AI Features (Optional)
To enable AI-powered features:

1. **Get Groq API Key:**
   - Sign up at [Groq Console](https://console.groq.com/)
   - Create a new API key
   - Add it to your `.env` file as `GROQ_API_KEY`

2. **Enable Background Jobs:**
   The system automatically starts background jobs for:
   - AMU analysis and spike detection
   - Disease prediction and alerts
   - Peer comparison analysis

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
- **Farmers**: Add animals, schedule treatments, view prescriptions, get AI health tips, manage inventory, log sales
- **Veterinarians**: Manage treatment requests, write prescriptions, view patient records, approve treatments with digital signatures
- **Regulators**: Monitor compliance, view analytics, manage system-wide alerts, access blockchain verification

### 5. Leverage AI Features
- **Chat with IQ Buddy**: Click the AI assistant button for instant livestock health guidance
- **Get Health Tips**: Receive personalized AI recommendations for each animal
- **Automated Analysis**: System automatically analyzes treatment patterns with 6 alert types
- **Predictive Insights**: Early warning systems for disease outbreaks and compliance issues
- **Voice Commands**: Use speech-to-text for hands-free data entry

### 6. Mobile Access
- **Download the Mobile App**: Available for iOS and Android via Expo
- **Offline Capability**: Access critical data without internet connection
- **QR Scanning**: Quick animal identification using mobile camera
- **Push Notifications**: Real-time alerts on your mobile device
- **Location Services**: GPS tracking for field operations

## 🏗️ Project Structure

```
LivestockIQ/
├── Backend/
│   ├── config/
│   │   ├── db.js                        # Database configuration
│   │   ├── groq.js                      # Groq AI configuration
│   │   ├── seed.js                      # Database seeding utilities
│   │   └── socket.js                    # Socket.IO configuration
│   ├── controllers/
│   │   ├── admin.controller.js          # System administration
│   │   ├── ai.controller.js             # AI health tips and recommendations
│   │   ├── amuEnhanced.controller.js    # Enhanced AMU monitoring
│   │   ├── animal.controller.js         # Animal management
│   │   ├── audit.controller.js          # Audit trail management
│   │   ├── auditEnhancements.controller.js # Enhanced audit features
│   │   ├── auth.controller.js           # Authentication & authorization
│   │   ├── blockchainVerification.controller.js # Blockchain verification
│   │   ├── blockchainCertificateDownload.js # Certificate downloads
│   │   ├── demographicsEnhanced.controller.js # Enhanced demographics
│   │   ├── email.controller.js          # Email operations
│   │   ├── farmer.controller.js         # Farmer profile management
│   │   ├── farmer.reports.controller.js # Farmer-specific reports
│   │   ├── farmManagement.controller.js # Farm management operations
│   │   ├── feed.controller.js           # Feed management
│   │   ├── feedAdministration.controller.js # Medicated feed administration
│   │   ├── groq.controller.js           # Groq AI chat integration
│   │   ├── inventory.controller.js      # Inventory management
│   │   ├── jobs.controller.js           # Background job management
│   │   ├── mrl.controller.js            # Maximum Residue Limit management
│   │   ├── prescription.controller.js   # Prescription handling
│   │   ├── prescriptionReview.controller.js # Prescription review workflow
│   │   ├── regulator.controller.js      # Regulatory oversight
│   │   ├── regulatorAlerts.controller.js # Regulatory alert system
│   │   ├── reports.controller.js        # Report generation
│   │   ├── reports.analytics.controller.js # Advanced analytics
│   │   ├── sales.controller.js          # Sales tracking
│   │   ├── stt.controller.js            # Speech-to-text
│   │   ├── ticket.controller.js         # Support ticket system
│   │   ├── treatment.controller.js      # Treatment management
│   │   ├── trendsEnhanced.controller.js # Enhanced trend analysis
│   │   ├── tts.controller.js            # Text-to-speech
│   │   ├── vet.controller.js            # Veterinarian operations
│   │   ├── vet.reports.controller.js    # Vet-specific reports
│   │   └── vetManagement.controller.js  # Vet management operations
│   ├── middlewares/
│   │   └── auth.middleware.js           # JWT authentication middleware
│   ├── models/
│   │   ├── animal.model.js              # Animal schema & model
│   │   ├── auditLog.model.js            # Audit log schema with hash chain
│   │   ├── complianceAlert.model.js     # Compliance alerts
│   │   ├── farmer.model.js              # Farmer profile schema
│   │   ├── feed.model.js                # Medicated feed schema
│   │   ├── highAmuAlert.model.js        # High AMU alert schema (6 alert types)
│   │   ├── inventory.model.js           # Inventory item schema
│   │   ├── mrl.model.js                 # MRL database with WHO AWaRe classification
│   │   ├── prescription.model.js        # Prescription schema
│   │   ├── regulator.model.js           # Regulator profile schema
│   │   ├── sale.model.js                # Sales record schema
│   │   ├── supportTicket.model.js       # Support ticket schema
│   │   ├── treatment.model.js           # Treatment record schema
│   │   └── vet.model.js                 # Veterinarian profile schema with RSA key pairs
│   ├── routes/
│   │   ├── admin.routes.js              # System administration endpoints
│   │   ├── ai.routes.js                 # AI health recommendations endpoints
│   │   ├── animal.routes.js             # Animal management endpoints
│   │   ├── audit.routes.js              # Audit trail endpoints
│   │   ├── auditEnhancements.routes.js  # Enhanced audit endpoints
│   │   ├── auth.routes.js               # Authentication endpoints
│   │   ├── farmer.routes.js             # Farmer-specific endpoints
│   │   ├── groq.routes.js               # Groq AI chat endpoints
│   │   ├── inventory.routes.js          # Inventory management endpoints
│   │   ├── prescription.routes.js       # Prescription endpoints
│   │   ├── regulator.routes.js          # Regulatory endpoints
│   │   ├── reports.routes.js            # Report generation endpoints
│   │   ├── sales.routes.js              # Sales tracking endpoints
│   │   ├── treatment.routes.js          # Treatment management endpoints
│   │   └── vet.routes.js                # Veterinarian endpoints
│   ├── jobs/                            # Background processing jobs
│   │   ├── amuAnalysis.js               # 6-type AMU alert system:
│   │   │                                  # - Historical spike detection
│   │   │                                  # - Peer comparison
│   │   │                                  # - Absolute threshold
│   │   │                                  # - Trend increase
│   │   │                                  # - Critical drug usage (WHO AWaRe)
│   │   │                                  # - Sustained high usage
│   │   ├── blockchainAnchor.js          # Blockchain audit anchoring
│   │   └── diseaseAlertJob.js           # Disease prediction and alerting
│   ├── config/
│   │   ├── db.js                        # Database configuration
│   │   ├── groq.js                      # Groq AI configuration
│   │   └── seed.js                      # Database seeding utilities
│   │   ├── services/                        # Business logic services
│   │   │   ├── auditLog.service.js          # Audit log operations
│   │   │   ├── blockchain.service.js        # Blockchain interaction service
│   │   │   ├── digitalSignature.service.js  # RSA digital signature service
│   │   │   └── merkleTree.service.js        # Merkle tree generation
│   │   ├── utils/
│   │   │   ├── createPrescriptionPdf.js     # PDF generation for prescriptions
│   │   │   ├── createTreatmentPdf.js        # PDF generation for treatments
│   │   │   ├── crypto.utils.js              # Cryptographic utilities
│   │   │   └── sendEmail.js                 # Email notification utility
│   ├── contracts/                       # Smart contracts
│   │   └── AuditAnchor.sol              # Solidity smart contract for audit anchoring
│   ├── scripts/                         # Deployment scripts
│   │   └── deploy.js                    # Smart contract deployment script
│   ├── seedData/                        # Database seed data
│   │   └── mrlData.js                   # MRL database with WHO AWaRe classifications
│   ├── docs/                            # Documentation
│   │   ├── AUDIT_SYSTEM_EXPLAINED.md    # Complete audit system guide
│   │   ├── AMU_Alert_System_Documentation.md # AMU alert system details
│   │   ├── WHO_AWaRe_Classification_Integration.md # WHO drug classifications
│   │   └── Hackathon_Demo_Guide.md      # Demo and presentation guide
│   ├── hardhat.config.cjs               # Hardhat configuration for blockchain
│   ├── .env                             # Environment variables
│   ├── package.json                     # Backend dependencies
│   └── server.js                        # Main server entry point
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
│   │   │   ├── ai/                      # AI-powered components
│   │   │   │   ├── ChatWidget.jsx           # IQ Buddy AI assistant
│   │   │   │   └── AmuAlertDetailsDialog.jsx # AMU alert details with AI analysis
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
│   │   │   ├── aiService.js             # AI health tips and recommendations
│   │   │   ├── animalService.js         # Animal API calls
│   │   │   ├── chatService.js           # AI chat services (Groq integration)
│   │   │   ├── treatmentService.js      # Treatment API calls
│   │   │   ├── vetService.js            # Veterinarian API calls
│   │   │   ├── farmerService.js         # Farmer API calls
│   │   │   ├── inventoryService.js      # Inventory API calls
│   │   │   ├── regulatorService.js      # Regulatory API calls
│   │   │   ├── reportsService.js        # Report generation API calls
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
├── Mobile/                              # React Native mobile app
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.js           # Authentication context
│   │   ├── navigation/
│   │   │   ├── AppNavigator.js          # Main navigator
│   │   │   ├── FarmerTabNavigator.js    # Farmer tabs
│   │   │   └── VetTabNavigator.js       # Vet tabs
│   │   ├── screens/
│   │   │   ├── auth/                    # Authentication screens
│   │   │   ├── farmer/                  # Farmer screens
│   │   │   └── vet/                     # Vet screens
│   │   └── services/
│   │       ├── api.js                   # API client
│   │       ├── authService.js           # Auth API
│   │       ├── animalService.js         # Animal API
│   │       └── treatmentService.js      # Treatment API
│   ├── App.js                           # Mobile app entry
│   ├── package.json                     # Mobile dependencies
│   ├── app.json                         # Expo configuration
│   ├── eas.json                         # Expo Application Services config
│   └── README.md                        # Mobile app documentation
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

### Mobile Scripts
```bash
cd Mobile

# Start Expo development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (Mac only)
npm run ios

# Run in web browser
npm run web
```

### Blockchain Scripts
```bash
cd Backend

# Deploy smart contract to Polygon Amoy
npx hardhat run scripts/deploy.js --network polygon_amoy

# Verify contract on PolygonScan
npx hardhat verify --network polygon_amoy <CONTRACT_ADDRESS>
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

### AI & Machine Learning
- `POST /api/ai/health-tip` - Generate AI-powered health tips for specific animals
- `POST /api/groq/chat` - Chat with IQ Buddy AI assistant (Groq-powered)
- `GET /api/ai/recommendations` - Get personalized recommendations
- `POST /api/ai/analyze-pattern` - Analyze treatment patterns with AI
- `POST /api/stt/transcribe` - Speech-to-text transcription
- `POST /api/tts/synthesize` - Text-to-speech synthesis

### Blockchain Audit System
- `GET /api/audit/trail/:entityType/:entityId` - Get audit trail for specific entity
- `GET /api/audit/verify/:entityType/:entityId` - Verify integrity of entity audit trail
- `GET /api/audit/farm/:farmerId` - Get all audit logs for a farm
- `GET /api/audit/verify-farm/:farmerId` - Verify integrity of farm's complete audit trail
- `GET /api/audit/recent` - Get recent audit logs across all farms (Regulator/Admin only)
- `GET /api/audit/my-logs` - Get audit logs for authenticated farmer
- `GET /api/audit-enhancements/blockchain-status` - Get blockchain anchoring status
- `POST /api/audit-enhancements/anchor-now` - Manually trigger blockchain anchoring
- `GET /api/audit-enhancements/merkle-proof/:farmerId` - Get Merkle proof for farm audit logs
- `GET /api/audit-enhancements/verify-signature/:auditLogId` - Verify digital signature

### Administrative (Admin Access)
- `POST /api/admin/trigger-amu-analysis` - Manually trigger AMU spike analysis job
- `POST /api/admin/trigger-peer-analysis` - Manually trigger peer comparison analysis
- `POST /api/admin/trigger-disease-prediction` - Manually trigger disease prediction job
- `GET /api/admin/system-health` - Get system health and performance metrics
- `GET /api/admin/job-status` - Get status of background analysis jobs
- `POST /api/admin/reset-alerts` - Reset system alerts and notifications
- `GET /api/admin/analytics` - Access comprehensive system analytics

### MRL (Maximum Residue Limits)
- `GET /api/mrl` - Get all MRL records with WHO AWaRe classifications
- `GET /api/mrl/search` - Search MRL database by drug, species, or product type
- `GET /api/mrl/:id` - Get specific MRL record details
- `POST /api/mrl` - Create new MRL record (Admin only)
- `PUT /api/mrl/:id` - Update MRL record (Admin only)

### Medicated Feed
- `GET /api/feed` - Get all medicated feed administrations
- `POST /api/feed` - Create new feed administration record
- `GET /api/feed/:id` - Get specific feed administration details
- `PUT /api/feed/:id` - Update feed administration
- `DELETE /api/feed/:id` - Delete feed administration

### Support Tickets
- `GET /api/tickets` - Get all support tickets
- `POST /api/tickets` - Create new support ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket status/response
- `DELETE /api/tickets/:id` - Close/delete ticket

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
