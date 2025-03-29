#ifndef RENDERER_H
#define RENDERER_H

#ifdef __cplusplus
extern "C" {
#endif

// Opaque pointer to the renderer structure
typedef struct Renderer* RendererHandle;

// Create a new renderer
RendererHandle renderer_create(int canvas_id, int width, int height);

// Destroy a renderer and free resources
void renderer_destroy(RendererHandle renderer);

// Clear the canvas
void renderer_clear(RendererHandle renderer);

// Draw a rectangle
void renderer_draw_rectangle(RendererHandle renderer, 
                            double x, double y, 
                            double width, double height, 
                            const char* fill_color);

// Draw a circle
void renderer_draw_circle(RendererHandle renderer, 
                         double x, double y, 
                         double radius, 
                         const char* fill_color);

// Resize the renderer
void renderer_resize(RendererHandle renderer, double width, double height);

#ifdef __cplusplus
}
#endif

#endif // RENDERER_H