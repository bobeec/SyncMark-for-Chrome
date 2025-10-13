# SyncMark Extension Icons

This directory should contain the following icon files for the Chrome extension:

## Required Icon Sizes:
- `icon-16.png` - 16x16px (toolbar icon)
- `icon-32.png` - 32x32px (extension management)  
- `icon-48.png` - 48x48px (extension details)
- `icon-128.png` - 128x128px (Chrome Web Store)

## Design Guidelines:
- Use a bookmark/sync themed icon
- Colors: Blue gradient (#3b82f6 to #1d4ed8)
- Clean, simple design that works at small sizes
- Consistent with the SyncMark brand

## Temporary Solution:
For development, you can use any 16x16, 32x32, 48x48, and 128x128 pixel PNG files.
The extension will work with placeholder icons during development.

## SVG Source (for icon creation):
```svg
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="url(#gradient)" stroke="white" stroke-width="1"/>
  <circle cx="18" cy="6" r="3" fill="#10b981"/>
  <path d="M16 6l1 1 2-2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

This combines a bookmark icon with a sync indicator (green checkmark).