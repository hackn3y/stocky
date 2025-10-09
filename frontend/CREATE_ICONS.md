# Creating PWA Icons

Since we can't generate PNG files directly, you have two options:

## Option 1: Use Online Tool (Easiest - 2 minutes)

1. Go to https://realfavicongenerator.net/
2. Upload the `icon.svg` file from `frontend/public/`
3. Download the generated icons
4. Place `icon-192.png` and `icon-512.png` in `frontend/public/`

## Option 2: Use ImageMagick (If installed)

```bash
cd frontend/public

# Create 192x192 icon
magick icon.svg -resize 192x192 icon-192.png

# Create 512x512 icon
magick icon.svg -resize 512x512 icon-512.png
```

## Option 3: Temporary Placeholder (For now)

The app will work without icons, but users won't see a nice icon when installing.
The manifest.json will just show a generic browser icon until real icons are added.

## After Creating Icons

Once you have the PNG files, just place them in `frontend/public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

Then commit and push - Vercel will include them automatically!
