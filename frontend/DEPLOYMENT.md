# Weather Safety Check - Frontend

Disaster alert system with real-time weather monitoring and risk assessment.

## 🚀 Vercel Deployment

### Quick Deploy

1. **Connect GitHub Repository**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository: `Disaster-Management`
   - Select the `frontend` directory as root

2. **Configure Environment Variables**
   
   Add this in Vercel dashboard under "Environment Variables":
   ```
   REACT_APP_API_URL=https://disaster-management-2r0u.onrender.com
   ```

3. **Build Settings** (Auto-detected)
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-app.vercel.app`

### Local Development

```bash
npm install
npm start
```

### Environment Variables

- `REACT_APP_API_URL` - Backend API URL (required)

### Features

- 🌍 Automatic location detection with browser geolocation
- 🌤️ 48-hour weather forecast
- 📊 24-hour historical trends
- 🚨 Real-time disaster risk assessment
- 📧 Email alert registration
- 🔗 Share weather alerts
- 🌐 Multi-browser support (Chrome, Firefox, Edge, Safari)

## 📱 Tech Stack

- React 18
- Create React App
- Inline CSS styling
- Browser Geolocation API
- REST API integration

## 🔗 Backend

Backend deployed on Render: https://disaster-management-2r0u.onrender.com
