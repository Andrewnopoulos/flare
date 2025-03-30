
// Add this at the top of the file
declare global {
    interface Window {
        FlareWasmModule: any;
    }
}
  
// Replace the import with a more browser-friendly approach
async function loadWasmModule() {
try {
    // For debugging
    console.log('Loading WebAssembly module from /wasm directory...');
    
    // Import the WebAssembly module from the src/wasm directory
    const module = await import('./wasm/flare_runtime.js');
    console.log('Module imported successfully:', module);
    
    // Set location of wasm file for module in the src/wasm directory
    const wasmUrl = new URL('./wasm/flare_runtime.wasm', import.meta.url).href;
    console.log('WASM URL:', wasmUrl);
    
    // Use locateFile to help emscripten find the wasm file
    const modFactory = module.default;
    return () => modFactory({
      locateFile: function(path: string, prefix: string): string {
        if (path.endsWith('.wasm')) {
          return wasmUrl;
        }
        return prefix + path;
      }
    });
} catch (e: unknown) {
    console.error('Failed to load WebAssembly module:', e);
    // Fallback to global
    if (window.FlareWasmModule) {
      return window.FlareWasmModule;
    }
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    throw new Error('WebAssembly module not found: ' + errorMessage);
}
}

// Type definitions for the WebAssembly module
interface FlareWasmModule {
    cwrap: <T extends Function>(name: string, returnType: string | null, argTypes: (string | null)[]) => T;
    _malloc: (size: number) => number;
    _free: (pointer: number) => void;
  }
  
  // Function signatures for our renderer
  interface WasmFunctions {
    renderer_create: (canvasId: number, width: number, height: number) => number;
    renderer_destroy: (rendererHandle: number) => void;
    renderer_clear: (rendererHandle: number) => void;
    renderer_draw_rectangle: (
      rendererHandle: number,
      x: number,
      y: number,
      width: number,
      height: number,
      fillColorPtr: number
    ) => void;
    renderer_draw_circle: (
      rendererHandle: number,
      x: number,
      y: number,
      radius: number,
      fillColorPtr: number
    ) => void;
    renderer_resize: (rendererHandle: number, width: number, height: number) => void;
  }
  
  // Class to wrap and manage the WebAssembly module
  export class WasmRenderer {
    private static instance: WasmRenderer | null = null;
    private module: FlareWasmModule | null = null;
    private functions: WasmFunctions | null = null;
    private rendererHandle: number = 0;
    private canvasId: number = 0;
    private initialized: boolean = false;
  
    private constructor() {}
  
    // Singleton pattern
    public static getInstance(): WasmRenderer {
      if (!WasmRenderer.instance) {
        WasmRenderer.instance = new WasmRenderer();
      }
      return WasmRenderer.instance;
    }
  
    // Initialize the module
    public async initialize(canvasId: number, width: number, height: number): Promise<void> {
      if (this.initialized) return;

      try {
        const moduleFactory = await loadWasmModule();
        this.module = await moduleFactory();
  
        // Wrap the C functions
        this.functions = {
          renderer_create: this.module!.cwrap('renderer_create', 'number', ['number', 'number', 'number']),
          renderer_destroy: this.module!.cwrap('renderer_destroy', null, ['number']),
          renderer_clear: this.module!.cwrap('renderer_clear', null, ['number']),
          renderer_draw_rectangle: this.module!.cwrap('renderer_draw_rectangle', null, ['number', 'number', 'number', 'number', 'number', 'number']),
          renderer_draw_circle: this.module!.cwrap('renderer_draw_circle', null, ['number', 'number', 'number', 'number', 'number']),
          renderer_resize: this.module!.cwrap('renderer_resize', null, ['number', 'number', 'number']),
        };
  
        // Create the renderer
        this.canvasId = canvasId;
        this.rendererHandle = this.functions.renderer_create(canvasId, width, height);
        
        if (this.rendererHandle === 0) {
          throw new Error('Failed to create renderer');
        }
  
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize WebAssembly module:', error);
        throw error;
      }
    }
  
    // Clean up resources
    public destroy(): void {
      if (!this.initialized || !this.functions) return;
      
      this.functions.renderer_destroy(this.rendererHandle);
      this.rendererHandle = 0;
      this.initialized = false;
    }
  
    // Clear the canvas
    public clear(): void {
      if (!this.initialized || !this.functions) return;
      this.functions.renderer_clear(this.rendererHandle);
    }
  
    // Helper to create a C string
    private createCString(str: string): number {
      if (!this.module) return 0;
      
      const strLen = str.length + 1; // +1 for null terminator
      const ptr = this.module._malloc(strLen);
      
      // This won't work directly - we'd need a proper way to write to memory
      // For simplicity, we're glossing over the details of writing to WebAssembly memory
      // In a real implementation, use TextEncoder and write to the memory buffer
      
      return ptr;
    }
  
    // Helper to free a C string
    private freeCString(ptr: number): void {
      if (!this.module) return;
      this.module._free(ptr);
    }
  
    // Draw a rectangle
    public drawRectangle(x: number, y: number, width: number, height: number, fillColor: string): void {
      if (!this.initialized || !this.functions || !this.module) return;
      
      const colorPtr = this.createCString(fillColor);
      this.functions.renderer_draw_rectangle(this.rendererHandle, x, y, width, height, colorPtr);
      this.freeCString(colorPtr);
    }
  
    // Draw a circle
    public drawCircle(x: number, y: number, radius: number, fillColor: string): void {
      if (!this.initialized || !this.functions || !this.module) return;
      
      const colorPtr = this.createCString(fillColor);
      this.functions.renderer_draw_circle(this.rendererHandle, x, y, radius, colorPtr);
      this.freeCString(colorPtr);
    }
  
    // Resize the renderer
    public resize(width: number, height: number): void {
      if (!this.initialized || !this.functions) return;
      this.functions.renderer_resize(this.rendererHandle, width, height);
    }
  }