import { Timeline, Frame, Layer, Element } from '@flare/shared';
import { Easing } from './easing';
import {
  AnimationGroup,
  AnimationGroupType,
  AnimationSequence
} from './groups';
import {
  Path,
  PathManager,
  PathAnimation
} from './pathing';
import {
  EventTriggerType,
  EventTriggerManager,
  EventHandler,
  EventData
} from './events';

/**
 * Enhanced AnimationEngine that integrates all the new features
 */
export class AnimationEngine {
  private timeline: Timeline;
  private currentFrame: number = 0;
  private isPlaying: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;

  // New components
  private pathManager: PathManager;
  private eventManager: EventTriggerManager;
  private groups: Map<string, AnimationGroup> = new Map();
  private sequences: Map<string, AnimationSequence> = new Map();
  private activeSequences: Map<string, {
    sequence: AnimationSequence,
    currentStep: number,
    iterations: number
  }> = new Map();

  constructor(timeline: Timeline) {
    this.timeline = timeline;
    this.pathManager = new PathManager();
    this.eventManager = new EventTriggerManager();

    // Set up default event actions
    this.setupDefaultEventActions();
  }

  /**
   * Set up default event handlers
   */
  private setupDefaultEventActions(): void {
    // Navigation actions
    this.eventManager.addEventListener('gotoFrame', (data) => {
      if (data.parameters && typeof data.parameters.frame === 'number') {
        this.seekToFrame(data.parameters.frame);
      }
    });

    this.eventManager.addEventListener('gotoAndPlay', (data) => {
      if (data.parameters && typeof data.parameters.frame === 'number') {
        this.seekToFrame(data.parameters.frame);
        this.play();
      }
    });

    this.eventManager.addEventListener('gotoAndStop', (data) => {
      if (data.parameters && typeof data.parameters.frame === 'number') {
        this.seekToFrame(data.parameters.frame);
        this.pause();
      }
    });

    // Playback control
    this.eventManager.addEventListener('play', (data) => {
      this.play();
    });

    this.eventManager.addEventListener('pause', (data) => {
      this.pause();
    });

    this.eventManager.addEventListener('stop', (data) => {
      this.stop();
    });

    this.eventManager.addEventListener('togglePlay', (data) => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    });

    // Sequence control
    this.eventManager.addEventListener('playSequence', (data) => {
      if (data.parameters && data.parameters.sequenceId) {
        this.playSequence(data.parameters.sequenceId);
      }
    });

