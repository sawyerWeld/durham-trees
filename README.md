# Every Tree in Durham 🌳

A beautiful 3D visualization of Durham, NC's street tree inventory. Explore 10,000+ trees mapped to their real-world locations, colored by species, with detailed information on hover.

![Every Tree in Durham](screenshot.png)

## Features

- **Real Data**: Official tree inventory from the City of Durham Open Data Portal
- **3D Visualization**: Interactive Three.js scene with orbit controls
- **10,000+ Trees**: Each tree positioned by actual lat/lng coordinates
- **Species Coloring**: Visual categorization by tree species/genus
- **Interactive**: Hover over trees to see species, size, condition, and location
- **Performant**: Uses instanced rendering for smooth performance
- **Atmospheric**: Dark background, fog effects, and dynamic lighting

## Tech Stack

- **Vite** - Fast build tool
- **Three.js** - 3D graphics library
- **Durham Open Data** - Tree inventory dataset

## Development

### Prerequisites
- Node.js v22+

### Setup
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Data Source

Tree data comes from the [City of Durham Open Data Portal](https://live-durhamnc.opendata.arcgis.com/datasets/DurhamNC::trees-planting-sites):
- 10,000+ street trees
- Species information (genus, common name)
- Size data (diameter, height)
- Condition assessments
- Location coordinates
- Neighborhood information

## Deployment (GitHub Pages)

1. Update `base` in `vite.config.js` to match your repo name
2. Build the project: `npm run build`
3. Deploy the `dist` folder to GitHub Pages:
   ```bash
   # Create gh-pages branch and push
   git add dist -f
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

Or use GitHub Actions for automatic deployment.

## Project Structure

```
durham-trees/
├── public/
│   └── trees-data.json      # Tree inventory GeoJSON
├── index.html               # Main HTML structure
├── main.js                  # Three.js visualization
├── style.css                # Styling
└── vite.config.js          # Build configuration
```

## Features Explained

### Tree Rendering
- Each species group uses **InstancedMesh** for performance
- Tree size mapped to actual canopy diameter (DBH)
- Simple procedural geometry (cone canopies, cylinder trunks)
- Shadows and realistic materials

### Camera & Controls
- Starts with bird's eye view of Durham
- Orbit controls allow pan, zoom, and rotation
- Can zoom into individual neighborhoods
- Smooth damping for natural feel

### Species Categories
Trees are grouped into major categories:
- Maple (red)
- Oak (brown)
- Pine (dark green)
- Willow (olive)
- Cherry (pink)
- Dogwood (light pink)
- And more...

### Interactive Info
Hover over any tree to see:
- Common name
- Scientific name (genus + species)
- Diameter (DBH in inches)
- Condition
- Neighborhood

## Credits

**Made by Sawyer Welden**

Data: [City of Durham Open Data Portal](https://live-durhamnc.opendata.arcgis.com/)

## License

MIT License - feel free to use and modify!

## Future Ideas

- Add time-based visualization (tree planting dates)
- Filter by species, size, or condition
- Show tree health statistics
- Add tree benefits data (CO2, stormwater, etc.)
- Mobile VR support
- Seasonal color changes
