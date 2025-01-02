# Advanced usage

This guide highlights advanced usage of giscus through additional
configurations.

- [`giscus.json`](#giscusjson)
  - [`origins`](#origins)
  - [`originsRegex`](#originsregex)
  - [`defaultCommentOrder`](#defaultcommentorder)
- [`data-` attributes](#data--attributes)
  - [`data-strict`](#data-strict)
  - [`data-theme`](#data-theme)
- [`<meta>` tags](#meta-tags)
  - [`giscus:backlink`](#giscusbacklink)
- [giscus-to-parent `message` events](#giscus-to-parent-message-events)
  - [`IErrorMessage`](#ierrormessage)
  - [`IMetadataMessage`](#imetadatamessage)
- [parent-to-giscus `message` events](#parent-to-giscus-message-events)
  - [`ISetConfigMessage`](#isetconfigmessage)

## `giscus.json`

Additional configurations can be made by creating a `giscus.json` file at
the root of your repository. You can see an example
[on this repository][giscus.json]. The `giscus.json` file supports the
following keys:

- [`origins`](#origins)
- [`originsRegex`](#originsregex)
- [`defaultCommentOrder`](#defaultcommentorder)

### `origins`

You can restrict the domains that can load giscus with your repository's
discussions using the `origins` key. The `origins` key accepts a list of
strings that will be checked against the `window.origin` of the page that loads
giscus. The strings are compared using the following code.

```js
string === window.origin
```

You can combine `origins` with [`originsRegex`](#originsregex). If none of the
strings in `origins` and `originsRegex` match `window.origin`, then giscus will
refuse to load. If `origins` and `originsRegex` are both empty lists (or
undefined), giscus will proceed to load the discussion.

Example `giscus.json`:

```json
{
  "origins": ["https://giscus.app"]
}
```

### `originsRegex`

Like [`origins`](#origins), but it accepts a list of regular expression
patterns to test the origin. The test is done using the following code.

```js
new RegExp(pattern).test(window.origin)
```

Example `giscus.json`:

```json
{
  "origins": ["https://giscus.app"],
  "originsRegex": ["http://localhost:[0-9]+"]
}
```

### `defaultCommentOrder`

You can set the default comment order, i.e. `"oldest"` (oldest to newest) or
`"newest"` (newest to oldest). This option defaults to `"oldest"`.

Example `giscus.json`:

```json
{
  "defaultCommentOrder": "newest"
}
```

## `data-` attributes

Some of the `data-` attributes of the `<script>` tag may be used to further
customize giscus.

### `data-strict`

When searching for discussions, GitHub uses a fuzzy search method. This may
cause giscus to return a mismatched discussion when there are multiple
discussions with similar titles. To avoid this issue, you can turn on strict
title matching by setting `data-strict="1"` on the `<script>` tag.

If this option is enabled, instead of using the discussion title as the search
term, giscus will compute the hash of the discussion title and search for the
hash in the discussion body. The hash is calculated using the SHA-1 algorithm.

If you want to enable this option, make sure all discussions you want to use
with giscus contains the SHA-1 hash of the discussion title in the discussion
body. If you already have existing discussions before this option was
introduced, you can migrate them by editing the discussion and adding the hash
anywhere in the discussion body. You can use any SHA-1 calculator to find the
hash, such as [this one][sha1-calculator].

All new discussions created by giscus **after** this option was introduced
include the hash by default. For example, with the following discussion title:

```
Welcome to giscus!
```

giscus automatically appends the hash to the discussion body with the following
format when initially creating the discussion:

```html
<!-- sha1: cad60a29d1b50cbeb42ec2ff630fc508afb1d2e3 -->
```

Since it's written as an HTML comment, the SHA-1 is not shown when you're
viewing the discussion on GitHub. It is not necessary to use the same format. As
long as the SHA-1 hash is somewhere in the discussion body, giscus can find it.

### `data-theme`

Instead of the built-in themes, you can supply a URL to a CSS file as the value
for the `data-theme` attribute. The URL will be used by giscus to construct a
`<link rel="stylesheet">` element as the last child of the `<head>` element.

For example, given the following `<script>` tag:

```html
<script src="https://giscus.app/client.js"
        data-repo="giscus/giscus"
        ...
        data-theme="https://giscus.app/themes/custom_example.css"
        ...>
</script>
```

then giscus will add the following element:


```html
<link id="giscus-theme" rel="stylesheet" crossorigin="anonymous" href="https://giscus.app/themes/custom_example.css">
```

Please note that loading an external CSS file **may be unsafe**. Make sure that
you trust the author and provider of the CSS file. We are not responsible if
the CSS file that you use opens a security vulnerability to giscus users on
your website. Make sure that your users are aware of this.

For more details, see [creating new themes][creating-new-themes].

## `<meta>` tags

Your website can define additional `<meta>` tags to help giscus gather the
context of the page that embeds the comments.

### `giscus:backlink`

If the page that embeds giscus has a `<meta>` tag with a
`name="giscus:backlink"` attribute, giscus will use that element's `content`
attribute to link back to the page when creating a new discussion. Otherwise,
giscus will use the value of `window.location.href`. For example, with the
following element in your web page:

```html
<head>
  <!-- ... -->
  <meta name="giscus:backlink" content="https://bit.ly/RickRolled">
  <!-- ... -->
</head>
```

When giscus creates a new discussion, the discussion body will contain a link to
https://bit.ly/RickRolled instead of your web page's URL. This can be useful if
you want to use short links for your web pages (e.g. to avoid expired links if
you change your website's URL structure or domain).

### `giscus:description`

If the page that embeds giscus has a `<meta>` tag with a
`name="giscus:description"` attribute, the element will take the place of
`<meta name="og:description" content="...">`. When creating a discussion, the
discussion will includes that instead of the content of
`<meta name="og:description">`. For example, with the following element in your
web page:

```html
<head>
  <!-- ... -->
  <meta
    name="og:description"
    content="A comment system powered by GitHub Discussions."
  >
  <meta
    name="giscus:description"
    content="Please click the link above to see the post."
  >
  <!-- ... -->
</head>
```

When giscus creates a new discussion, the discussion body will contain
`Let visitors leave comments and reactions on your website via GitHub!` instead
of `A comment system powered by GitHub Discussions.`. This can be useful if the
page's `og:description` is volatile.

## giscus-to-parent `message` events

There are `message` events emitted by giscus to the parent `window` using
`window.parent.postMessage()`. You can listen to these events to update your
page based on giscus' state. For example:

```ts
function handleMessage(event: MessageEvent) {
  if (event.origin !== 'https://giscus.app') return;
  if (!(typeof event.data === 'object' && event.data.giscus)) return;

  const giscusData = event.data.giscus;
  // Do whatever you want with it, e.g. `console.log(giscusData)`.
  // You'll need to make sure that `giscusData` contains the message you're
  // expecting, e.g. by using `if ('discussion' in giscusData)`.
}

window.addEventListener('message', handleMessage);
// Some time later...
window.removeEventListener('message', handleMessage);
```

The `giscusData` constant in the above example will dynamically contain the
message data as shown in the following interfaces. For more details of the
interfaces, see [`lib/types/giscus.ts`][giscus.ts] and the interfaces imported
inside that module.

### `IErrorMessage`

By default, giscus emits an error message to the parent whenever it encounters
an error. This is used by the client script to automatically delete invalid or
expired session data from the parent's `localStorage`. This isn't really useful
for most users, but you can receive the data if you need it. The message
interface is specified as the following:

```ts
interface IErrorMessage {
  error: string;
}
```

Following the `handleMessage` example above, that means `giscusData` will be of
type `IErrorMessage`:

```ts
if ('error' in giscusData) {
  const errorMessage: IErrorMessage = giscusData;
  console.error(errorMessage.error);
}
```

### `IMetadataMessage`

If you enable the "Emit discussion metadata" feature by setting
`data-emit-metadata="1"` in the `<script>` tag, giscus will periodically emit
the discussion metadata using the following interface. Note that the data will
only be emitted if the discussion exists.

```ts
interface IMetadataMessage {
  discussion: IDiscussionData;
  viewer: IUser;
}
```

Following the `handleMessage` example above, that means `giscusData` will be of
type `IMetadataMessage`:

```ts
if ('discussion' in giscusData) {
  const metadataMessage: IMetadataMessage = giscusData;
  console.log(metadataMessage.discussion);
  console.log(metadataMessage.viewer);
}
```

## Parent-to-giscus `message` events

The `contentWindow` of giscus' `<iframe>` element also listens to `message`
events. You can send these events to update giscus based on your page's state.
For example:

```ts
function sendMessage<T>(message: T) {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
  if (!iframe) return;
  iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
}
```

The `T` type of the `message` in the above example can be any of the following
interfaces. For more details of the interfaces, see
[`lib/types/giscus.ts`][giscus.ts] and the interfaces imported inside that
module.

### `ISetConfigMessage`

The `ISetConfigMessage` interface lets you change giscus' config on-the-fly
without having to reload the `<script>` or `<iframe>` elements. All of the
properties inside the `setConfig` property are optional, which means that
you can update a specific subset of the config and leave everything else as-is.

```ts
interface ISetConfigMessage {
  setConfig: {
    theme?: Theme;
    repo?: string;
    repoId?: string;
    category?: string;
    categoryId?: string;
    term?: string;
    description?: string;
    backLink?: string;
    number?: number;
    strict?: boolean;
    reactionsEnabled?: boolean;
    emitMetadata?: boolean;
    inputPosition?: InputPosition;
    lang?: AvailableLanguage;
  };
}
```

Following the `sendMessage` example above, in this case `message` will be of
type `ISetConfigMessage`:

```ts
sendMessage({
  setConfig: {
    theme: 'https://giscus.app/themes/custom_example.css',
    reactionsEnabled: false,
  }
});
```

[giscus.json]: giscus.json
[creating-new-themes]: https://github.com/giscus/giscus/blob/main/CONTRIBUTING.md#creating-new-themes
[giscus.ts]: lib/types/giscus.ts
[sha1-calculator]: https://xorbin.com/tools/sha1-hash-calculator