    this.eventManager.addEventListener('stopSequence', (data) => {
      if (data.parameters && data.parameters.sequenceId) {
        this.stopSequence(data.parameters.sequenceId);
      }
    });
  }

  /**************************************
   * Core Animation Engine Methods
   **************************************/

  /**
   * Start playing the animation
   */
  public play(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animationLoop();

    // Trigger play event
    this.eventManager.triggerPlaybackEvent(EventTriggerType.PLAY);
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

    // Trigger pause event
    this.eventManager.triggerPlaybackEvent(EventTriggerType.PAUSE);
  }

  /**
   * Stop the animation and reset to beginning
   */
  public stop(): void {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentFrame = 0;
    this.activeSequences.clear();

    // Update the event manager with new frame
    this.eventManager.updateFrame(this.currentFrame);

    // Trigger stop event
    this.eventManager.triggerPlaybackEvent(EventTriggerType.STOP);
  }

  /**
   * Seek to a specific frame
   */
  public seekToFrame(frame: number): void {
    const oldFrame = this.currentFrame;
    this.currentFrame = Math.max(0, Math.min(frame, this.timeline.duration - 1));

    // Update event manager with the new frame
    this.eventManager.updateFrame(this.currentFrame);
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

      // Store the old frame
      const oldFrame = this.currentFrame;

      // Advance frames
      this.advanceFrames(framesToAdvance);

      // Update event manager with the new frame
      this.eventManager.updateFrame(this.currentFrame);
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

    // Check if we've reached the end
    if (this.currentFrame >= this.timeline.duration) {
      // Loop back to beginning
      this.currentFrame = this.currentFrame % this.timeline.duration;

      // Trigger loop event
      this.eventManager.triggerPlaybackEvent(EventTriggerType.LOOP);
    }
  }

  /**
   * Get the current elements to display with all animations applied
   */
  public getCurrentElements(): Element[] {
    let elements: Element[] = [];

    // For each layer
    for (const layer of this.timeline.layers) {
      if (!layer.visible) continue;

      // Find the active frame for this layer at the current time
      const activeFrame = this.findActiveFrame(layer);
      if (activeFrame) {
        // Apply standard animations to the elements
        let animatedElements = this.applyAnimations(activeFrame.elements, activeFrame);

        // Apply path-based animations
        animatedElements = this.pathManager.applyPathAnimations(animatedElements, this.currentFrame);

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
   */
  private applyAnimations(elements: Element[], frame: Frame): Element[] {
    return elements.map(element => {
      // Deep clone the element to avoid modifying the original
      const animatedElement = JSON.parse(JSON.stringify(element)) as Element;

      // Skip if no animations
      if (!element.animations) return animatedElement;

      // For each animation on this element
      for (const animation of element.animations) {
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

          // Apply easing using our enhanced easing system
          const easingFunction = Easing.getEasingFunction(startKeyframe.easing || 'linear');
          const easedProgress = easingFunction(progress);

          // Interpolate the value
          const startValue = startKeyframe.value;
          const endValue = endKeyframe.value;

          // Handle different value types
          if (typeof startValue === 'number' && typeof endValue === 'number') {
            // Numeric values
            const interpolatedValue = startValue + (endValue - startValue) * easedProgress;
            this.setNestedProperty(animatedElement.properties, animation.property, interpolatedValue);
          } else if (typeof startValue === 'string' && typeof endValue === 'string') {
            // Check for color values
            if (startValue.startsWith('#') && endValue.startsWith('#')) {
              const interpolatedColor = this.interpolateColor(startValue, endValue, easedProgress);
              this.setNestedProperty(animatedElement.properties, animation.property, interpolatedColor);
            }
          } else if (
            Array.isArray(startValue) &&
            Array.isArray(endValue) &&
            startValue.length === endValue.length
          ) {
            // Array values (e.g., for transforms or points)
            const interpolatedArray = startValue.map((start, index) => {
              const end = endValue[index];
              if (typeof start === 'number' && typeof end === 'number') {
                return start + (end - start) * easedProgress;
              }
              return end; // Fallback for non-numeric array values
            });
            this.setNestedProperty(animatedElement.properties, animation.property, interpolatedArray);
          }
        }
      }

      return animatedElement;
    });
  }

  /**
   * Interpolate between two colors
   */
  private interpolateColor(color1: string, color2: string, progress: number): string {
    // Parse hex colors into RGB components
    const parseColor = (hex: string): number[] => {
      hex = hex.replace('#', '');

      // Support both 3-digit and 6-digit hex colors
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      }

      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
      ];
    };

    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);

    // Interpolate each component
    const result = rgb1.map((component, index) => {
      const target = rgb2[index];
      const interpolated = Math.round(component + (target - component) * progress);
      // Clamp to valid range
      return Math.max(0, Math.min(255, interpolated));
    });

    // Convert back to hex
    return '#' + result.map(c => c.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get a nested property from an object
   */
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined || !(part in current)) {
        return undefined;
      }
      current = current[part];
    }

    return current;
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

  /**************************************
   * Animation Group and Sequence Methods
   **************************************/

  /**
   * Register an animation group
   */
  public registerGroup(group: AnimationGroup): void {
    this.groups.set(group.id, group);
  }

  /**
   * Register an animation sequence
   */
  public registerSequence(sequence: AnimationSequence): void {
    this.sequences.set(sequence.id, sequence);

    // Auto-play if specified
    if (sequence.autoPlay) {
      this.playSequence(sequence.id);
    }
  }

  /**
   * Start playing a sequence
   */
  public playSequence(sequenceId: string): void {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return;

    this.activeSequences.set(sequenceId, {
      sequence,
      currentStep: 0,
      iterations: 0
    });

    // Execute the first step
    this.executeSequenceStep(sequenceId);

    // Make sure animation is playing
    this.play();
  }

  /**
   * Stop a sequence
   */
  public stopSequence(sequenceId: string): void {
    this.activeSequences.delete(sequenceId);
  }

  /**
   * Execute a step in a sequence
   */
  private executeSequenceStep(sequenceId: string): void {
    const activeSequence = this.activeSequences.get(sequenceId);
    if (!activeSequence) return;

    const { sequence, currentStep } = activeSequence;

    // Check if we've reached the end of the sequence
    if (currentStep >= sequence.steps.length) {
      // Increment iteration count
      activeSequence.iterations++;

      // Check if we should repeat
      if (sequence.repeat === -1 || activeSequence.iterations < sequence.repeat) {
        // Reset to beginning
        activeSequence.currentStep = 0;
        this.executeSequenceStep(sequenceId);
      } else {
        // Sequence is complete
        this.eventManager.dispatchEvent('sequenceComplete', {
          triggerId: `sequence_${sequenceId}`,
          timestamp: Date.now(),
          sequenceId
        });
        this.activeSequences.delete(sequenceId);
      }
      return;
    }

    // Get the current step
    const step = sequence.steps[currentStep];
    const group = this.groups.get(step.groupId);

    if (!group) {
      console.error(`Animation group ${step.groupId} not found`);
      activeSequence.currentStep++;
      this.executeSequenceStep(sequenceId);
      return;
    }

    // Execute the group animations
    this.playGroup(group);

    // If we don't need to wait for completion, move to next step
    if (!step.waitForComplete) {
      activeSequence.currentStep++;
      this.executeSequenceStep(sequenceId);
    } else {
      // Set up a one-time listener for group completion
      const onComplete = (data: EventData) => {
        // Trigger step completion event if specified
        if (step.onComplete) {
          this.eventManager.dispatchEvent(step.onComplete, {
            triggerId: `sequenceStep_${sequenceId}_${currentStep}`,
            timestamp: Date.now(),
            sequenceId,
            stepIndex: currentStep
          });
        }

        // Move to next step
        activeSequence.currentStep++;
        this.executeSequenceStep(sequenceId);

        // Remove this listener
        this.eventManager.removeEventListener('animationComplete', onComplete);
      };

      this.eventManager.addEventListener('animationComplete', onComplete);
    }
  }

  /**
   * Play animations in a group
   */
  private playGroup(group: AnimationGroup): void {
    // Get all the elements in the group
    const elements = group.elementIds.map(id => this.findElementById(id)).filter(Boolean) as Element[];

    // Apply animations based on group type
    switch (group.type) {
      case AnimationGroupType.PARALLEL:
        // Start all animations at the same time
        elements.forEach(element => {
          this.applyGroupAnimationToElement(element, group, 0);
        });
        break;

      case AnimationGroupType.SEQUENCE:
        // Start each animation after the previous one finishes
        elements.forEach((element, index) => {
          const delay = (group.duration / elements.length) * index;
          this.applyGroupAnimationToElement(element, group, delay);
        });
        break;

      case AnimationGroupType.STAGGER:
        // Start each animation with a fixed delay
        const staggerDelay = group.staggerDelay || 5; // Default to 5 frames if not specified
        elements.forEach((element, index) => {
          this.applyGroupAnimationToElement(element, group, staggerDelay * index);
        });
        break;
    }

    // Set a timeout to trigger the completion event
    const completionFrame = group.startFrame + group.duration;
    this.addFrameListener(completionFrame, () => {
      this.eventManager.dispatchEvent('animationComplete', {
        triggerId: `group_${group.id}`,
        timestamp: Date.now(),
        groupId: group.id
      });
    });
  }

  /**
   * Apply group animation to a specific element
   */
  private applyGroupAnimationToElement(element: Element, group: AnimationGroup, delayFrames: number): void {
    if (!element) return;

    if (!element.animations) {
      element.animations = [];
    }

    // Create animations for each property
    group.properties.forEach(property => {
      // Find existing animation for this property or create a new one
      let animation = element.animations!.find(a => a.property === property);

      if (!animation) {
        animation = {
          property,
          keyframes: []
        };
        element.animations!.push(animation);
      }

      // Add keyframes for this animation
      const startFrame = group.startFrame + delayFrames;
      const endFrame = startFrame + group.duration;

      // Get the element's current property value
      const currentValue = this.getNestedProperty(element.properties, property) || 0;

      // Create a simple animation that doubles the value (for demonstration)
      // In a real implementation, you'd use property-specific logic or values from the group definition
      animation.keyframes = [
        {
          frame: startFrame,
          value: currentValue,
          easing: group.easing || 'ease-in-out'
        },
        {
          frame: endFrame,
          value: typeof currentValue === 'number' ? currentValue * 2 : currentValue,
          easing: group.easing || 'ease-in-out'
        }
      ];
    });
  }

  /**
   * Find an element by ID across all layers and frames
   */
  private findElementById(id: string): Element | null {
    for (const layer of this.timeline.layers) {
      for (const frame of layer.frames) {
        const element = frame.elements.find(e => e.id === id);
        if (element) return element;
      }
    }
    return null;
  }

  /**
   * Add a listener to be called at a specific frame
   */
  private addFrameListener(frame: number, callback: Function): void {
    this.eventManager.addEventListener(`frame_${frame}`, callback as EventHandler);
  }

  /**************************************
   * Path Animation Methods
   **************************************/

  /**
   * Register a path for animation
   */
  public registerPath(path: Path): void {
    this.pathManager.registerPath(path);
  }

  /**
   * Register a path animation
   */
  public registerPathAnimation(animation: PathAnimation): void {
    this.pathManager.registerPathAnimation(animation);
  }

  /**************************************
   * Event Trigger Methods
   **************************************/

  /**
   * Register a frame trigger
   */
  public addFrameTrigger(frame: number, action: string, parameters: any = {}): void {
    this.eventManager.registerTrigger({
      id: `frame_${frame}_${action}_${Date.now()}`,
      type: EventTriggerType.FRAME_ENTER,
      frame,
      action,
      parameters
    });
  }

  /**
   * Register a frame exit trigger
   */
  public addFrameExitTrigger(frame: number, action: string, parameters: any = {}): void {
    this.eventManager.registerTrigger({
      id: `frameExit_${frame}_${action}_${Date.now()}`,
      type: EventTriggerType.FRAME_EXIT,
      frame,
      action,
      parameters
    });
  }

  /**
   * Register a range trigger
   */
  public addRangeTrigger(startFrame: number, endFrame: number, action: string, parameters: any = {}): void {
    this.eventManager.registerTrigger({
      id: `range_${startFrame}_${endFrame}_${action}_${Date.now()}`,
      type: EventTriggerType.RANGE_ENTER,
      startFrame,
      endFrame,
      action,
      parameters
    });
  }

  /**
   * Register a range exit trigger
   */
  public addRangeExitTrigger(startFrame: number, endFrame: number, action: string, parameters: any = {}): void {
    this.eventManager.registerTrigger({
      id: `rangeExit_${startFrame}_${endFrame}_${action}_${Date.now()}`,
      type: EventTriggerType.RANGE_EXIT,
      startFrame,
      endFrame,
      action,
      parameters
    });
  }

  /**
   * Register an element interaction trigger
   */
  public addInteractionTrigger(
    elementId: string,
    interactionType: EventTriggerType.CLICK | EventTriggerType.HOVER | EventTriggerType.DRAG_START | EventTriggerType.DRAG_END,
    action: string,
    parameters: any = {}
  ): void {
    this.eventManager.registerTrigger({
      id: `interaction_${elementId}_${interactionType}_${action}_${Date.now()}`,
      type: interactionType,
      elementId,
      action,
      parameters
    });
  }

  /**
   * Add a custom event handler
   */
  public addEventListener(event: string, handler: EventHandler): void {
    this.eventManager.addEventListener(event, handler);
  }

  /**
   * Remove a custom event handler
   */
  public removeEventListener(event: string, handler: EventHandler): void {
    this.eventManager.removeEventListener(event, handler);
  }

  /**
   * Process user interaction with an element
   */
  public handleElementInteraction(
    interactionType: EventTriggerType, // Keep this as the general type
    elementId: string,
    eventData: any = {}
  ): void {
    // Add a type guard to ensure we only pass the correct event types
    if (
      interactionType === EventTriggerType.CLICK ||
      interactionType === EventTriggerType.HOVER ||
      interactionType === EventTriggerType.DRAG_START ||
      interactionType === EventTriggerType.DRAG_END
    ) {
      this.eventManager.triggerInteraction(interactionType, elementId, eventData);
    } else {
      console.error(`Invalid interaction type: ${interactionType}`);
    }
  }

  /**
   * Trigger a custom event
   */
  public triggerCustomEvent(eventName: string, eventData: any = {}): void {
    this.eventManager.triggerCustomEvent(eventName, eventData);
  }
}