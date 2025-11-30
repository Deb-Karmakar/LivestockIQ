# 📱 LivestockIQ Mobile App

React Native mobile application for LivestockIQ - Farm Management System for Farmers and Veterinarians.

## ✨ Features

### For Farmers
- ✅ **Dashboard** - Real-time statistics and quick actions
- ✅ **Animal Management** - View all animals with MRL status badges
- ✅ **Treatment Tracking** - Request treatments with filtering by status
- ✅ **MRL Compliance** - Monitor Maximum Residue Limit compliance
- ✅ **Profile & Settings** - Manage account and preferences

### For Veterinarians
- ✅ **Vet Dashboard** - Overview of pending requests and stats
- ✅ **Treatment Requests** - Review, approve, or reject treatment requests
- ✅ **Farmer Directory** - View all supervised farmers
- ✅ **Profile Management** - Account settings and logout

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

### Installation

1. **Navigate to Mobile directory:**
   ```bash
   cd Mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API endpoint:**
   - Open `src/services/api.js`
   - Update `API_BASE_URL` to your backend URL:
     - For localhost: `http://localhost:5000/api`
     - For physical device: `http://YOUR_COMPUTER_IP:5000/api`
     - For production: `https://your-api.com/api`

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device:**
   - Scan the QR code with Expo Go app (Android)
   - Scan with Camera app (iOS)

## 📱 Running on Emulators

### Android Emulator
```bash
npm run android
```

### iOS Simulator (Mac only)
```bash
npm run ios
```

## 🏗️ Project Structure

```
Mobile/
├── App.js                          # Main app entry point
├── src/
│   ├── contexts/
│   │   └── AuthContext.js         # Authentication state management
│   ├── navigation/
│   │   ├── AppNavigator.js        # Main app navigator
│   │   ├── FarmerTabNavigator.js  # Farmer bottom tabs
│   │   └── VetTabNavigator.js     # Vet bottom tabs
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.js     # Login screen
│   │   ├── farmer/
│   │   │   ├── DashboardScreen.js
│   │   │   ├── AnimalsScreen.js
│   │   │   ├── TreatmentsScreen.js
│   │   │   ├── MRLComplianceScreen.js
│   │   │   └── SettingsScreen.js
│   │   └── vet/
│   │       ├── VetDashboardScreen.js
│   │       ├── TreatmentRequestsScreen.js
│   │       ├── FarmerDirectoryScreen.js
│   │       └── VetSettingsScreen.js
│   └── services/
│       ├── api.js                 # Axios instance with interceptors
│       ├── authService.js         # Authentication API calls
│       ├── animalService.js       # Animal CRUD operations
│       └── treatmentService.js    # Treatment operations
```

## 🔐 Authentication

The app uses JWT token-based authentication:
- Tokens are stored in AsyncStorage
- Auto-login on app restart
- Automatic logout on 401 errors
- Role-based navigation (Farmer/Vet)

## 📡 API Integration

### Base Configuration
- API client: Axios
- Authentication: Bearer token in headers
- Error handling: Automatic token refresh
- Timeout: 10 seconds

### Services
- `authService.js` - Login, register, logout
- `animalService.js` - Get animals, create, update, delete
- `treatmentService.js` - Get treatments, request, approve, reject

## 🎨 UI Components

Built with:
- React Native core components
- Expo Vector Icons (Ionicons)
- Custom styled components
- Responsive design for all screen sizes

## 🔧 Development

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add to navigator in `src/navigation/`
3. Create API service if needed
4. Test on both iOS and Android

### Adding API Services

1. Create service file in `src/services/`
2. Import `api` instance
3. Export async functions
4. Handle errors appropriately

## 📦 Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA (requires Mac + Apple Developer account)
```bash
expo build:ios
```

## 🚀 Deployment

### Expo Publish (Over-the-Air Updates)
```bash
expo publish
```

### App Stores
1. **Android**: Build APK and upload to Google Play Console
2. **iOS**: Build IPA and upload to App Store Connect

## 🧪 Testing

### Test User Credentials
```
Farmer:
- Email: farmer@test.com
- Password: password123

Vet:
- Email: vet@test.com
- Password: password123
```

## 🔄 Pull-to-Refresh

All list screens support pull-to-refresh to fetch latest data.

## 📱 Offline Support

**Current**: Token and user data stored locally  
**Future**: SQLite for offline data storage and sync

## 🎯 Future Enhancements

- [ ] QR/Barcode scanner for animal tags
- [ ] Push notifications
- [ ] Offline data sync with SQLite
- [ ] Camera integration for uploading images
- [ ] Feed administration screen
- [ ] Detailed animal profile screens
- [ ] Treatment request creation form
- [ ] Digital prescription creation
- [ Future] Dark mode support
- [ ] Multi-language support

## 🐛 Known Issues

- None currently

## 📄 License

ISC License - See main project README

## 💬 Support

For issues or questions, please file an issue on the main GitHub repository.

---

**Built with ❤️ using React Native & Expo**
