import { Element, ElementType } from '@flare/shared';
import { WasmRenderer } from './wasm-bindings';

export class FlareRenderer {
  private canvas: HTMLCanvasElement;
  private wasmRenderer: WasmRenderer;
  private canvasId: number;
  private static canvasCounter: number = 0;

  constructor(container: HTMLElement | string, width: number, height: number) {
    // Get or create container element
    const containerElement = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container;

    if (!containerElement) {
      throw new Error(`Container element not found: ${container}`);
    }

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvasId = ++FlareRenderer.canvasCounter;
    this.canvas.id = `canvas-${this.canvasId}`;
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Make sure canvas is visible with explicit styling
    this.canvas.style.display = 'block';
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.border = '1px solid #ccc';
    this.canvas.style.backgroundColor = '#e0e0e0'; // Light gray background
    
    // Add canvas to container
    containerElement.appendChild(this.canvas);

    // Initialize WebAssembly renderer
    this.wasmRenderer = WasmRenderer.getInstance();
  }

  /**
   * Initialize the renderer
   */
  public async initialize(): Promise<void> {
    await this.wasmRenderer.initialize(
      this.canvasId,
      this.canvas.width,
      this.canvas.height
    );
  }

  /**
   * Render a list of elements
   */
  public render(elements: Element[]): void {
    // Clear the canvas using WebAssembly
    this.wasmRenderer.clear();

    // Debug: check if we have elements to render
    console.log('Rendering elements with WebAssembly:', elements.length);
    
    // Debug: draw a test rectangle if no elements to render
    if (elements.length === 0) {
      console.log('No elements to render, drawing test rectangle with WebAssembly');
      this.wasmRenderer.drawRectangle(50, 50, 200, 100, '#ff0000');
    }

    // Render each element
    for (const element of elements) {
      console.log('Rendering element:', element.type, element.properties);
      this.renderElement(element);
    }
  }

  /**
   * Render a single element
   */
  private renderElement(element: Element): void {
    const props = element.properties;
    
    console.log('Rendering element with WebAssembly:', element.type);
    
    switch (element.type) {
      case ElementType.RECTANGLE:
        // Draw using WebAssembly
        this.wasmRenderer.drawRectangle(
          props.x || 0,
          props.y || 0,
          props.width || 0,
          props.height || 0,
          props.fill || '#000000'
        );
        break;

      case ElementType.CIRCLE:
        // Draw using WebAssembly
        this.wasmRenderer.drawCircle(
          props.x || 0,
          props.y || 0,
          props.radius || 0,
          props.fill || '#000000'
        );
        break;

      // Additional element types would be implemented here
      
      default:
        console.warn(`Unsupported element type: ${element.type}`);
    }

    // Render children if any
    if (element.children && element.children.length > 0) {
      for (const child of element.children) {
        this.renderElement(child);
      }
    }
  }

  /**
   * Resize the renderer
   */
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.wasmRenderer.resize(width, height);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.wasmRenderer.destroy();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}