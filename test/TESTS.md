# Testing Your Enhanced AnimationEngine Implementation

Based on the improvements we've made to the AnimationEngine, here's how you can thoroughly test each feature to verify correct behavior:

## 1. Setting Up a Test Environment

First, create a simple test harness that initializes the AnimationEngine with a basic timeline:

```typescript
import { AnimationEngine } from './animation-engine';
import { Timeline } from '@flare/shared';

// Create a simple test timeline
const testTimeline: Timeline = {
  frameRate: 60,
  duration: 300,
  layers: [
    {
      id: 'testLayer',
      type: 'normal',
      visible: true,
      locked: false,
      frames: [
        {
          startFrame: 0,
          duration: 300,
          elements: [
            {
              id: 'circle',
              type: 'circle',
              properties: {
                x: 100,
                y: 100,
                radius: 50,
                fill: '#ff0000'
              }
            },
            {
              id: 'rect',
              type: 'rectangle',
              properties: {
                x: 200,
                y: 100,
                width: 100,
                height: 80,
                fill: '#0000ff'
              }
            }
          ]
        }
      ]
    }
  ]
};

// Create the engine
const engine = new AnimationEngine(testTimeline);
```

## 2. Testing Easing Functions

Test that the enhanced easing functions work properly:

```typescript
// Create a simple test to verify easing functions
function testEasingFunctions() {
  console.log("Testing Easing Functions:");
  
  // Sample time values to test
  const timePoints = [0, 0.25, 0.5, 0.75, 1.0];
  
  // Test different easing functions
  const easingTypesToTest = [
    'linear', 
    'ease-in-quad', 
    'ease-out-elastic', 
    'ease-in-out-bounce'
  ];
  
  // For each easing type, calculate output values at different time points
  easingTypesToTest.forEach(easingType => {
    console.log(`\nEasing: ${easingType}`);
    
    const easingFunction = Easing.getEasingFunction(easingType);
    timePoints.forEach(t => {
      const output = easingFunction(t);
      console.log(`  t=${t.toFixed(2)}, output=${output.toFixed(4)}`);
    });
  });
}

testEasingFunctions();
```

## 3. Testing Animation Groups and Sequences

Create a test that sets up groups and sequences and verifies they execute correctly:

```typescript
// Test animation groups and sequences
function testAnimationGroups() {
  console.log("\nTesting Animation Groups:");
  
  // Create a bounce animation group
  engine.registerGroup({
    id: 'bounce',
    type: AnimationGroupType.PARALLEL,
    elementIds: ['circle'],
    properties: ['y', 'radius'],
    startFrame: 10,
    duration: 30,
    easing: 'ease-out-bounce'
  });
  
  // Create a color change group
  engine.registerGroup({
    id: 'colorChange',
    type: AnimationGroupType.STAGGER,
    elementIds: ['circle', 'rect'],
    properties: ['fill'],
    startFrame: 50,
    duration: 20,
    staggerDelay: 5,
    easing: 'ease-in-out'
  });
  
  // Create a sequence
  engine.registerSequence({
    id: 'testSequence',
    steps: [
      {
        groupId: 'bounce',
        waitForComplete: true,
        onComplete: 'bounceComplete'
      },
      {
        groupId: 'colorChange',
        waitForComplete: true
      }
    ],
    repeat: 1,
    autoPlay: false
  });
  
  // Add a listener to verify completion
  engine.addEventListener('bounceComplete', (data) => {
    console.log("Bounce animation completed:", data);
  });
  
  // Play the sequence
  engine.playSequence('testSequence');
  
  // Log the state at various frames to verify correct animation
  const framesToCheck = [0, 15, 40, 55, 80];
  
  console.log("\nAnimation State at Different Frames:");
  framesToCheck.forEach(frame => {
    engine.seekToFrame(frame);
    const elements = engine.getCurrentElements();
    console.log(`\nFrame ${frame}:`);
    elements.forEach(el => {
      console.log(`  Element '${el.id}': x=${el.properties.x}, y=${el.properties.y}, fill=${el.properties.fill}`);
    });
  });
}

testAnimationGroups();
```

## 4. Testing Path-Based Animation

Test that elements correctly follow defined paths:

