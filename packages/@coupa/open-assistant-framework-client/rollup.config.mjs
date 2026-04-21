import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { externals } from "rollup-plugin-node-externals";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

/** @type {import('rollup').RollupOptions} */
export default {
  input: "./src/index.ts",
  plugins: [
    externals({ deps: true, packagePath: "./package.json" }),
    nodeResolve({ extensions }),
    commonjs(),
    babel({
      extensions,
      exclude: "node_modules/**",
      babelHelpers: "bundled",
      presets: ["@babel/preset-typescript"],
    }),
  ],
  output: [
    // single-file bundles that match the paths declared in package.json
    {
      format: "cjs",
      file: "dist/index.cjs.js",
      sourcemap: true,
    },
    {
      format: "esm",
      file: "dist/index.esm.js",
      sourcemap: true,
    },
  ],
};
