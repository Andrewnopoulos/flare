import { ElementType, Timeline } from '@flare/shared';
import { FlareParser } from '@flare/file-format';
import { FlareRenderer } from './renderer';
import { AnimationEngine } from './animation/animation-engine';

export interface FlarePlayerOptions {
  container: HTMLElement | string;
  source: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export class FlarePlayer {
  private options: FlarePlayerOptions;
  private renderer: FlareRenderer | null = null;
  private animationEngine: AnimationEngine | null = null;
  private timeline: Timeline | null = null;
  private container: HTMLElement;
  private width: number;
  private height: number;
  private isReady: boolean = false;

  constructor(options: FlarePlayerOptions) {
    this.options = {
      autoplay: true,
      width: 400,
      height: 300,
      ...options
    };

    // Get the container element
    const container = typeof options.container === 'string' 
      ? document.querySelector(options.container) as HTMLElement
      : options.container;

    if (!container) {
      throw new Error(`Container element not found: ${options.container}`);
    }

    this.container = container;

    // Calculate dimensions
    this.width = this.parseSize(this.options.width, container.clientWidth);
    this.height = this.parseSize(this.options.height, container.clientHeight);

    // Initialize
    this.initialize();
  }

  /**
   * Parse a size value (number, string percentage, or auto)
   */
  private parseSize(size: number | string | undefined, containerSize: number): number {
    if (typeof size === 'number') {
      return size;
    }
    
    if (typeof size === 'string' && size.endsWith('%')) {
      const percentage = parseFloat(size) / 100;
      return Math.floor(containerSize * percentage);
    }
    
    return containerSize;
  }

  /**
   * Initialize the player
   */
  private async initialize(): Promise<void> {
    try {
      // Create renderer
      this.renderer = new FlareRenderer(this.container, this.width, this.height);
      await this.renderer.initialize();
      
      // Test the renderer directly to make sure it's working
      console.log('Testing renderer directly...');
      this.renderer.render([{
        id: 'test-rect',
        type: ElementType.RECTANGLE,
        properties: {
          x: 20,
          y: 20,
          width: 100,
          height: 50,
          fill: '#ff00ff'
        }
      }]);
      
      // Load source
      await this.loadSource(this.options.source);
      
      // Create animation engine
      if (this.timeline) {
        this.animationEngine = new AnimationEngine(this.timeline);
        
        // Set up animation frame loop
        this.startRenderLoop();
        
        // Autoplay if enabled
        if (this.options.autoplay) {
          this.play();
        }
      }

      // Mark as ready
      this.isReady = true;
      
      // Call onReady callback
      if (this.options.onReady) {
        this.options.onReady();
      }
    } catch (error) {
      console.error('Failed to initialize Flare player:', error);
      
      // Call onError callback
      if (this.options.onError && error instanceof Error) {
        this.options.onError(error);
      }
    }
  }

  /**
   * Load a Flare source file
   */
  private async loadSource(source: string): Promise<void> {
    try {
      console.log('Loading source:', source);
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to load source: ${response.statusText}`);
      }
      
      // For now, we're expecting JSON directly
      // In a full implementation, we'd handle binary .flare files
      const json = await response.json();
      console.log('Loaded JSON data:', json);
      
      // Parse the timeline
      this.timeline = FlareParser.parseJSON(JSON.stringify(json));
      console.log('Parsed timeline:', this.timeline);
      
      // Debug check - inspect the timeline properties
      if (this.timeline) {
        console.log('Timeline details:',
          'frameRate:', this.timeline.frameRate,
          'duration:', this.timeline.duration,
          'layers:', this.timeline.layers.length
        );
        
        // Check first frame of first layer
        if (this.timeline.layers.length > 0 && 
            this.timeline.layers[0].frames.length > 0 &&
            this.timeline.layers[0].frames[0].elements.length > 0) {
          console.log('First element:', this.timeline.layers[0].frames[0].elements[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load source:', error);
      throw error;
    }
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    const renderFrame = () => {
      if (!this.renderer || !this.animationEngine) return;
      
      // Get current elements from the animation engine
      const elements = this.animationEngine.getCurrentElements();
      
      // Render them
      this.renderer.render(elements);
      
      // Request next frame
      requestAnimationFrame(renderFrame);
    };
    
    requestAnimationFrame(renderFrame);
  }

  /**
   * Play the animation
   */
  public play(): void {
    if (this.animationEngine) {
      this.animationEngine.play();
    }
  }

  /**
   * Pause the animation
   */
  public pause(): void {
    if (this.animationEngine) {
      this.animationEngine.pause();
    }
  }

  /**
   * Stop the animation
   */
  public stop(): void {
    if (this.animationEngine) {
      this.animationEngine.stop();
    }
  }

  /**
   * Seek to a specific frame
   */
  public seekToFrame(frame: number): void {
    if (this.animationEngine) {
      this.animationEngine.seekToFrame(frame);
    }
  }

  /**
   * Resize the player
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    if (this.renderer) {
      this.renderer.resize(width, height);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.animationEngine) {
      this.animationEngine.stop();
    }
    
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
  }
}