import * as vscode from 'vscode';

/* ─── YouTube URL Helpers ────────────────────────────────────────── */

function extractYouTubeId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
		/^([a-zA-Z0-9_-]{11})$/,
	];
	for (const p of patterns) {
		const m = url.match(p);
		if (m) { return m[1]; }
	}
	return null;
}

function toEmbedUrl(videoId: string): string {
	return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

/* ─── Webview HTML ───────────────────────────────────────────────── */

function getMediaPlayerHtml(videoId?: string): string {
	const iframeSrc = videoId ? toEmbedUrl(videoId) : '';
	const showPlayer = videoId ? 'block' : 'none';
	const showForm = videoId ? 'none' : 'flex';

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: var(--vscode-font-family);
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			height: 100vh;
			display: flex;
			flex-direction: column;
		}
		.toolbar {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 12px;
			border-bottom: 1px solid var(--vscode-panel-border);
			background: var(--vscode-sideBar-background);
		}
		.toolbar input {
			flex: 1;
			padding: 4px 8px;
			font-size: 12px;
			border: 1px solid var(--vscode-input-border);
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border-radius: 3px;
			outline: none;
		}
		.toolbar input:focus {
			border-color: var(--vscode-focusBorder);
		}
		.toolbar button {
			padding: 4px 10px;
			font-size: 11px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 3px;
			cursor: pointer;
		}
		.toolbar button:hover {
			background: var(--vscode-button-hoverBackground);
		}
		.player-container {
			flex: 1;
			display: ${showPlayer};
		}
		.player-container iframe {
			width: 100%;
			height: 100%;
			border: none;
		}
		.empty-state {
			flex: 1;
			display: ${showForm};
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 16px;
			padding: 24px;
			text-align: center;
		}
		.empty-state .icon {
			font-size: 48px;
			opacity: 0.3;
		}
		.empty-state p {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			max-width: 200px;
			line-height: 1.5;
		}
		.empty-state .hint {
			font-size: 11px;
			opacity: 0.6;
			margin-top: 4px;
		}
		.playlist {
			border-top: 1px solid var(--vscode-panel-border);
			max-height: 150px;
			overflow-y: auto;
		}
		.playlist-item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 6px 12px;
			font-size: 11px;
			cursor: pointer;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		.playlist-item:hover {
			background: var(--vscode-list-hoverBackground);
		}
		.playlist-item.active {
			background: var(--vscode-list-activeSelectionBackground);
			color: var(--vscode-list-activeSelectionForeground);
		}
		.playlist-item .remove {
			margin-left: auto;
			opacity: 0.5;
			cursor: pointer;
			font-size: 14px;
		}
		.playlist-item .remove:hover {
			opacity: 1;
			color: var(--vscode-errorForeground);
		}
	</style>
</head>
<body>
	<div class="toolbar">
		<input type="text" id="urlInput" placeholder="Paste YouTube URL..." />
		<button id="playBtn">Play</button>
	</div>

	<div class="player-container" id="playerContainer">
		<iframe
			id="player"
			src="${iframeSrc}"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen>
		</iframe>
	</div>

	<div class="empty-state" id="emptyState">
		<div class="icon">&#9654;</div>
		<p>Paste a YouTube URL above to watch tutorials while you code</p>
		<p class="hint">Cmd+Shift+Y to open from Command Palette</p>
	</div>

	<div class="playlist" id="playlist"></div>

	<script>
		const vscode = acquireVsCodeApi();
		const state = vscode.getState() || { playlist: [], currentId: null };

		const urlInput = document.getElementById('urlInput');
		const playBtn = document.getElementById('playBtn');
		const playerContainer = document.getElementById('playerContainer');
		const emptyState = document.getElementById('emptyState');
		const player = document.getElementById('player');
		const playlistEl = document.getElementById('playlist');

		function extractId(url) {
			const patterns = [
				/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)([a-zA-Z0-9_-]{11})/,
				/^([a-zA-Z0-9_-]{11})$/
			];
			for (const p of patterns) {
				const m = url.match(p);
				if (m) return m[1];
			}
			return null;
		}

		function playVideo(videoId) {
			state.currentId = videoId;
			player.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
			playerContainer.style.display = 'block';
			emptyState.style.display = 'none';
			vscode.setState(state);
			renderPlaylist();
		}

		function addToPlaylist(videoId, title) {
			if (!state.playlist.find(p => p.id === videoId)) {
				state.playlist.push({ id: videoId, title: title || 'Video ' + (state.playlist.length + 1) });
				vscode.setState(state);
				renderPlaylist();
			}
		}

		function renderPlaylist() {
			if (state.playlist.length === 0) {
				playlistEl.style.display = 'none';
				return;
			}
			playlistEl.style.display = 'block';
			playlistEl.innerHTML = state.playlist.map((item, i) =>
				'<div class="playlist-item ' + (item.id === state.currentId ? 'active' : '') + '" data-id="' + item.id + '">' +
				'<span>' + (i + 1) + '. ' + item.title + '</span>' +
				'<span class="remove" data-index="' + i + '">x</span>' +
				'</div>'
			).join('');

			playlistEl.querySelectorAll('.playlist-item').forEach(el => {
				el.addEventListener('click', (e) => {
					if (e.target.classList.contains('remove')) {
						const idx = parseInt(e.target.dataset.index);
						state.playlist.splice(idx, 1);
						vscode.setState(state);
						renderPlaylist();
						return;
					}
					playVideo(el.dataset.id);
				});
			});
		}

		playBtn.addEventListener('click', () => {
			const url = urlInput.value.trim();
			if (!url) return;
			const id = extractId(url);
			if (id) {
				addToPlaylist(id, url);
				playVideo(id);
				urlInput.value = '';
			}
		});

		urlInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') playBtn.click();
		});

		// Handle messages from extension
		window.addEventListener('message', (e) => {
			const msg = e.data;
			if (msg.type === 'play' && msg.videoId) {
				addToPlaylist(msg.videoId, msg.title || msg.videoId);
				playVideo(msg.videoId);
			}
		});

		// Restore state
		if (state.currentId) {
			playVideo(state.currentId);
		}
		renderPlaylist();
	</script>
