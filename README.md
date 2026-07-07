# Fence & Gate Estimator App

A comprehensive full-stack application for fence and gate installation companies to create professional estimates, visualize designs, and share project previews with customers.

## What's Included

- **Admin Dashboard** - Manage projects, create estimates, generate professional quotes
- **3D Fence Visualizer** - Photorealistic interactive preview with Three.js
- **Customer Portal** - Customers can customize designs and see pricing in real-time
- **Pricing Engine** - Automatic calculation based on materials, labor, and accessories
- **PDF Quote Generation** - Professional quotes ready to send to clients
- **Material Library** - Pre-configured materials (Chainlink, Vinyl, Wood, Aluminum, Composite)

## Quick Start

### Using Docker (Recommended)
```bash
docker-compose up
docker-compose exec backend npm run seed  # Seed sample data
```

Then visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Manual Setup
See [SETUP.md](./SETUP.md) for detailed installation instructions.

## Features

✅ Create projects with client information
✅ Select materials and colors with real pricing
✅ Set fence dimensions (length, width, height)
✅ Add multiple gates with customizable widths
✅ Generate professional PDF quotes
✅ Share interactive 3D preview with customers
✅ Customers can customize and see live price updates
✅ Responsive design for desktop and mobile
✅ Database storage for all projects and quotes

## Next Steps

1. Run the app locally with Docker or manual setup
2. Seed sample materials into the database
3. Create your first project in the Admin Dashboard
4. Generate a quote and see the PDF
5. Share the customer link and watch them customize their design
6. Add your actual materials and pricing information

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Three.js
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Deployment**: Docker

For detailed setup and customization, see [SETUP.md](./SETUP.md)
