# Quick Start Guide

## Local Development

```bash
# Start the dev server
npm run dev

# Open http://localhost:5175/durham-trees/ in your browser
```

## Controls

### Mouse
- **Click + Drag**: Rotate the view
- **Scroll**: Zoom in/out
- **Hover over trees**: See detailed information

### Keyboard
- **WASD**: Move camera horizontally
- **Q/E**: Move camera up/down
- **R**: Reset camera to starting position

## Features to Explore

1. **Zoom into neighborhoods** - Get close to see individual trees
2. **Check the legend** - See which colors represent which species
3. **Hover over trees** - Get detailed info: species, diameter, condition, neighborhood
4. **Bird's eye view** - Zoom out to see Durham's tree distribution patterns

## Production Build

```bash
# Build for production
npm run build

# The output will be in the dist/ folder
```

## Deploy to GitHub Pages

### Option 1: Manual Deploy
```bash
./deploy.sh
```

### Option 2: GitHub Actions (Automatic)
1. Push to GitHub
2. Enable GitHub Pages in repo settings → Pages
3. Set source to "GitHub Actions"
4. Push to main branch - auto-deploys!

## Customization

### Change the base URL
Edit `vite.config.js`:
```js
base: '/your-repo-name/'
```

### Add more species colors
Edit the `SPECIES_COLORS` object in `main.js`

### Adjust camera starting position
Edit the camera setup in `main.js`:
```js
camera.position.set(x, y, z);
```

## Data

The tree data is in `public/trees-data.json`:
- 10,000 street trees from Durham
- Each with lat/lng coordinates
- Species, size, condition info
- Sourced from Durham Open Data Portal

## Performance

- Uses **InstancedMesh** for efficient rendering
- Each species group is one draw call
- Handles 10,000+ trees smoothly
- Shadows and fog for atmosphere

## Troubleshooting

**Trees not loading?**
- Check browser console for errors
- Make sure `trees-data.json` exists in `public/`

**Performance issues?**
- Try reducing the number of trees in the dataset
- Disable shadows in the code
- Lower `devicePixelRatio` in renderer

**Build errors?**
- Make sure Node.js v22+ is installed
- Delete `node_modules` and run `npm install`

---

Made with ❤️ by Sawyer Welden
