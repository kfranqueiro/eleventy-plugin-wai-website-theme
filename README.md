# Eleventy Plugin for WAI Website Theme

An **experimental** plugin that makes the
[WAI Website Theme repository's](https://github.com/w3c/wai-website-theme)
styles and components usable within an Eleventy project.

## Requirements

- Eleventy 3.x (for ES Module syntax and eventually virtual template support)
- `htmlTemplateEngine: "liquid"` (this is the default)
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
(These should ideally be `devDependencies` in wai-website-theme, not `dependencies`; I've sent a PR.)

### Step 3: Add this plugin

Install this repo:

```sh
npm i git://gist.github.com/8d347eb0afdc4d0c5a8f67e3312713b6.git
```

Add the plugin to your Eleventy config:

```js
import pluginWai from "eleventy-plugin-wai-website-theme-plugin";

// ...

await eleventyConfig.addPlugin(pluginWai);
```

**Note:** Don't forget `await` in front of `eleventyConfig.addPlugin`!
(This means your configuration function should be `async`.)

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
  - There is never a `:` after the opening brace, e.g. `{.class}` (not `{:.class}`)
  - Adding classes inline is done at the end of the line rather than the beginning
  - Adding classes after block elements (e.g. lists) requires an extra blank line between the list and class
  - Adding multiple classes requires a space in between, e.g. `{.one .two}` (not `{.one.two}`)
- The plugin currently writes temporarily to the includes folder,
  because Eleventy does not handle virtual templates under the includes folder
  with regard to template engines (#3501).
  It will avoid clobbering pre-existing files with the same name.
- Known issues:
  - If a build fails, files populated into the includes folder by this plugin will not be cleaned up,
    because Eleventy has no error handling event (#3500)
  - Components that could manage to render markdown in Jekyll (e.g. `box`'s title) may not support it here
  - `doc-note-msg` does not render `doc-note-message-md` correctly;
    [Eleventy claims to support liquid and markdown together in renderTemplate](https://www.11ty.dev/docs/plugins/render/#rendertemplate-paired-shortcode)
    but it seems to render blank. `doc-note-message` (the HTML variation) works fine.
