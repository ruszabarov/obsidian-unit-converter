export default {
  input: "src/main.ts",
  output: {
    dir: ".",
    sourcemap: true,
    format: "cjs",
    exports: "default",
    banner: 'if (typeof window !== "undefined" && typeof window.global === "undefined") { window.global = window; }'
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