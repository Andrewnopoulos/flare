import { Timeline, Frame, Layer, Element } from '@flare/shared';

export class AnimationEngine {
  private timeline: Timeline;
  private currentFrame: number = 0;
  private isPlaying: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;

  constructor(timeline: Timeline) {
    this.timeline = timeline;
  }

  /**
   * Start playing the animation
   */
  public play(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animationLoop();
  }

  /**
   * Pause the animation
   */
  public pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  /**
   * Stop the animation and reset to beginning
   */
  public stop(): void {
    this.pause();
    this.currentFrame = 0;
  }

  /**
   * Seek to a specific frame
   */
  public seekToFrame(frame: number): void {
    this.currentFrame = Math.max(0, Math.min(frame, this.timeline.duration - 1));
  }

  /**
   * The main animation loop
   */
  private animationLoop(): void {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    
    // Calculate how many frames to advance based on elapsed time and frame rate
    const frameTime = 1000 / this.timeline.frameRate;
    const framesToAdvance = Math.floor(elapsed / frameTime);
    
    if (framesToAdvance > 0) {
      this.lastFrameTime = now - (elapsed % frameTime);
      this.advanceFrames(framesToAdvance);
    }
    
    // Request next frame if still playing
    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
    }
  }

  /**
   * Advance the animation by a number of frames
   */
  private advanceFrames(frames: number): void {
    this.currentFrame += frames;
    
    // Loop back to beginning if we reach the end
    if (this.currentFrame >= this.timeline.duration) {
      this.currentFrame = this.currentFrame % this.timeline.duration;
    }
  }

  /**
   * Get the current elements to display
   */
  public getCurrentElements(): Element[] {
    const elements: Element[] = [];
    
    // For each layer
    for (const layer of this.timeline.layers) {
      if (!layer.visible) continue;
      
      // Find the active frame for this layer at the current time
      const activeFrame = this.findActiveFrame(layer);
      if (activeFrame) {
        // Apply any animations to the elements
        const animatedElements = this.applyAnimations(activeFrame.elements, activeFrame);
        elements.push(...animatedElements);
      }
    }
    
    return elements;
  }

  /**
   * Find the active frame for a layer at the current time
   */
  private findActiveFrame(layer: Layer): Frame | null {
    for (const frame of layer.frames) {
      const frameEnd = frame.startFrame + frame.duration;
      if (this.currentFrame >= frame.startFrame && this.currentFrame < frameEnd) {
        return frame;
      }
    }
    return null;
  }

  /**
   * Apply animations to elements
   * This is a simplified version that only handles basic property tweening
   */
  private applyAnimations(elements: Element[], frame: Frame): Element[] {
    return elements.map(element => {
      // Deep clone the element to avoid modifying the original
      const animatedElement = JSON.parse(JSON.stringify(element)) as Element;
      
      // Check if this element has animations
      if (!element.animations) return animatedElement;
      
      // For each animation on this element
      for (const animation of element.animations || []) {
        // Find the keyframes that bracket the current time
        let startKeyframe = null;
        let endKeyframe = null;
        
        for (let i = 0; i < animation.keyframes.length - 1; i++) {
          const currentKeyframe = animation.keyframes[i];
          const nextKeyframe = animation.keyframes[i + 1];
          
          const absoluteCurrentFrame = frame.startFrame + currentKeyframe.frame;
          const absoluteNextFrame = frame.startFrame + nextKeyframe.frame;
          
          if (this.currentFrame >= absoluteCurrentFrame && this.currentFrame <= absoluteNextFrame) {
            startKeyframe = currentKeyframe;
            endKeyframe = nextKeyframe;
            break;
          }
        }
        
        // If we found bracketing keyframes, interpolate the property
        if (startKeyframe && endKeyframe) {
          const absoluteStartFrame = frame.startFrame + startKeyframe.frame;
          const absoluteEndFrame = frame.startFrame + endKeyframe.frame;
          const progress = (this.currentFrame - absoluteStartFrame) / (absoluteEndFrame - absoluteStartFrame);
          
          // Apply easing if specified
          const easedProgress = this.applyEasing(progress, startKeyframe.easing);
          
          // Interpolate the value
          const startValue = startKeyframe.value;
          const endValue = endKeyframe.value;
          
          // Simple linear interpolation for numeric values
          if (typeof startValue === 'number' && typeof endValue === 'number') {
            const interpolatedValue = startValue + (endValue - startValue) * easedProgress;
            // Set the property on the element
            this.setNestedProperty(animatedElement.properties, animation.property, interpolatedValue);
          }
        }
      }
      
      return animatedElement;
    });
  }

  /**
   * Apply easing function to a progress value
   */
  private applyEasing(progress: number, easingName: string): number {
    // Implement common easing functions
    switch (easingName) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return progress * (2 - progress);
      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      default:
        return progress;
    }
  }

  /**
   * Set a nested property on an object
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
}