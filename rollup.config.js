// rollup.config.js
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import babel from "rollup-plugin-babel";
import minify from "rollup-plugin-babel-minify";
import generatePackageJson from "rollup-plugin-generate-package-json";
import builtins from "builtin-modules";
import pkg from "./package.json";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  input: "src/index.ts",
  output: {
    file: "build/release/index.js",
    format: "cjs"
  },
  external: [builtins, ...Object.keys(pkg.dependencies)],
  plugins: [
    resolve({
      extensions,
      preferBuiltins: true
    }),
    commonjs({
      include: "node_modules/**",
      ignoreGlobal: false,
      sourceMap: false,
      namedExports: {}
    }),
    json({
      include: "node_modules/**",
      preferConst: true,
      indent: "  ",
      compact: true,
      namedExports: true
    }),
    babel({
      extensions,
      include: ["src/**/*"],
      exclude: "node_modules/**"
    }),
    minify({
      comments: false,
      sourceMap: false
    }),
    generatePackageJson()
  ]
};