</body>
</html>`;
}

/* ─── Extension Activation ───────────────────────────────────────── */

export function activate(context: vscode.ExtensionContext) {
	let currentView: vscode.WebviewView | undefined;

	// Register the webview provider for the sidebar
	const provider: vscode.WebviewViewProvider = {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			currentView = webviewView;

			webviewView.webview.options = {
				enableScripts: true,
				localResourceRoots: [context.extensionUri],
			};

			webviewView.webview.html = getMediaPlayerHtml();

			webviewView.onDidDispose(() => {
				currentView = undefined;
			});
		}
	};

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('educode.mediaPlayer', provider, {
			webviewOptions: { retainContextWhenHidden: true },
		})
	);

	// Command: Play URL (from command palette)
	context.subscriptions.push(
		vscode.commands.registerCommand('educode.media.playUrl', async () => {
			const url = await vscode.window.showInputBox({
				prompt: 'Enter a YouTube URL',
				placeHolder: 'https://www.youtube.com/watch?v=...',
				validateInput: (value) => {
					if (!value.trim()) { return 'Please enter a URL'; }
					if (!extractYouTubeId(value.trim())) { return 'Not a valid YouTube URL'; }
					return null;
				}
			});

			if (!url) { return; }
			const videoId = extractYouTubeId(url.trim());
			if (!videoId) { return; }

			// Focus the media view
			await vscode.commands.executeCommand('educode.mediaPlayer.focus');

			// Send the video to the webview
			if (currentView) {
				currentView.webview.postMessage({ type: 'play', videoId, title: url });
			}
		})
	);

	// Command: Play selected text as URL
	context.subscriptions.push(
		vscode.commands.registerCommand('educode.media.playSelection', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) { return; }

			const selection = editor.document.getText(editor.selection);
			const videoId = extractYouTubeId(selection.trim());

			if (!videoId) {
				vscode.window.showWarningMessage('Selected text is not a valid YouTube URL');
				return;
			}

			await vscode.commands.executeCommand('educode.mediaPlayer.focus');

			if (currentView) {
				currentView.webview.postMessage({ type: 'play', videoId, title: selection });
			}
		})
	);
}

export function deactivate() {}
