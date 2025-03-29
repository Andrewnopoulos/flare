
echo "build the WebAssembly module separately"
cd packages/runtime
npm run build:wasm

echo Then build shared types
cd ../shared
npm run build

echo Then build file-format
cd ../file-format
npm run build

echo Finally build the TypeScript part
cd ../runtime
npm run build:ts