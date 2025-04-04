#include <stdlib.h>
#include <string.h>
#include <emscripten.h>
#include <emscripten/console.h>
#include "renderer.h"

// HTML5 Canvas API functions we'll call from JavaScript
EM_JS(void, js_get_canvas_context, (int canvas_id, int width, int height), {
    // Cache the canvas and context for this renderer instance
    let canvas = document.getElementById('canvas-' + canvas_id);
    if (!canvas) {
        console.error('Canvas not found: canvas-' + canvas_id);
        return 0;
    }
    
    console.log('WASM found canvas element:', 'canvas-' + canvas_id, canvas);
    
    // Set the canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Store context in a global object indexed by canvas ID
    if (!window.flareCanvasContexts) {
        window.flareCanvasContexts = {};
    }
    
    const ctx = canvas.getContext('2d');
    window.flareCanvasContexts[canvas_id] = ctx;
    
    // Draw a test pattern to verify the context is working
    ctx.fillStyle = 'purple';
    ctx.fillRect(10, 10, 50, 50);
    console.log('WASM drew test pattern on canvas');
    
    return 1;
});

EM_JS(void, js_clear_canvas, (int canvas_id, int width, int height), {
    const ctx = window.flareCanvasContexts[canvas_id];
    if (ctx) {
        ctx.clearRect(0, 0, width, height);
    }
});

EM_JS(void, js_draw_rectangle, (int canvas_id, double x, double y, double width, double height, const char* fill_color), {
    const ctx = window.flareCanvasContexts[canvas_id];
    if (ctx) {
        ctx.fillStyle = UTF8ToString(fill_color);
        ctx.fillRect(x, y, width, height);
    }
});

EM_JS(void, js_draw_circle, (int canvas_id, double x, double y, double radius, const char* fill_color), {
    const ctx = window.flareCanvasContexts[canvas_id];
    if (ctx) {
        ctx.fillStyle = UTF8ToString(fill_color);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
});

// Renderer structure
struct Renderer {
    int canvas_id;
    double width;
    double height;
};

// Implementation of the renderer functions
RendererHandle renderer_create(int canvas_id, int width, int height) {
    struct Renderer* renderer = (struct Renderer*)malloc(sizeof(struct Renderer));
    if (!renderer) return NULL;
    
    renderer->canvas_id = canvas_id;
    renderer->width = width;
    renderer->height = height;
    
    // Initialize the canvas
    js_get_canvas_context(canvas_id, width, height);
    
    return renderer;
}

void renderer_destroy(RendererHandle renderer) {
    if (renderer) {
        free(renderer);
    }
}

void renderer_clear(RendererHandle renderer) {
    if (!renderer) return;
    js_clear_canvas(renderer->canvas_id, renderer->width, renderer->height);
}

void renderer_draw_rectangle(RendererHandle renderer, 
                            double x, double y, 
                            double width, double height, 
                            const char* fill_color) {
    if (!renderer) return;
    js_draw_rectangle(renderer->canvas_id, x, y, width, height, fill_color);
}

EMSCRIPTEN_KEEPALIVE void renderer_draw_circle(RendererHandle renderer, 
                         double x, double y, 
                         double radius, 
                         const char* fill_color) {
    if (!renderer) return;
    js_draw_circle(renderer->canvas_id, x, y, radius, fill_color);
}

// JavaScript function to resize the canvas
EM_JS(void, js_resize_canvas, (int canvas_id, double width, double height), {
    const canvas = document.getElementById('canvas-' + canvas_id);
    if (!canvas) {
        console.error('Canvas not found for resize: canvas-' + canvas_id);
        return;
    }
    
    console.log('WASM resizing canvas to:', width, 'x', height);
    
    // Update canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Update canvas style dimensions to match
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
});

void renderer_resize(RendererHandle renderer, double width, double height) {
    if (!renderer) return;
    
    // Update the renderer's internal dimensions
    renderer->width = width;
    renderer->height = height;
    
    // Resize the actual canvas element
    js_resize_canvas(renderer->canvas_id, width, height);
}