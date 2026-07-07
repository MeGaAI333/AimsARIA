# Fence & Gate Estimator - Setup Guide

A professional fence and gate estimation application with 3D visualization, pricing calculator, and customer portal.

## Features

- 📊 **Admin Dashboard**: Create and manage projects with professional estimates
- 🎨 **3D Visualizer**: Photorealistic fence preview with interactive controls
- 💰 **Smart Pricing**: Automatic calculation based on materials, labor, and accessories
- 📄 **PDF Quotes**: Generate professional quotes for customers
- 👥 **Customer Portal**: Customers can customize designs and view estimates in real-time
- 📍 **Material Library**: Chainlink, Vinyl, Wood, Aluminum, Composite options
- 🎯 **Google Maps Integration Ready**: Framework for adding location-based estimates (coming soon)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Three.js
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Deployment**: Docker + Docker Compose

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Option 1: Using Docker (Recommended)

```bash
# Clone and navigate to the project
cd command-center

# Start all services
docker-compose up

# In another terminal, seed the database with sample materials
docker-compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# Database: localhost:5432
```

### Option 2: Manual Setup

#### 1. Database Setup
```bash
# Create PostgreSQL database
createdb fence_estimator

# Set environment variables
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=fence_estimator
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database details

# Build TypeScript
npm run build

# Seed database with sample materials
npm run seed

# Start development server
npm run dev
```

The backend will be available at `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### For Admins

1. **Create a New Project**
   - Go to Admin Dashboard
   - Click "New Project"
   - Enter client details (name, email, phone, address)
   - Select material type and color
   - Set fence dimensions (length, width, height)
   - Add gates if needed

2. **Generate Quote**
   - Click on project to view details
   - Click "Generate Quote" to calculate pricing
   - Quote will be generated with material, labor, and tax calculations
   - PDF quote will be created automatically

3. **Share with Customer**
   - Copy the customer share link
   - Customer can view 3D preview and customize options

### For Customers

1. **View Your Project**
   - Access the link provided by the contractor
   - See 3D preview of your fence design
   - Interact with the visualization (drag to rotate, scroll to zoom)

2. **Customize Design**
   - Change material type
   - Select different colors
   - Adjust dimensions
   - Add/remove gates
   - See pricing update in real-time

3. **Download Quote**
   - Download professional PDF quote
   - Save for your records

## Project Structure

```
command-center/
├── backend/
│   ├── src/
│   │   ├── entities/          # Database models
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── database.ts        # DB configuration
│   │   ├── index.ts           # Server entry point
│   │   └── seed.ts            # Database seeding
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── store/             # State management
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── shared/
│   └── types.ts               # Shared TypeScript types
└── docker-compose.yml
```

## API Endpoints

### Materials
- `GET /api/materials` - Get all materials
- `GET /api/materials/:id` - Get material by ID
- `POST /api/materials` - Create material (admin)
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Quotes
- `GET /api/quotes` - Get all quotes
- `GET /api/quotes/:id` - Get quote by ID
- `GET /api/quotes/project/:projectId` - Get quote for project
- `POST /api/quotes/generate/:projectId` - Generate quote

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fence_estimator
LABOR_RATE=15
TAX_RATE=0.08
COMPANY_NAME=Fence & Gate Installation
```

### Frontend
Uses proxy to backend via Vite config

## Customization

### Adding Materials

1. Add to database via API:
```bash
curl -X POST http://localhost:5000/api/materials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vinyl PVC",
    "type": "vinyl",
    "costPerLinearFoot": 25,
    "description": "Premium vinyl option",
    "colors": ["White", "Gray", "Brown"]
  }'
```

Or use the seed script and update `backend/src/seed.ts`

### Updating Pricing

Edit `.env` file:
- `LABOR_RATE`: Change labor cost per linear foot
- `TAX_RATE`: Change tax percentage (e.g., 0.08 for 8%)

### Customizing Colors

Each material has a `colors` array. Edit via API or database directly.

## Google Maps Integration (Future)

The app is structured to support Google Maps API for:
- Address validation
- Project location visualization
- Distance calculations
- Travel time estimates

To implement:
1. Add Google Maps API key to `.env`
2. Create location service in backend
3. Add map component to customer portal
4. Use for job scheduling optimization

## Deployment

### Docker Deployment

1. **Build images**:
```bash
docker-compose build
```

2. **Run in production**:
```bash
docker-compose up -d
```

3. **Backup database**:
```bash
docker-compose exec postgres pg_dump -U postgres fence_estimator > backup.sql
```

### Cloud Deployment Options

- **AWS**: Use ECS, RDS for database
- **DigitalOcean**: Use App Platform with PostgreSQL
- **Heroku**: Deploy with PostgreSQL addon
- **Google Cloud**: Use Cloud Run + Cloud SQL

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DB credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
- Backend: `lsof -i :5000` then `kill -9 <PID>`
- Frontend: `lsof -i :3000` then `kill -9 <PID>`

### 3D Visualization Not Loading
- Check browser console for errors
- Ensure WebGL is enabled
- Try a different browser

### PDF Generation Fails
- Ensure `generated_quotes` folder exists
- Check file permissions
- Verify PDFKit is installed: `npm list pdfkit`

## Support & Updates

- Report issues in development
- Material costs can be updated via API anytime
- Customer portal link format: `/customer/{projectId}`
- Quote expiration: 30 days by default (configurable)

## Next Steps

1. Add Google Maps API integration
2. Implement email notifications
3. Add payment processing
4. Create mobile app
5. Add project scheduling/calendar
6. Implement customer approval workflow
7. Add photo upload for before/after
8. Integration with accounting software
