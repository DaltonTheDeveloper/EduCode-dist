import * as vscode from 'vscode';

function getWelcomeHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #0d0d14;
      color: #e8e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .welcome-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 420px;
      width: 100%;
      padding: 24px;
    }

    .title {
      font-size: 48px;
      font-weight: 700;
      color: #9a9ab0;
      letter-spacing: -1px;
    }

    .subtitle {
      margin-top: 8px;
      font-size: 18px;
      color: #b0b0c8;
    }

    /* Code typing animation */
    .code-window {
      margin-top: 32px;
      width: 320px;
      border-radius: 8px;
      overflow: hidden;
      background: #0a0a12;
      border: 1px solid #1e1e2e;
    }

    .code-titlebar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 12px;
      height: 28px;
      background: #111118;
      border-bottom: 1px solid #1e1e2e;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }

    .code-filename {
      margin-left: 8px;
      font-size: 11px;
      color: #9a9ab0;
      font-family: 'JetBrains Mono', monospace;
    }

    .code-area {
      padding: 12px 16px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      height: 160px;
      overflow: hidden;
      text-align: left;
      white-space: pre;
    }

    .cursor {
      display: inline-block;
      width: 7px;
      height: 14px;
      background: #7c6af7;
      vertical-align: text-bottom;
      margin-left: 1px;
      animation: blink 1.06s step-end infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    /* Action buttons */
    .actions {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 320px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      background: #1a1a24;
      border: 1px solid #2a2a3e;
      color: #e8e8f0;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.15s;
      text-align: left;
    }

    .action-btn:hover {
      background: #20202e;
    }

    .action-icon {
      width: 18px;
      height: 18px;
      color: #7c6af7;
      flex-shrink: 0;
    }

    /* Keyboard shortcuts */
    .shortcuts {
      margin-top: 32px;
      width: 320px;
      text-align: left;
    }

    .shortcuts-title {
      font-size: 11px;
      color: #9a9ab0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }

    .shortcut-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
    }

    .shortcut-label {
      font-size: 13px;
      color: #b0b0c8;
    }

    .shortcut-keys {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 4px;
      background: #1a1a24;
      border: 1px solid #2a2a3e;
      font-size: 11px;
      color: #9a9ab0;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Checkbox */
    .startup-toggle {
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .startup-toggle input {
      accent-color: #7c6af7;
      width: 14px;
      height: 14px;
      cursor: pointer;
    }

    .startup-toggle label {
      font-size: 12px;
      color: #9a9ab0;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="welcome-container">
    <div class="title">EduCode</div>
    <div class="subtitle">Code. Watch. Learn.</div>

    <div class="code-window">
      <div class="code-titlebar">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
        <span class="code-filename">main.cpp</span>
      </div>
      <div class="code-area" id="codeArea"><span class="cursor"></span></div>
    </div>

    <div class="actions">
      <button class="action-btn" id="btnOpenFolder">
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
        <span>Open Folder</span>
      </button>
      <button class="action-btn" id="btnWatchTutorial">
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>Watch Tutorial</span>
      </button>
      <button class="action-btn" id="btnBrowseCourses">
        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        <span>Browse Courses</span>
      </button>
    </div>

    <div class="shortcuts">
      <div class="shortcuts-title">Keyboard Shortcuts</div>
      <div class="shortcut-row">
        <span class="shortcut-label">Open Folder</span>
        <div class="shortcut-keys"><kbd>\u2318</kbd><kbd>O</kbd></div>
      </div>
      <div class="shortcut-row">
        <span class="shortcut-label">Save</span>
        <div class="shortcut-keys"><kbd>\u2318</kbd><kbd>S</kbd></div>
      </div>
      <div class="shortcut-row">
        <span class="shortcut-label">Terminal</span>
        <div class="shortcut-keys"><kbd>\u2318</kbd><kbd>\`</kbd></div>
      </div>
      <div class="shortcut-row">
        <span class="shortcut-label">Command Palette</span>
        <div class="shortcut-keys"><kbd>\u2318</kbd><kbd>Shift</kbd><kbd>P</kbd></div>
      </div>
    </div>

    <div class="startup-toggle">
      <input type="checkbox" id="showOnStartup" checked />
      <label for="showOnStartup">Show welcome page on startup</label>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // ── Typing Animation ──────────────────────────────────────────
    const CODE_SEGMENTS = [
      { text: '#include', color: '#c678dd' },
      { text: ' <', color: '#e8e8f0' },
      { text: 'iostream', color: '#5af78e' },
      { text: '>\\n', color: '#e8e8f0' },
      { text: 'using', color: '#c678dd' },
      { text: ' ', color: '#e8e8f0' },
      { text: 'namespace', color: '#c678dd' },
      { text: ' std;\\n\\n', color: '#e8e8f0' },
      { text: 'int', color: '#f3f99d' },
      { text: ' ', color: '#e8e8f0' },
      { text: 'main', color: '#57c7ff' },
      { text: '() {\\n', color: '#e8e8f0' },
      { text: '    cout ', color: '#e8e8f0' },
      { text: '<<', color: '#ff6ac1' },
      { text: ' ', color: '#e8e8f0' },
      { text: '"Hello, EduCode!"', color: '#5af78e' },
      { text: ' ', color: '#e8e8f0' },
      { text: '<<', color: '#ff6ac1' },
      { text: ' endl;\\n', color: '#e8e8f0' },
      { text: '    ', color: '#e8e8f0' },
      { text: 'return', color: '#c678dd' },
      { text: ' ', color: '#e8e8f0' },
      { text: '0', color: '#f3f99d' },
      { text: ';\\n}', color: '#e8e8f0' },
    ];

    // Parse escape sequences
    function parseText(text) {
      return text.replace(/\\\\n/g, '\\n');
    }

    const fullCode = CODE_SEGMENTS.map(s => parseText(s.text)).join('');
    const charColors = [];
    for (const seg of CODE_SEGMENTS) {
      const parsed = parseText(seg.text);
      for (let i = 0; i < parsed.length; i++) {
        charColors.push(seg.color);
      }
    }

    const codeArea = document.getElementById('codeArea');
    let charIndex = 0;
    let isPaused = false;

    function renderCode() {
      let html = '';
      for (let i = 0; i < charIndex; i++) {
        const ch = fullCode[i];
        if (ch === '\\n') {
          html += '\\n';
        } else {
          html += '<span style="color:' + charColors[i] + '">' + ch + '</span>';
        }
      }
      html += '<span class="cursor"></span>';
      codeArea.innerHTML = html;
    }

    function typeNext() {
      if (isPaused) {
        setTimeout(() => {
          charIndex = 0;
          isPaused = false;
          renderCode();
          typeNext();
        }, 2000);
        return;
      }

      if (charIndex >= fullCode.length) {
        isPaused = true;
        typeNext();
        return;
      }

      const speed = fullCode[charIndex] === '\\n' ? 120 : 45;
      charIndex++;
      renderCode();
      setTimeout(typeNext, speed);
    }

    renderCode();
    typeNext();

    // ── Button Actions ────────────────────────────────────────────
    document.getElementById('btnOpenFolder').addEventListener('click', () => {
      vscode.postMessage({ type: 'openFolder' });
    });

    document.getElementById('btnWatchTutorial').addEventListener('click', () => {
      vscode.postMessage({ type: 'watchTutorial' });
    });

    document.getElementById('btnBrowseCourses').addEventListener('click', () => {
      vscode.postMessage({ type: 'browseCourses' });
    });

    // ── Startup Toggle ────────────────────────────────────────────
    const checkbox = document.getElementById('showOnStartup');
    checkbox.addEventListener('change', () => {
      vscode.postMessage({ type: 'toggleStartup', value: checkbox.checked });
    });
  </script>
</body>
</html>`;
}

interface WebviewMessage {
  type: 'openFolder' | 'watchTutorial' | 'browseCourses' | 'toggleStartup';
  value?: boolean;
}

export function activate(context: vscode.ExtensionContext): void {
  // Register the welcome command
  context.subscriptions.push(
    vscode.commands.registerCommand('educode.welcome.show', () => {
      showWelcomePanel(context);
    })
  );

  // Show on startup if configured
  const config = vscode.workspace.getConfiguration('educode.welcome');
  const showOnStartup = config.get<boolean>('showOnStartup', true);

  if (showOnStartup) {
    // Small delay to let VS Code finish loading
    setTimeout(() => {
      showWelcomePanel(context);
    }, 300);
  }
}

function showWelcomePanel(context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel(
    'educodeWelcome',
    'Welcome',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [context.extensionUri],
    }
  );

  // Set a custom icon for the tab
  panel.iconPath = undefined;

  panel.webview.html = getWelcomeHtml();

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message: WebviewMessage) => {
      switch (message.type) {
        case 'openFolder':
          await vscode.commands.executeCommand('workbench.action.files.openFolder');
          break;

        case 'watchTutorial':
          // Open the right sidebar with the media player
          try {
            await vscode.commands.executeCommand('educode.mediaPlayer.focus');
          } catch {
            vscode.env.openExternal(
              vscode.Uri.parse('https://www.youtube.com/watch?v=ZzaPdXTrSb8')
            );
          }
          break;

        case 'browseCourses':
          vscode.env.openExternal(
            vscode.Uri.parse(
              'https://www.youtube.com/results?search_query=learn+c%2B%2B+programming'
            )
          );
          break;

        case 'toggleStartup': {
          const config = vscode.workspace.getConfiguration('educode.welcome');
          await config.update('showOnStartup', message.value, vscode.ConfigurationTarget.Global);
          break;
        }
      }
    },
    undefined,
    context.subscriptions
  );
}

export function deactivate(): void {}
