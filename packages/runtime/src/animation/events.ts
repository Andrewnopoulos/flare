// Frame Event Triggers
import { Timeline } from '@flare/shared';

/**
 * Event trigger types
 */
export enum EventTriggerType {
    // Timeline events
    FRAME_ENTER = 'frameEnter',     // Triggered when entering a specific frame
    FRAME_EXIT = 'frameExit',       // Triggered when exiting a specific frame
    RANGE_ENTER = 'rangeEnter',     // Triggered when entering a frame range
    RANGE_EXIT = 'rangeExit',       // Triggered when exiting a frame range

    // Playback events
    PLAY = 'play',                  // Triggered when animation starts playing
    PAUSE = 'pause',                // Triggered when animation pauses
    STOP = 'stop',                  // Triggered when animation stops
    LOOP = 'loop',                  // Triggered when animation loops

    // Interaction events
    CLICK = 'click',                // Triggered when element is clicked
    HOVER = 'hover',                // Triggered when element is hovered
    DRAG_START = 'dragStart',       // Triggered when dragging starts
    DRAG_END = 'dragEnd',           // Triggered when dragging ends

    // Custom event
    CUSTOM = 'custom'               // User-defined event
}

/**
 * Base event trigger interface
 */
export interface EventTrigger {
    id: string;
    type: EventTriggerType;
    action: string;               // Action to execute (function name or code snippet)
    parameters?: any;             // Additional parameters for the action
}

/**
 * Frame-specific event trigger
 */
export interface FrameEventTrigger extends EventTrigger {
    type: EventTriggerType.FRAME_ENTER | EventTriggerType.FRAME_EXIT;
    frame: number;                // The specific frame to trigger on
}

/**
 * Frame range event trigger
 */
export interface RangeEventTrigger extends EventTrigger {
    type: EventTriggerType.RANGE_ENTER | EventTriggerType.RANGE_EXIT;
    startFrame: number;           // Start of frame range
    endFrame: number;             // End of frame range
}

/**
 * Playback event trigger
 */
export interface PlaybackEventTrigger extends EventTrigger {
    type: EventTriggerType.PLAY | EventTriggerType.PAUSE | EventTriggerType.STOP | EventTriggerType.LOOP;
}

/**
 * Interaction event trigger
 */
export interface InteractionEventTrigger extends EventTrigger {
    type: EventTriggerType.CLICK | EventTriggerType.HOVER | EventTriggerType.DRAG_START | EventTriggerType.DRAG_END;
    elementId: string;            // Element to attach interaction to
}

/**
 * Custom event trigger
 */
export interface CustomEventTrigger extends EventTrigger {
    type: EventTriggerType.CUSTOM;
    eventName: string;            // Name of custom event
}

/**
 * Union type for all event triggers
 */
export type AnyEventTrigger =
    | FrameEventTrigger
    | RangeEventTrigger
    | PlaybackEventTrigger
    | InteractionEventTrigger
    | CustomEventTrigger;

/**
 * Event data interface
 */
export interface EventData {
    triggerId: string;
    timestamp: number;
    currentFrame?: number;
    [key: string]: any;           // Additional event-specific data
}

/**
 * Event handler type
 */
export type EventHandler = (data: EventData) => void;

/**
 * Event trigger manager
 */
export class EventTriggerManager {
    private triggers: AnyEventTrigger[] = [];
    private handlers: Map<string, EventHandler[]> = new Map();
    private activeRangeTriggers: Set<string> = new Set();
    private currentFrame: number = 0;
    private previousFrame: number = 0;

    /**
     * Register an event trigger
     */
    public registerTrigger(trigger: AnyEventTrigger): void {
        this.triggers.push(trigger);
    }

    /**
     * Register multiple event triggers
     */
    public registerTriggers(triggers: AnyEventTrigger[]): void {
        this.triggers.push(...triggers);
    }

    /**
     * Add an event handler
     */
    public addEventListener(event: string, handler: EventHandler): void {
        if (!this.handlers.has(event)) {
          this.handlers.set(event, []);
        }
        const handlers = this.handlers.get(event);
        if (handlers) {
          handlers.push(handler);
        }
      }

    /**
     * Remove an event handler
     */
    public removeEventListener(event: string, handler: EventHandler): void {
        if (!this.handlers.has(event)) return;
        
        const handlers = this.handlers.get(event);
        if (!handlers) return;
        
        const index = handlers.indexOf(handler);
        
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }

