// Loading Component for Wikidata Entity Viewer
// This module contains React components for loading states

// Check if React is available
if (typeof React === 'undefined') {
  console.error('React is not available. Make sure React is loaded before this script.');
}

/**
 * Loading Component
 * Displays a centered loading message with a transparent overlay
 * The overlay allows content to be visible underneath while showing the loading state
 * Includes a delay and smooth fade-in animation to prevent blinking
 */
function LoadingComponent() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(18, 18, 18, 1)', // Semi-transparent dark background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)', // Subtle blur effect
        animation: 'fadeIn 0.05s ease-in-out'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontSize: '1.5rem',
          color: 'var(--text)',
          backgroundColor: 'var(--background)',
          padding: '30px 40px',
          borderRadius: '12px',
          border: '2px solid var(--neon)',
          boxShadow: '0 0 30px rgba(0, 255, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          animation: 'pulse 2s infinite, fadeInScale 1s ease-out'
        }}
      >
        Loading...
      </div>
    </div>
  );
}

// Add CSS animations for pulse effect and fade-in
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.4);
    }
    50% {
      box-shadow: 0 0 40px rgba(0, 255, 0, 0.6);
    }
    100% {
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.4);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
document.head.appendChild(style);

// Export component to global scope
window.LoadingComponents = {
  LoadingComponent: LoadingComponent
}; 