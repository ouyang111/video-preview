window.__ModuleLoader__.load({
  id: 'dsh-video-preview',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const ID = 'dsh-video-preview/video';
    const SUFFIXES = ['.mp4', '.m4v', '.webm', '.ogv', '.mov'];
    const MIME = {
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.webm': 'video/webm',
      '.ogv': 'video/ogg',
      '.mov': 'video/quicktime',
    };

    function suffixOf(address) {
      if (typeof address !== 'string') return '.mp4';
      const clean = address.split('?')[0].split('#')[0].toLowerCase();
      const dot = clean.lastIndexOf('.');
      return dot === -1 ? '.mp4' : clean.slice(dot);
    }

    function VideoBody(props) {
      const address = props.resourceAddress;
      const raw = props.content && props.content.kind === 'bytes'
        ? props.content.data
        : (props.content && props.content.data);
      const bytes = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
      const mime = MIME[suffixOf(address)] || 'video/mp4';

      const url = React.useMemo(() => {
        if (!bytes || bytes.length === 0) return undefined;
        return URL.createObjectURL(new Blob([bytes], { type: mime }));
      }, [bytes, mime]);

      React.useEffect(() => () => {
        if (url) URL.revokeObjectURL(url);
      }, [url]);

      if (!url) {
        return h('div', {
          style: {
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--dsw-text-secondary, #888)', fontSize: 13,
          },
        }, 'Video data is not available.');
      }

      return h('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', minHeight: 0, background: '#000',
        },
      }, h('video', {
        src: url,
        controls: true,
        playsInline: true,
        preload: 'metadata',
        style: { maxWidth: '100%', maxHeight: '100%', display: 'block' },
      }));
    }

    // Shown in the pane's unsupported state if the registry ever fails to match.
    function Unpreviewable(props) {
      const [open, setOpen] = React.useState(false);
      const path = props && props.absolutePath;

      const overlay = open ? h('div', {
        onClick: () => setOpen(false),
        style: {
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
        },
      }, h('video', {
        src: '/api/file?path=' + encodeURIComponent(path || ''),
        controls: true,
        onClick: (event) => event.stopPropagation(),
        style: { maxWidth: '92vw', maxHeight: '88vh', background: '#000', cursor: 'default' },
      })) : null;

      return h('div', { style: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 } },
        h('button', {
          type: 'button',
          onClick: () => setOpen(true),
          style: {
            padding: '4px 12px', borderRadius: 6, border: '1px solid var(--dsw-border, #666)',
            background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 12,
          },
        }, '播放视频'),
        overlay);
    }

    const DEFINITION = {
      id: ID,
      extensions: SUFFIXES,
      binaryExtensions: SUFFIXES,
      priority: 'extension',
      title: () => 'Video',
      loading: 'bytes-complete',
    };

    return {
      // documentPreviews must be declared: Cordis refuses an undeclared service read.
      inject: ['slots', 'documentPreviews'],
      apply(ctx) {
        let registered = false;
        let slotReady = false;

        const registerRenderer = () => {
          if (registered) return true;
          try {
            if (!ctx.documentPreviews || typeof ctx.documentPreviews.register !== 'function') return false;
            ctx.effect(() => ctx.documentPreviews.register(DEFINITION));
            registered = true;
          } catch (error) {
            const text = String(error);
            // A previous generation of this module may still own the identical
            // definition; reuse it instead of blocking the body registration.
            if (text.includes('duplicate implementation')) registered = true;
            else throw error;
          }
          return registered;
        };

        const registerSlots = () => {
          if (slotReady) return true;
          let ok = true;
          const attemptSlot = (register) => {
            try {
              register();
            } catch (error) {
              if (!String(error).includes('already has an entry')) ok = false;
            }
          };
          attemptSlot(() => ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({
            name: 'sidebar.right.tab.document',
            key: ID,
            id: 'dsh-video-preview-body',
            priority: 5,
          }, VideoBody))));
          attemptSlot(() => ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document.unpreviewable', () => ctx.slots.register({
            name: 'sidebar.right.tab.document.unpreviewable',
            id: 'dsh-video-preview-play',
          }, Unpreviewable))));
          slotReady = ok;
          return slotReady;
        };

        const attempt = () => registerRenderer() && registerSlots();
        if (attempt()) return;

        let tries = 0;
        const tick = () => {
          try {
            if (attempt() || tries++ > 40) return;
          } catch {
            return;
          }
          if (typeof ctx.setTimeout === 'function') ctx.setTimeout(tick, 250);
          else setTimeout(tick, 250);
        };
        tick();
      },
    };
  },
});
