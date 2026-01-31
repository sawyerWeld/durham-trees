#!/bin/bash

# Deploy to GitHub Pages
echo "Building for production..."
npm run build

echo "Deploying to GitHub Pages..."

# Initialize git if not already
if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "Initial commit"
fi

# Deploy dist to gh-pages branch
git add dist -f
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages

echo "Deployment complete!"
echo "Your site should be available at: https://USERNAME.github.io/durham-trees/"