```typescript
function testPathAnimation() {
  console.log("\nTesting Path-Based Animation:");
  
  // Define a simple path
  const testPath = {
    id: 'testPath',
    commands: [
      { type: PathCommandType.MOVE_TO, x: 100, y: 100 },
      { type: PathCommandType.CURVE_TO, x1: 150, y1: 50, x2: 250, y2: 50, x: 300, y: 100 },
      { type: PathCommandType.LINE_TO, x: 300, y: 200 },
      { type: PathCommandType.CURVE_TO, x1: 250, y1: 250, x2: 150, y2: 250, x: 100, y: 200 },
      { type: PathCommandType.CLOSE }
    ],
    closed: true
  };
  
  // Register the path
  engine.registerPath(testPath);
  
  // Create a path animation
  engine.registerPathAnimation({
    elementId: 'circle',
    startFrame: 100,
    duration: 60,
    options: {
      pathId: 'testPath',
      startOffset: 0,
      endOffset: 1,
      orient: true,
      alignOrigin: { x: 0.5, y: 0.5 },
      easing: 'linear'
    }
  });
  
  // Check element position at various points along the path
  const pathFramesToCheck = [100, 110, 130, 160];
  
  console.log("\nPath Animation at Different Frames:");
  pathFramesToCheck.forEach(frame => {
    engine.seekToFrame(frame);
    const elements = engine.getCurrentElements();
    const circle = elements.find(el => el.id === 'circle');
    if (circle) {
      console.log(`  Frame ${frame}: x=${circle.properties.x.toFixed(1)}, y=${circle.properties.y.toFixed(1)}, rotation=${circle.properties.rotation?.toFixed(1) || 'N/A'}`);
    }
  });
}

testPathAnimation();
```

## 5. Testing Event Triggers

Verify that event triggers fire at the correct frames:

```typescript
function testEventTriggers() {
  console.log("\nTesting Event Triggers:");
  
  // Store triggered events for verification
  const triggeredEvents = [];
  
  // Add event listeners to track triggers
  engine.addEventListener('jumpToEnd', (data) => {
    console.log(`Event 'jumpToEnd' triggered at frame ${data.currentFrame}`);
    triggeredEvents.push({ name: 'jumpToEnd', frame: data.currentFrame });
    
    // Execute the jump action
    engine.seekToFrame(280);
  });
  
  engine.addEventListener('rangeEntered', (data) => {
    console.log(`Entered special range at frame ${data.currentFrame}`);
    triggeredEvents.push({ name: 'rangeEntered', frame: data.currentFrame });
  });
  
  // Add frame triggers
  engine.addFrameTrigger(50, 'jumpToEnd');
  
  // Add range triggers
  engine.addRangeTrigger(200, 250, 'rangeEntered');
  
  // Add interaction triggers
  engine.addInteractionTrigger('rect', EventTriggerType.CLICK, 'elementClicked', { message: 'Rectangle clicked!' });
  
  // Run the animation from beginning to end
  engine.seekToFrame(0);
  
  // Simulate playback by advancing frame by frame
  for (let frame = 0; frame <= 300; frame += 10) {
    engine.seekToFrame(frame);
  }
  
  console.log("\nTriggered Events Summary:");
  triggeredEvents.forEach(event => {
    console.log(`  Event '${event.name}' was triggered at frame ${event.frame}`);
  });
  
  // Simulate user interaction
  console.log("\nSimulating User Interaction:");
  engine.handleElementInteraction(EventTriggerType.CLICK, 'rect', { clientX: 250, clientY: 120 });
}

testEventTriggers();
```

## 6. Comprehensive Playback Test

Create a test that simulates complete playback with all features active:

```typescript
function testFullPlayback() {
  console.log("\nRunning Full Playback Test:");
  
  // Reset to beginning
  engine.stop();
  
  // Set up a playback completion callback
  engine.addEventListener('playbackComplete', () => {
    console.log("Playback completed!");
  });
  
  // Log status every second during playback
  let playbackTimer;
  
  // Start playback
  engine.play();
  
  playbackTimer = setInterval(() => {
    const currentFrame = engine.currentFrame;
    console.log(`Playback at frame ${currentFrame} (${(currentFrame / testTimeline.frameRate).toFixed(1)}s)`);
    
    // Check if playback has completed
    if (!engine.isPlaying) {
      clearInterval(playbackTimer);
      console.log("Playback stopped");
    }
  }, 1000);
  
  // After timeout, stop the animation
  setTimeout(() => {
    engine.stop();
    clearInterval(playbackTimer);
    console.log("Test playback stopped manually after timeout");
  }, 10000); // Stop after 10 seconds
}

// Run full playback test
testFullPlayback();
```

