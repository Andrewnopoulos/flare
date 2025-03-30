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
    
    // Set the canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Store context in a global object indexed by canvas ID
    if (!window.flareCanvasContexts) {
        window.flareCanvasContexts = {};
    }
    window.flareCanvasContexts[canvas_id] = canvas.getContext('2d');
    
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

void renderer_resize(RendererHandle renderer, double width, double height) {
    if (!renderer) return;
    renderer->width = width;
    renderer->height = height;
    // Note: We'd typically resize the canvas here as well
}