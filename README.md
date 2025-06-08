# Tourvisto ✈️🌎  
**AI-Powered Travel Agency Dashboard for Modern Travel Businesses**  

[Live Demo](https://tourvista-xi.vercel.app/sign-in) | [GitHub](https://github.com/ryanhui30/tourvista)  

## ✨ Key Features  
- **🤖 AI Trip Generation**  
  Create customized travel itineraries instantly with Gemini AI integration  
- **📊 Business Analytics Dashboard**  
  Track user growth, trip trends, and booking statistics with Syncfusion charts
- **👥 Customer Management**  
  View and manage client profiles with booking history  
- **🖼️ Visual Trip Builder**  
  Browse and edit AI-generated trips with Unsplash image integration  
- **🔐 Secure Authentication**  
  Google Cloud authentication with Appwrite backend  
- **📱 Fully Responsive**  
  Works seamlessly on desktop, tablet, and mobile  

## 🛠️ Tech Stack  

### Core Platform  
| Technology       | Use Case                     |
|------------------|------------------------------|
| React            | Frontend Framework           |
| TypeScript       | Type-safe JavaScript         |
| Appwrite         | Backend & Database           |
| Google Cloud     | User Authentication          |
| Gemini AI        | AI Trip Generation           |

### UI & Data Visualization  
| Component        | Technology                   |
|------------------|------------------------------|
| UI Components    | Syncfusion                   |
| Styling          | Tailwind CSS                 |
| Charts           | Syncfusion Charts            |
| Image Provider   | Unsplash API                 |

## 🚀 Getting Started  

### Prerequisites  
- Node.js v18+  
- Appwrite Project ID  
- Google OAuth Credentials  
- Gemini API Key  

### **Development Setup**  
1. **Clone the repo**:  
  ```bash
  git clone https://github.com/ryanhui30/tourvista.git
  cd tourvista
  ```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
- Create `.env.local` file:
```
bash
# Appwrite
VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
VITE_APPWRITE_PROJECT_ID=your_project_id

# Google Auth
VITE_GOOGLE_CLIENT_ID=your_client_id

# Gemini AI
VITE_GEMINI_API_KEY=your_api_key

# Unsplash
VITE_UNSPLASH_ACCESS_KEY=your_access_key
```

4. **Start Development Server**:
```
bash
npm run dev
```

## **🧭 How To Use**
### **Generating Trips**
- Navigate to Trip Generator
- Click "Create New Trip" in the dashboard
- Select Trip Preferences dropdown
- Country/Region, travel style, interests, budget, etc.

### **Generate & Customize**
- Click "Generate with AI" to create itinerary
- Edit trip details, images, and activities
- Get destination climate details for all seaons beforehand

### **Admin Dashboard Features**
- Monitor user signups and trip bookings
- View all customer profiles and trip history
- Browse and edit all generated trips
- Track user growth, trip trends, and active users on dynamic graphs

**📬 Need Help?**
Contact: ryanhui30@gmail.com
