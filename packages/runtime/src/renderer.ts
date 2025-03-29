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
    this.canvas.style.display = 'block';
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
    // Clear the canvas first
    this.wasmRenderer.clear();

    // Render each element
    for (const element of elements) {
      this.renderElement(element);
    }
  }

  /**
   * Render a single element
   */
  private renderElement(element: Element): void {
    const props = element.properties;

    switch (element.type) {
      case ElementType.RECTANGLE:
        this.wasmRenderer.drawRectangle(
          props.x || 0,
          props.y || 0,
          props.width || 0,
          props.height || 0,
          props.fill || '#000000'
        );
        break;

      case ElementType.CIRCLE:
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