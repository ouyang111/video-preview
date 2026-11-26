# dsh-video-preview

Play video files inside the DeepSeek Harness Sidebar document preview.

The built-in preview renders text, Markdown, code, images, PDF, Office files, and HTML, but an `.mp4` falls into the unsupported-binary path. This bundle registers a `bytes-complete` document preview for video suffixes and renders it with a native `<video>` element, so playback controls and scrubbing work in the pane. Playback stops at the end; it does not loop, and it does not start by itself.

## Supported formats

| Suffix | MIME |
|---|---|
| `.mp4`, `.m4v` | `video/mp4` |
| `.webm` | `video/webm` |
| `.ogv` | `video/ogg` |
| `.mov` | `video/quicktime` |

Whether a given codec actually plays depends on the Chromium build that ships the Web shell (H.264/AAC and VP9/Opus are normally available; exotic codecs may not be).

## How it works

- Host half (`index.js`) is empty; the preview registers from the client module.
- `client.js` calls `ctx.documentPreviews.register({ id, extensions, binaryExtensions, priority: 'extension', title, loading: 'bytes-complete' })` and mounts a body in the keyed `sidebar.right.tab.document` slot under the same id.
- The body turns the previewed file's bytes into a Blob URL and revokes it when the tab changes or unmounts.

## Limitations

- The whole file is read before playback (`bytes-complete`), so a clip above the Host preview size cap still shows the unsupported message.
- No thumbnails or poster frames; the first frame appears when playback starts.
- `.mov` only plays if its codec is one the browser supports.
- No autoplay and no loop: press play, and the clip stops on its last frame.
- The preview pane is not a media library: no playlists, no frame stepping.

## Install

Install the bundle in the profile and open any video from the Files pane. A page refresh is needed once after installation so the client module is loaded.

## License

MIT.