    /**
     * Fire an event
     */
    public dispatchEvent(event: string, data: EventData): void {
        if (!this.handlers.has(event)) return;
        
        const handlers = this.handlers.get(event);
        if (!handlers) return;
        
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for ${event}:`, error);
          }
        });
    }

    /**
     * Update frame position and check for triggers
     */
    public updateFrame(currentFrame: number): void {
        this.previousFrame = this.currentFrame;
        this.currentFrame = currentFrame;

        this.checkFrameTriggers();
        this.checkRangeTriggers();
    }

    /**
     * Manually trigger an interaction event
     */
    public triggerInteraction(
        type: EventTriggerType.CLICK | EventTriggerType.HOVER | EventTriggerType.DRAG_START | EventTriggerType.DRAG_END,
        elementId: string,
        eventData: any = {}
    ): void {
        // Find matching interaction triggers
        const matchingTriggers = this.triggers.filter(trigger =>
            trigger.type === type &&
            'elementId' in trigger &&
            trigger.elementId === elementId
        ) as InteractionEventTrigger[];

        // Fire each matching trigger
        matchingTriggers.forEach(trigger => {
            this.executeTriggerAction(trigger, {
                triggerId: trigger.id,
                timestamp: Date.now(),
                currentFrame: this.currentFrame,
                elementId,
                ...eventData
            });
        });
    }

    /**
     * Trigger a custom event
     */
    public triggerCustomEvent(eventName: string, eventData: any = {}): void {
        // Find matching custom triggers
        const matchingTriggers = this.triggers.filter(trigger =>
            trigger.type === EventTriggerType.CUSTOM &&
            'eventName' in trigger &&
            trigger.eventName === eventName
        ) as CustomEventTrigger[];

        // Fire each matching trigger
        matchingTriggers.forEach(trigger => {
            this.executeTriggerAction(trigger, {
                triggerId: trigger.id,
                timestamp: Date.now(),
                currentFrame: this.currentFrame,
                eventName,
                ...eventData
            });
        });
    }

    /**
     * Trigger a playback event
     */
    public triggerPlaybackEvent(type: EventTriggerType.PLAY | EventTriggerType.PAUSE | EventTriggerType.STOP | EventTriggerType.LOOP): void {
        // Find matching playback triggers
        const matchingTriggers = this.triggers.filter(trigger =>
            trigger.type === type
        ) as PlaybackEventTrigger[];

        // Fire each matching trigger
        matchingTriggers.forEach(trigger => {
            this.executeTriggerAction(trigger, {
                triggerId: trigger.id,
                timestamp: Date.now(),
                currentFrame: this.currentFrame,
                playbackType: type
            });
        });
    }


    private checkFrameEvents(): void {
        const eventName = `frame_${this.currentFrame}`;
        if (this.handlers.has(eventName)) {
            const listeners = this.handlers.get(eventName);
            if (listeners) {
                listeners.forEach(callback => callback({
                    triggerId: `frame_${this.currentFrame}`,
                    timestamp: Date.now()
                }));
                
                // Clear one-time frame listeners
                this.handlers.set(eventName, []);
            }
        }
    }

    /**
     * Check for frame-specific triggers
     */
    private checkFrameTriggers(): void {
        // Skip if frame hasn't changed
        if (this.currentFrame === this.previousFrame) return;

        // Get all frame triggers
        const frameTriggers = this.triggers.filter(trigger =>
            trigger.type === EventTriggerType.FRAME_ENTER ||
            trigger.type === EventTriggerType.FRAME_EXIT
        ) as FrameEventTrigger[];

        // Check each trigger
        frameTriggers.forEach(trigger => {
            if (trigger.type === EventTriggerType.FRAME_ENTER) {
                // Check if we've entered this frame
                if (this.currentFrame === trigger.frame && this.previousFrame !== trigger.frame) {
                    this.executeTriggerAction(trigger, {
                        triggerId: trigger.id,
                        timestamp: Date.now(),
                        currentFrame: this.currentFrame,
                        previousFrame: this.previousFrame
                    });
                }
            } else if (trigger.type === EventTriggerType.FRAME_EXIT) {
                // Check if we've exited this frame
                if (this.previousFrame === trigger.frame && this.currentFrame !== trigger.frame) {
                    this.executeTriggerAction(trigger, {
                        triggerId: trigger.id,
                        timestamp: Date.now(),
                        currentFrame: this.currentFrame,
                        previousFrame: this.previousFrame
                    });
                }
            }
        });
    }

    /**
     * Check for frame range triggers
     */
    private checkRangeTriggers(): void {
        // Skip if frame hasn't changed
        if (this.currentFrame === this.previousFrame) return;

        // Get all range triggers
        const rangeTriggers = this.triggers.filter(trigger =>
            trigger.type === EventTriggerType.RANGE_ENTER ||
            trigger.type === EventTriggerType.RANGE_EXIT
        ) as RangeEventTrigger[];

        // Process ENTER triggers first
        rangeTriggers.forEach(trigger => {
            if (trigger.type === EventTriggerType.RANGE_ENTER) {
                const inRange = this.currentFrame >= trigger.startFrame && this.currentFrame <= trigger.endFrame;
                const wasInRange = this.previousFrame >= trigger.startFrame && this.previousFrame <= trigger.endFrame;
                
                // Check if we've entered the range
                if (inRange && !wasInRange) {
                    this.activeRangeTriggers.add(trigger.id);
                    this.executeTriggerAction(trigger, {
                        triggerId: trigger.id,
                        timestamp: Date.now(),
                        currentFrame: this.currentFrame,
                        previousFrame: this.previousFrame,
                        startFrame: trigger.startFrame,
                        endFrame: trigger.endFrame
                    });
                }
                // Check if we've exited the range without an explicit exit trigger
                else if (!inRange && wasInRange) {
                    this.activeRangeTriggers.delete(trigger.id);
                }
            }
        });
        
        // Process EXIT triggers
        rangeTriggers.forEach(trigger => {
            if (trigger.type === EventTriggerType.RANGE_EXIT) {
                const inRange = this.currentFrame >= trigger.startFrame && this.currentFrame <= trigger.endFrame;
                const wasInRange = this.previousFrame >= trigger.startFrame && this.previousFrame <= trigger.endFrame;
                
                // Check if we've exited the range
                if (!inRange && wasInRange) {
                    this.activeRangeTriggers.delete(trigger.id);
                    this.executeTriggerAction(trigger, {
                        triggerId: trigger.id,
                        timestamp: Date.now(),
                        currentFrame: this.currentFrame,
                        previousFrame: this.previousFrame,
                        startFrame: trigger.startFrame,
                        endFrame: trigger.endFrame
                    });
                }
            }
        });
    }

    /**
     * Execute a trigger's action
     */
    private executeTriggerAction(trigger: AnyEventTrigger, data: EventData): void {
        // Dispatch the event
        this.dispatchEvent(trigger.action, {
            ...data,
            parameters: trigger.parameters
        });
    }

    /**
     * Check if we're currently in a specific range
     */
    public isInRange(startFrame: number, endFrame: number): boolean {
        return this.currentFrame >= startFrame && this.currentFrame <= endFrame;
    }

    /**
     * Get all currently active range triggers
     */
    public getActiveRangeTriggers(): string[] {
        return Array.from(this.activeRangeTriggers);
    }

    /**
     * Clear all triggers
     */
    public clearTriggers(): void {
        this.triggers = [];
        this.activeRangeTriggers.clear();
    }
}

/**
 * Enhanced AnimationEngine integration with EventTriggerManager
 */
export class EventEnhancedAnimationEngine {
    private timeline: Timeline;
    private eventManager: EventTriggerManager;

    constructor(timeline: Timeline) {
        this.timeline = timeline;
        this.eventManager = new EventTriggerManager();

        // Set up default event actions
        this.setupDefaultActions();
    }

    /**
     * Set up default event actions
     */
    private setupDefaultActions(): void {
        // Example default actions
        this.eventManager.addEventListener('gotoFrame', (data) => {
            if (data.parameters && typeof data.parameters.frame === 'number') {
                this.seekToFrame(data.parameters.frame);
            }
        });

        this.eventManager.addEventListener('playTimeline', (data) => {
            this.play();
        });

        this.eventManager.addEventListener('pauseTimeline', (data) => {
            this.pause();
        });

        this.eventManager.addEventListener('stopTimeline', (data) => {
            this.stop();
        });

        this.eventManager.addEventListener('togglePlay', (data) => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });

        // Add more default actions as needed
    }

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
     * Add markers to the timeline
     * Markers are named positions on the timeline that can be used for navigation
     */
    public addMarker(name: string, frame: number): void {
        // This could be extended to store markers in a more sophisticated way
        this.addEventListener(`gotoMarker_${name}`, (data) => {
            this.seekToFrame(frame);
        });
    }

    /**
     * Go to a named marker
     */
    public gotoMarker(name: string): void {
        this.eventManager.dispatchEvent(`gotoMarker_${name}`, {
            triggerId: `manual_gotoMarker_${name}`,
            timestamp: Date.now(),
            currentFrame: this.getCurrentFrame()
        });
    }

    /**
     * Get the current frame
     */
    public getCurrentFrame(): number {
        return 0; // This should return the actual current frame from your animation engine
    }

    /**
     * Methods that would be implemented in the full animation engine
     * These are just stubs for the example
     */
    public play(): void {
        // Implementation would go here
        this.eventManager.triggerPlaybackEvent(EventTriggerType.PLAY);
    }

    public pause(): void {
        // Implementation would go here
        this.eventManager.triggerPlaybackEvent(EventTriggerType.PAUSE);
    }

    public stop(): void {
        // Implementation would go here
        this.eventManager.triggerPlaybackEvent(EventTriggerType.STOP);
    }

    public seekToFrame(frame: number): void {
        // Implementation would go here
        this.eventManager.updateFrame(frame);
    }

    get isPlaying(): boolean {
        return false; // This should return the actual play state
    }

    /**
     * Process user interaction with an element
     */
    public handleElementInteraction(
        interactionType: EventTriggerType.CLICK | EventTriggerType.HOVER | EventTriggerType.DRAG_START | EventTriggerType.DRAG_END,
        elementId: string, 
        eventData: any = {}
    ): void {
        this.eventManager.triggerInteraction(interactionType, elementId, eventData);
    }
}