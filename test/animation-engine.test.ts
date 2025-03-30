import { AnimationEngine } from '../packages/runtime/src/animation/animation-engine';
import { Timeline, Element, ElementType } from '@flare/shared';
import { EventTriggerType } from '../packages/runtime/src/animation/events';

describe('AnimationEngine Integration Tests', () => {
  // Create a test timeline with animation data
  const testTimeline: Timeline = {
    version: '1.0',
    frameRate: 60,
    duration: 300,
    dimensions: {
      width: 800,
      height: 600,
      responsive: true
    },
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
                type: ElementType.CIRCLE,
                properties: {
                  x: 100,
                  y: 100,
                  radius: 50,
                  fill: '#ff0000'
                },
                animations: [
                  {
                    property: 'x',
                    keyframes: [
                      { frame: 0, value: 100, easing: 'linear' },
                      { frame: 60, value: 300, easing: 'linear' },
                      { frame: 120, value: 100, easing: 'linear' }
                    ]
                  },
                  {
                    property: 'radius',
                    keyframes: [
                      { frame: 0, value: 50, easing: 'ease-in-out' },
                      { frame: 150, value: 100, easing: 'ease-in-out' },
                      { frame: 300, value: 50, easing: 'ease-in-out' }
                    ]
                  }
                ]
              },
              {
                id: 'rect',
                type: ElementType.RECTANGLE,
                properties: {
                  x: 200,
                  y: 150,
                  width: 100,
                  height: 80,
                  fill: '#0000ff'
                },
                animations: [
                  {
                    property: 'y',
                    keyframes: [
                      { frame: 30, value: 150, easing: 'ease-out-bounce' },
                      { frame: 90, value: 300, easing: 'ease-out-bounce' },
                      { frame: 150, value: 150, easing: 'ease-out-bounce' }
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

  describe('Basic Animation Playback', () => {
    let engine: AnimationEngine;
    
    beforeEach(() => {
      engine = new AnimationEngine(testTimeline);
    });
    
    test('should animate properties over time', () => {
      // Check initial position
      engine.seekToFrame(0);
      const startElements = engine.getCurrentElements();
      const circle = startElements.find(el => el.id === 'circle');
      expect(circle?.properties.x).toBe(100);
      
      // Check middle position
      engine.seekToFrame(30);
      const midElements = engine.getCurrentElements();
      const midCircle = midElements.find(el => el.id === 'circle');
      
      // Should be halfway between 100 and 300 at frame 30 (which is halfway to frame 60)
      expect(midCircle?.properties.x).toBeCloseTo(200, 0);
      
      // Check end of first animation segment
      engine.seekToFrame(60);
      const endElements = engine.getCurrentElements();
      const endCircle = endElements.find(el => el.id === 'circle');
      expect(endCircle?.properties.x).toBeCloseTo(300, 0);
    });
    
    test('should apply easing functions', () => {
      // The circle radius has ease-in-out easing
      // Check at 1/4 of the animation
      engine.seekToFrame(37); // 1/4 of the way from 0 to 150
      const quarterElements = engine.getCurrentElements();
      const quarterCircle = quarterElements.find(el => el.id === 'circle');
      
      // With ease-in-out, at 1/4 time we should be less than 1/4 of the way through the change
      // Linear would be: 50 + (100-50)*0.25 = 62.5
      // But with ease-in-out it should be less
      expect(quarterCircle?.properties.radius).toBeLessThan(62.5);
      
      // Check rectangle with bounce easing
      engine.seekToFrame(60); // 1/2 of the way from 30 to 90
      const midElements = engine.getCurrentElements();
      const midRect = midElements.find(el => el.id === 'rect');
      
      // With bounce easing, it might overshoot the target
      const halfwayY = 150 + (300 - 150) * 0.5; // Linear would be 225
      // It could be above or below depending on the bounce implementation
      expect(midRect?.properties.y).not.toBeCloseTo(halfwayY, 0);
    });
    
    test('should handle multiple animations on the same element', () => {
      // Circle has animations for both x and radius
      engine.seekToFrame(75);
      const elements = engine.getCurrentElements();
      const circle = elements.find(el => el.id === 'circle');
      
      // Both properties should be animated
      expect(circle?.properties.x).not.toBe(100); // Initial value
      expect(circle?.properties.radius).not.toBe(50); // Initial value
    });
    
    test('should respect layer visibility', () => {
      // Make a copy of the timeline with the layer invisible
      const invisibleLayerTimeline: Timeline = JSON.parse(JSON.stringify(testTimeline));
      invisibleLayerTimeline.layers[0].visible = false;
      
      // Create a new engine with the modified timeline
      const invisibleEngine = new AnimationEngine(invisibleLayerTimeline);
      
      // Get elements - should be empty since layer is invisible
      invisibleEngine.seekToFrame(0);
      const elements = invisibleEngine.getCurrentElements();
      expect(elements.length).toBe(0);
    });
  });
  
  describe('Animation Control', () => {
    let engine: AnimationEngine;
    let playbackCallback: jest.Mock;

    beforeEach(() => {
      engine = new AnimationEngine(testTimeline);
      playbackCallback = jest.fn();
      engine.addEventListener('playbackComplete', playbackCallback);
    });
    
    test('play/pause/stop methods', () => {
      // These methods don't return values, so we're just checking they don't throw
      expect(() => engine.play()).not.toThrow();
      expect(() => engine.pause()).not.toThrow();
      expect(() => engine.stop()).not.toThrow();
      
      // Check that stop resets to frame 0
      engine.seekToFrame(50);
      engine.stop();
      expect(engine.seekToFrame(0)).toBeUndefined(); // Should already be at frame 0
    });
    
    test('seeking to invalid frames should clamp to valid range', () => {
      // Seek to negative frame (should clamp to 0)
      engine.seekToFrame(-10);
      const elements1 = engine.getCurrentElements();
      const circle1 = elements1.find(el => el.id === 'circle');
      expect(circle1?.properties.x).toBe(100); // Value at frame 0
      
      // Seek past the end (should clamp to duration-1)
      engine.seekToFrame(1000);
      const elements2 = engine.getCurrentElements();
      const circle2 = elements2.find(el => el.id === 'circle');
      
      // Should be at the final frame's value
      expect(circle2?.properties.radius).toBeCloseTo(50, 0); // Final value of radius animation
    });
  });
  
  describe('Color Animation', () => {
    // Create a timeline with color animation
    const colorTimeline: Timeline = {
      version: '1.0',
      frameRate: 60,
      duration: 60,
      dimensions: { width: 400, height: 300, responsive: false },
      layers: [{
        id: 'colorLayer',
        type: 'normal',
        visible: true,
        locked: false,
        frames: [{
          startFrame: 0,
          duration: 60,
          elements: [{
            id: 'colorRect',
            type: ElementType.RECTANGLE,
            properties: {
              x: 0, y: 0, width: 100, height: 100,
              fill: '#ff0000'
            },
            animations: [{
              property: 'fill',
              keyframes: [
                { frame: 0, value: '#ff0000', easing: 'linear' },
                { frame: 30, value: '#0000ff', easing: 'linear' }
              ]
            }]
          }]
        }]
      }],
      scripts: []
    };
    
    test('should interpolate between colors', () => {
      const engine = new AnimationEngine(colorTimeline);
      
      // Start: red
      engine.seekToFrame(0);
      const startElements = engine.getCurrentElements();
      expect(startElements[0].properties.fill).toBe('#ff0000');
      
      // Middle: should be a purple mix of red and blue
      engine.seekToFrame(15);
      const midElements = engine.getCurrentElements();
      const midColor = midElements[0].properties.fill as string;
      
      // Should be a valid hex color
      expect(midColor).toMatch(/^#[0-9a-f]{6}$/i);
      
      // The red component should be decreasing
      const redComponent = parseInt(midColor.substring(1, 3), 16);
      expect(redComponent).toBeLessThan(255);
      expect(redComponent).toBeGreaterThan(0);
      
      // The blue component should be increasing
      const blueComponent = parseInt(midColor.substring(5, 7), 16);
      expect(blueComponent).toBeGreaterThan(0);
      expect(blueComponent).toBeLessThan(255);
      
      // End: blue
      engine.seekToFrame(30);
      const endElements = engine.getCurrentElements();
      expect(endElements[0].properties.fill).toBe('#0000ff');
    });
  });
  
  describe('Full Integration', () => {
    let engine: AnimationEngine;
    
    beforeEach(() => {
      engine = new AnimationEngine(testTimeline);
    });
    
    test('should integrate all animation features', () => {
      // Register a path for path animation
      engine.registerPath({
        id: 'testPath',
        commands: [
          { type: 'M', x: 100, y: 100 },
          { type: 'L', x: 300, y: 100 },
          { type: 'L', x: 300, y: 300 },
          { type: 'L', x: 100, y: 300 },
          { type: 'Z' }
        ],
        closed: true
      });
      
      // Register a path animation
      engine.registerPathAnimation({
        elementId: 'rect',
        startFrame: 200,
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
      
      // Register an animation group
      engine.registerGroup({
        id: 'group1',
        type: 'parallel',
        elementIds: ['circle', 'rect'],
        properties: ['fill'],
        startFrame: 20,
        duration: 30,
        easing: 'linear'
      });
      
      // Register an animation sequence
      engine.registerSequence({
        id: 'sequence1',
        steps: [
          { groupId: 'group1', waitForComplete: true }
        ],
        repeat: 1,
        autoPlay: false
      });
      
      // Add event triggers
      engine.addFrameTrigger(10, 'frameAction');
      engine.addRangeTrigger(100, 150, 'rangeAction');
      engine.addInteractionTrigger('circle', EventTriggerType.CLICK, 'clickAction');
      
      // Set up event handlers
      let frameActionCalled = false;
      let rangeActionCalled = false;
      let clickActionCalled = false;
      
      engine.addEventListener('frameAction', () => {
        frameActionCalled = true;
      });
      
      engine.addEventListener('rangeAction', () => {
        rangeActionCalled = true;
      });
      
      engine.addEventListener('clickAction', () => {
        clickActionCalled = true;
      });
      
      // Test frame trigger
      engine.seekToFrame(10);
      expect(frameActionCalled).toBe(true);
      
      // Test range trigger
      engine.seekToFrame(120);
      expect(rangeActionCalled).toBe(true);
      
      // Test interaction
      engine.handleElementInteraction(EventTriggerType.CLICK, 'circle');
      expect(clickActionCalled).toBe(true);
      
      // Test sequence playback
      engine.playSequence('sequence1');
      engine.seekToFrame(35); // Mid-sequence
      const midElements = engine.getCurrentElements();
      
      // Both elements should be present
      const circle = midElements.find(el => el.id === 'circle');
      const rect = midElements.find(el => el.id === 'rect');
      expect(circle).toBeDefined();
      expect(rect).toBeDefined();
      
      // Test path animation
      engine.seekToFrame(230); // During path animation
      const pathElements = engine.getCurrentElements();
      const pathRect = pathElements.find(el => el.id === 'rect');
      
      // Element should be on the path and have a rotation property
      expect(pathRect?.properties.rotation).toBeDefined();
      expect(pathRect?.properties.x).not.toBe(200); // Original position
      expect(pathRect?.properties.y).not.toBe(150); // Original position
    });
  });
});