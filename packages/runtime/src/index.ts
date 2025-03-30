import { FlarePlayer, FlarePlayerOptions } from './player';

// Export main classes
export { FlarePlayer };
export type { FlarePlayerOptions };

// Create namespace for UMD build
declare global {
  interface Window {
    flare: {
      FlarePlayer: typeof FlarePlayer;
    };
  }
}

// Expose to window for UMD build
if (typeof window !== 'undefined') {
  window.flare = window.flare || {};
  window.flare.FlarePlayer = FlarePlayer;
}

// Create a simple HTML file for testing
export const createTestHTML = (): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flare Runtime Test</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: sans-serif;
    }
    #flare-container {
      width: 600px;
      height: 400px;
      border: 1px solid #ccc;
      margin: 0 auto;
    }
    .controls {
      text-align: center;
      margin-top: 10px;
    }
    button {
      margin: 0 5px;
      padding: 5px 10px;
    }
  </style>
</head>
<body>
  <h1>Flare Runtime Test</h1>
  <div id="flare-container"></div>
  <div class="controls">
    <button id="play-btn">Play</button>
    <button id="pause-btn">Pause</button>
    <button id="stop-btn">Stop</button>
  </div>

  <script type="module">
    import { FlarePlayer } from './bundle.js';
    
    // Create a simple test timeline
    const testTimeline = {
      version: "1.0",
      frameRate: 60,
      duration: 180,
      dimensions: {
        width: 600,
        height: 400,
        responsive: true
      },
      layers: [
        {
          id: "background",
          type: "normal",
          locked: false,
          visible: true,
          frames: [
            {
              startFrame: 0,
              duration: 180,
              elements: [
                {
                  id: "bg1",
                  type: "rectangle",
                  properties: {
                    x: 0,
                    y: 0,
                    width: 600,
                    height: 400,
                    fill: "#f0f0f0"
                  }
                }
              ]
            }
          ]
        },
        {
          id: "animation",
          type: "normal",
          locked: false,
          visible: true,
          frames: [
            {
              startFrame: 0,
              duration: 180,
              elements: [
                {
                  id: "circle1",
                  type: "circle",
                  properties: {
                    x: 100,
                    y: 200,
                    radius: 50,
                    fill: "#ff3366"
                  },
                  animations: [
                    {
                      property: "x",
                      keyframes: [
                        { frame: 0, value: 100, easing: "ease-in-out" },
                        { frame: 60, value: 500, easing: "ease-in-out" },
                        { frame: 120, value: 100, easing: "ease-in-out" }
                      ]
                    },
                    {
                      property: "radius",
                      keyframes: [
                        { frame: 0, value: 50, easing: "ease-in-out" },
                        { frame: 90, value: 80, easing: "ease-in-out" },
                        { frame: 180, value: 50, easing: "ease-in-out" }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      scripts: []
    };
    
    // Create a mock JSONResponse for our test timeline
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(testTimeline)
    };
    
    // Mock fetch for testing
    window.fetch = (url) => {
      console.log('Fetching:', url);
      return Promise.resolve(mockResponse);
    };
    
    // Initialize player when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      const player = new FlarePlayer({
        container: '#flare-container',
        source: 'test-timeline.json', // This will use our mocked fetch
        autoplay: true,
        onReady: () => console.log('Flare player ready'),
        onError: (err) => console.error('Flare player error:', err)
      });
      
      // Connect control buttons
      document.querySelector('#play-btn').addEventListener('click', () => player.play());
      document.querySelector('#pause-btn').addEventListener('click', () => player.pause());
      document.querySelector('#stop-btn').addEventListener('click', () => player.stop());
    });
  </script>
</body>
</html>
  `;
};