## 7. Visual Testing

Since these animations are meant to be visual, it's important to render the output:

```typescript
// HTML Canvas renderer for testing visual output
class TestRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(width = 800, height = 600) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
  }
  
  render(elements) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render each element
    elements.forEach(element => {
      this.renderElement(element);
    });
  }
  
  private renderElement(element) {
    const { properties } = element;
    this.ctx.fillStyle = properties.fill || '#000000';
    
    switch(element.type) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(properties.x, properties.y, properties.radius, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'rectangle':
        this.ctx.fillRect(properties.x, properties.y, properties.width, properties.height);
        break;
        
      // Add other element types as needed
    }
  }
}

// Set up visual renderer and animation loop
function visualTest() {
  const renderer = new TestRenderer();
  
  function animate() {
    // Get current elements
    const elements = engine.getCurrentElements();
    
    // Render them
    renderer.render(elements);
    
    // Advance animation
    if (engine.isPlaying) {
      requestAnimationFrame(animate);
    }
  }
  
  // Start visual test
  engine.play();
  animate();
}

// Run visual test if in browser environment
if (typeof window !== 'undefined') {
  visualTest();
}
```

## 8. Automated Testing

For systematic testing, you can create automated tests with a testing framework like Jest:

```typescript
// Example Jest test for easing functions
describe('AnimationEngine', () => {
  let engine;
  
  beforeEach(() => {
    // Create fresh engine for each test
    engine = new AnimationEngine(testTimeline);
  });
  
  test('Easing functions produce expected values', () => {
    // Test that linear easing produces expected values
    const linear = Easing.getEasingFunction('linear');
    expect(linear(0)).toBe(0);
    expect(linear(0.5)).toBe(0.5);
    expect(linear(1)).toBe(1);
    
    // Test that ease-in-quad produces expected values
    const easeInQuad = Easing.getEasingFunction('ease-in-quad');
    expect(easeInQuad(0)).toBe(0);
    expect(easeInQuad(0.5)).toBe(0.25); // t²
    expect(easeInQuad(1)).toBe(1);
  });
  
  test('Animation groups apply correct properties', () => {
    engine.registerGroup({
      id: 'testGroup',
      type: AnimationGroupType.PARALLEL,
      elementIds: ['circle'],
      properties: ['radius'],
      startFrame: 10,
      duration: 20,
      easing: 'linear'
    });
    
    // Check initial state
    engine.seekToFrame(0);
    let elements = engine.getCurrentElements();
    let circle = elements.find(el => el.id === 'circle');
    expect(circle.properties.radius).toBe(50);
    
    // Check during animation
    engine.seekToFrame(20);
    elements = engine.getCurrentElements();
    circle = elements.find(el => el.id === 'circle');
    expect(circle.properties.radius).toBeGreaterThan(50);
    
    // Check after animation
    engine.seekToFrame(31);
    elements = engine.getCurrentElements();
    circle = elements.find(el => el.id === 'circle');
    expect(circle.properties.radius).toBe(100); // Final value should be double the initial
  });
  
  // Add more tests for other features
});
```

## 9. Debug Logging and Validation

Add debug logging to help diagnose issues during testing:

```typescript
// Enable debug mode in the AnimationEngine
engine.enableDebug = true;

// Add more detailed logging in your implementation:
private animationLoop(): void {
  const now = performance.now();
  const elapsed = now - this.lastFrameTime;
  
  if (this.enableDebug) {
    console.log(`Animation Frame: ${this.currentFrame}, Elapsed: ${elapsed.toFixed(2)}ms`);
  }
  
  // Rest of the method...
}
```

## Practical Testing Strategy

To effectively verify your implementation:

1. **Start with unit tests** for the core components (easing, interpolation, path calculations)
2. **Move to integration tests** that verify groups, sequences, and events work together
3. **Perform visual tests** to ensure animations look correct
4. **Test edge cases** like:
   - Animations with 0 duration
   - Empty groups or sequences
   - Paths with missing coordinates
   - Overlapping or conflicting animations
   - Very fast animations (1-2 frames)
   - Very slow animations (1000+ frames)
5. **Test performance** with many simultaneous animations

By methodically testing each feature, you'll be able to verify that your enhanced AnimationEngine is working correctly and catch any remaining issues.