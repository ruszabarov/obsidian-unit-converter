export default {
  input: "src/main.ts",
  output: {
    dir: ".",
    sourcemap: true,
    format: "cjs",
    exports: "default"
  },
  external: ["obsidian"],
  esbuild: {
    target: "es2018",
    platform: "browser",
    format: "cjs",
    bundle: true,
    sourcemap: true
  }
}; 