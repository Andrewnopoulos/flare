cmake_minimum_required(VERSION 3.13)
project(flare_runtime)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Emscripten-specific flags
set(CMAKE_EXECUTABLE_SUFFIX ".js")

# Include directories
include_directories(include)

# Export C functions to JavaScript
# Add this flag to make it browser-compatible
set(EMSCRIPTEN_LINK_FLAGS 
    "-s WASM=1 \
     -s EXPORTED_RUNTIME_METHODS=['cwrap','ccall'] \
     -s EXPORTED_FUNCTIONS=['_malloc','_free','_renderer_create','_renderer_destroy','_renderer_clear','_renderer_draw_rectangle','_renderer_draw_circle','_renderer_resize'] \
     -s ALLOW_MEMORY_GROWTH=1 \
     -s MODULARIZE=1 \
     -s EXPORT_NAME='FlareWasmModule' \
     -s ENVIRONMENT='web' \
     -s FILESYSTEM=0 \
     --no-entry")

set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${EMSCRIPTEN_LINK_FLAGS}")

# Add library target
add_executable(flare_runtime 
    src/renderer.c
)

# Copy wasm and js files to a specific location
add_custom_command(TARGET flare_runtime POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    ${CMAKE_BINARY_DIR}/flare_runtime.wasm
    ${CMAKE_BINARY_DIR}/flare_runtime.js
    ${CMAKE_SOURCE_DIR}/../src/wasm/
)