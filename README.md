# Eleventy Plugin for WAI Website Theme

An **experimental** plugin that makes the
[WAI Website Theme repository's](https://github.com/w3c/wai-website-theme)
styles and components usable within an Eleventy project.

## Requirements

- Node.js v20 (for `import.meta.dirname` in ES Modules)
- Eleventy 3.x (for ES Module syntax, async configuration function,
  and eventually virtual template support)
- `htmlTemplateEngine: "liquid"` (this is the default setting)
- This plugin forcibly sets Liquid options to `{ jekyllInclude: true }`
  (for wai-website-theme components' `include` directives to work)

## Installation

### Step 1: Install Eleventy

Install Eleventy in your project if you haven't already:

```sh
npm i @11ty/eleventy
```

### Step 2 (Optional): Avoid Dependency Bloat

Add the following to your project's `package.json`,
to avoid dependencies listed under `wai-website-theme` that you don't need:

```
  "overrides": {
    "wai-website-theme": {
      "gulp-pixrem": "npm:dry-uninstall",
      "postcss": "npm:dry-uninstall",
      "postcss-easy-import": "npm:dry-uninstall",
      "postcss-import": "npm:dry-uninstall"
    }
  }
```

(The above assumes you are using `npm`.
[Removing dependencies is also possible for pnpm 9.12.0 and later.](https://pnpm.io/package_json#pnpmoverrides))

These dependencies are not needed because wai-website-theme also includes pre-built styles
within the repository.
(These should ideally be `devDependencies` in wai-website-theme, not `dependencies`;
I've sent a PR to update this.)

### Step 3: Add this plugin

Install this repo:

```sh
npm i git://github.com/kfranqueiro/eleventy-plugin-wai-website-theme.git
```

Add the plugin to your Eleventy config:

```js
import pluginWai from "eleventy-plugin-wai-website-theme-plugin";

export default async function (eleventyConfig) {
  // ...
  await eleventyConfig.addPlugin(pluginWai);
  // ...
}
```

**Note:** Don't forget `await` in front of `eleventyConfig.addPlugin`
(and `async` in front of the configuration function).

### Step 4: Reference wai-website-theme Styles

Reference `wai-website-theme`'s CSS somewhere within your project:

```html
<link rel="stylesheet" href="/assets/css/style.css">
```

(Adjust path accordingly if you have customized `assetsOutputDir`.)

## Caveats

- The plugin always outputs resources to `assets/` under the output folder,
because some components (e.g. icon and minimal-header) assume that location.
- Some components are not included: (see `excludes` in `index.js` for full list)
  - Those not listed in the wai-website-theme site sidebar
  - Those heavily reliant on Jekyll-specific constructs (i.e. footer)
- Layouts in the wai-website-theme repo are beyond this project's scope
- A few [`markdown-it` plugins](https://mdit-plugins.github.io/) are included
  to accomplish behavior documented in component examples, but there will be some differences, e.g.:
  - There is never a `:` after the opening brace for classes or attributes,
    e.g. `{.class}` (not `{:.class}`)
  - Adding classes inline is done at the end of the line rather than the beginning
  - Adding classes after block elements (e.g. lists) requires an extra blank line between the two
  - Adding multiple classes requires a space in between, e.g. `{.one .two}` (not `{.one.two}`)
- The plugin currently writes temporarily to the includes folder,
  because Eleventy does not handle virtual templates under the includes folder
  with regard to template engines (#3501).
  It will avoid clobbering pre-existing files with the same name.
- Known issues:
  - If a build fails, files populated into the includes folder by this plugin will not be cleaned up,
    because Eleventy has no error handling event (#3500). `git clean` can help resolve this situation.
  - Components that could manage to render markdown in Jekyll (e.g. `box`'s title) may not support it here
