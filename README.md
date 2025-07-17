# Wikidata Entity Viewer

A modern web application for viewing Wikidata entities and properties with a beautiful, responsive interface.

## Features

- View Wikidata entities and their statements
- View property information
- Multi-language support with automatic language detection
- Dark/light theme toggle
- Responsive design
- Caching for improved performance

## JSX Support

The project now supports JSX syntax for React components. The `statements.jsx` file contains React components written in JSX syntax that are automatically transformed by Babel standalone.

### How to use JSX:

1. **Write JSX components** in `.jsx` files
2. **Load with Babel** using `type="text/babel"` attribute
3. **No build step required** - transformation happens in the browser

### Example:

```jsx
function MyComponent({ name }) {
  return (
    <div>
      <h1>Hello {name}!</h1>
      <p>This is JSX syntax</p>
    </div>
  );
}
```

### Files:

- `statements.jsx` - JSX version of the statements components
- `statements.js` - Original JavaScript version (for reference)
- `entities.html` - Updated to load JSX version
- `properties.html` - Property viewer page

## Setup

1. Clone the repository
2. Open `entities.html` in a web browser
3. The JSX components will be automatically transformed by Babel

## Dependencies

- React 19 (loaded via ESM.sh CDN) - Latest stable version
- React DOM 19 (loaded via ESM.sh CDN) - Latest stable version
- Babel Standalone (loaded via unpkg CDN) - Latest stable version

## CDN Strategy

The project uses a hybrid CDN approach for React 19:
- **ESM.sh CDN**: For React 19 and React DOM 19 (ES modules format)
- **unpkg CDN**: For Babel Standalone (UMD format)

The setup uses ES module imports to load React 19 and makes it available globally for Babel transformation, ensuring access to the latest React features.

No npm installation required!
