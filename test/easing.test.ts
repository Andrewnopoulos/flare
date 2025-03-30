import { Easing } from '../packages/runtime/src/animation/easing';

describe('Easing Functions', () => {
  // Sample time values to test
  const timePoints = [0, 0.25, 0.5, 0.75, 1.0];

  describe('Basic easing functions', () => {
    test('linear easing should return input value', () => {
      expect(Easing.linear(0)).toBe(0);
      expect(Easing.linear(0.5)).toBe(0.5);
      expect(Easing.linear(1)).toBe(1);
    });

    test('easeInQuad should follow t*t curve', () => {
      timePoints.forEach(t => {
        expect(Easing.easeInQuad(t)).toBeCloseTo(t * t);
      });
    });

    test('easeOutQuad should follow t*(2-t) curve', () => {
      timePoints.forEach(t => {
        expect(Easing.easeOutQuad(t)).toBeCloseTo(t * (2 - t));
      });
    });

    test('easeInOutQuad should be symmetrical', () => {
      // Test symmetry
      expect(Easing.easeInOutQuad(0.25)).toBeCloseTo(1 - Easing.easeInOutQuad(0.75));
      
      // Test specific values
      expect(Easing.easeInOutQuad(0)).toBe(0);
      expect(Easing.easeInOutQuad(0.5)).toBe(0.5);
      expect(Easing.easeInOutQuad(1)).toBe(1);
    });
  });

  describe('Cubic easing functions', () => {
    test('easeInCubic should follow t*t*t curve', () => {
      timePoints.forEach(t => {
        expect(Easing.easeInCubic(t)).toBeCloseTo(t * t * t);
      });
    });

    test('easeOutCubic should be inverse of easeInCubic', () => {
      timePoints.forEach(t => {
        expect(Easing.easeOutCubic(t) + Easing.easeInCubic(1 - t)).toBeCloseTo(1);
      });
    });
  });

  describe('Elastic easing functions', () => {
    test('elastic easing functions should return proper boundary values', () => {
      // All elastic easings should start at 0 and end at 1
      expect(Easing.easeInElastic(0)).toBe(0);
      expect(Easing.easeInElastic(1)).toBe(1);
      expect(Easing.easeOutElastic(0)).toBe(0);
      expect(Easing.easeOutElastic(1)).toBe(1);
      expect(Easing.easeInOutElastic(0)).toBe(0);
      expect(Easing.easeInOutElastic(1)).toBe(1);
    });

    test('elastic easing should overshoot before settling', () => {
      // Out elastic should overshoot on the way up
      expect(Easing.easeOutElastic(0.2)).toBeGreaterThan(0.2);
      
      // In elastic should undershoot on the way up
      expect(Easing.easeInElastic(0.8)).toBeLessThan(0.8);
    });
  });

  describe('Bounce easing functions', () => {
    test('bounce easing functions should return proper boundary values', () => {
      expect(Easing.easeInBounce(0)).toBe(0);
      expect(Easing.easeInBounce(1)).toBe(1);
      expect(Easing.easeOutBounce(0)).toBe(0);
      expect(Easing.easeOutBounce(1)).toBe(1);
    });

    test('easeInBounce and easeOutBounce should be reflections of each other', () => {
      timePoints.forEach(t => {
        expect(Easing.easeInBounce(t)).toBeCloseTo(1 - Easing.easeOutBounce(1 - t));
      });
    });
  });

  describe('getEasingFunction utility', () => {
    test('should return correct easing function by name', () => {
      expect(Easing.getEasingFunction('linear')).toBe(Easing.linear);
      expect(Easing.getEasingFunction('ease-in-quad')).toBe(Easing.easeInQuad);
      expect(Easing.getEasingFunction('ease-out-bounce')).toBe(Easing.easeOutBounce);
    });

    test('should return linear function for unknown easing name', () => {
      expect(Easing.getEasingFunction('non-existent-easing')).toBe(Easing.linear);
    });

    test('should handle CSS shorthand names', () => {
      expect(Easing.getEasingFunction('ease-in')).toBe(Easing.easeInQuad);
      expect(Easing.getEasingFunction('ease-out')).toBe(Easing.easeOutQuad);
      expect(Easing.getEasingFunction('ease-in-out')).toBe(Easing.easeInOutQuad);
    });
  });

  describe('Bezier easing function generator', () => {
    test('should create a function that produces expected results for common curves', () => {
      // Generate a standard "ease" cubic-bezier function
      const ease = Easing.bezier(0.25, 0.1, 0.25, 1.0);
      
      // Should return 0 and 1 at the boundaries
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
      
      // Should be greater than linear for middle values (acceleration then deceleration)
      expect(ease(0.5)).not.toBe(0.5);
    });

    test('should approximate CSS easing functions', () => {
      // CSS ease is approximately cubic-bezier(0.25, 0.1, 0.25, 1.0)
      const cssEase = Easing.bezier(0.25, 0.1, 0.25, 1.0);
      
      // Output should be monotonically increasing
      let prev = 0;
      for (let t = 0; t <= 1; t += 0.1) {
        const current = cssEase(t);
        expect(current).toBeGreaterThanOrEqual(prev);
        prev = current;
      }
    });
  });
});