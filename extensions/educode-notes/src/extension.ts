import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/* ─── Storage ────────────────────────────────────────────────────── */

interface Note {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

/* ─── Obsidian Vault Sync ────────────────────────────────────────── */

function getObsidianConfig(): { vaultPath: string; autoSync: boolean } {
	const config = vscode.workspace.getConfiguration('educode.notes');
	return {
		vaultPath: config.get<string>('obsidianVaultPath', ''),
		autoSync: config.get<boolean>('autoSyncToObsidian', true),
	};
}

function sanitizeFilename(name: string): string {
	return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim() || 'Untitled Note';
}

function noteToMarkdown(note: Note): string {
	const frontmatter = [
		'---',
		`id: ${note.id}`,
		`created: ${note.createdAt}`,
		`updated: ${note.updatedAt}`,
		'tags: [educode]',
		'---',
	].join('\n');
	return `${frontmatter}\n\n${note.content}`;
}

function getEduCodeFolder(vaultPath: string): string {
	return path.join(vaultPath, 'EduCode');
}

function syncNoteToVault(note: Note, vaultPath: string): void {
	if (!vaultPath) { return; }

	const eduCodeDir = getEduCodeFolder(vaultPath);
	try {
		if (!fs.existsSync(eduCodeDir)) {
			fs.mkdirSync(eduCodeDir, { recursive: true });
		}
		const filename = sanitizeFilename(note.title) + '.md';
		const filePath = path.join(eduCodeDir, filename);
		fs.writeFileSync(filePath, noteToMarkdown(note), 'utf-8');
	} catch (err) {
		console.error('[EduCode Notes] Failed to sync to Obsidian:', err);
	}
}

function syncAllNotesToVault(notes: Note[], vaultPath: string): number {
	if (!vaultPath || !notes.length) { return 0; }

	const eduCodeDir = getEduCodeFolder(vaultPath);
	try {
		if (!fs.existsSync(eduCodeDir)) {
			fs.mkdirSync(eduCodeDir, { recursive: true });
		}
	} catch {
		return 0;
	}

	let synced = 0;
	for (const note of notes) {
		try {
			const filename = sanitizeFilename(note.title) + '.md';
			const filePath = path.join(eduCodeDir, filename);
			fs.writeFileSync(filePath, noteToMarkdown(note), 'utf-8');
			synced++;
		} catch {
			// continue with other notes
		}
	}
	return synced;
}

function deleteNoteFromVault(noteTitle: string, vaultPath: string): void {
	if (!vaultPath) { return; }

	const eduCodeDir = getEduCodeFolder(vaultPath);
	const filename = sanitizeFilename(noteTitle) + '.md';
	const filePath = path.join(eduCodeDir, filename);
	try {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch {
		// non-critical
	}
}

/* ─── Webview HTML ───────────────────────────────────────────────── */

function getNotesHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
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
			font-size: 12px;
		}

		/* Toolbar */
		.toolbar {
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 6px 8px;
			border-bottom: 1px solid var(--vscode-panel-border);
			background: var(--vscode-sideBar-background);
		}
		.toolbar button {
			padding: 3px 8px;
			font-size: 11px;
			background: transparent;
			color: var(--vscode-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			cursor: pointer;
			opacity: 0.8;
		}
		.toolbar button:hover { opacity: 1; background: var(--vscode-list-hoverBackground); }
		.toolbar .spacer { flex: 1; }
		.toolbar .count {
			font-size: 10px;
			opacity: 0.5;
		}

		/* Notes list */
		.notes-list {
			flex: 1;
			overflow-y: auto;
			display: none;
		}
		.notes-list.visible { display: block; }
		.note-item {
			display: flex;
			align-items: center;
			padding: 8px 12px;
			border-bottom: 1px solid var(--vscode-panel-border);
			cursor: pointer;
			gap: 8px;
		}
		.note-item:hover { background: var(--vscode-list-hoverBackground); }
		.note-item.active { background: var(--vscode-list-activeSelectionBackground); }
		.note-item .info { flex: 1; min-width: 0; }
		.note-item .title {
			font-weight: 600;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.note-item .date {
			font-size: 10px;
			opacity: 0.5;
			margin-top: 2px;
		}
		.note-item .delete {
			opacity: 0;
			cursor: pointer;
			font-size: 14px;
			padding: 2px 4px;
			color: var(--vscode-errorForeground);
		}
		.note-item:hover .delete { opacity: 0.6; }
		.note-item .delete:hover { opacity: 1; }

		/* Editor */
		.editor-area {
			flex: 1;
			display: none;
			flex-direction: column;
		}
		.editor-area.visible { display: flex; }
		.editor-header {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			border-bottom: 1px solid var(--vscode-panel-border);
		}
		.editor-header input {
			flex: 1;
			padding: 3px 6px;
			font-size: 13px;
			font-weight: 600;
			border: 1px solid transparent;
			background: transparent;
			color: var(--vscode-editor-foreground);
			border-radius: 3px;
		}
		.editor-header input:focus {
			border-color: var(--vscode-focusBorder);
			background: var(--vscode-input-background);
		}
		.editor-header .back {
			cursor: pointer;
			opacity: 0.6;
			font-size: 16px;
		}
		.editor-header .back:hover { opacity: 1; }
		.editor-content {
			flex: 1;
			display: flex;
		}
		.editor-content textarea {
			flex: 1;
			padding: 12px;
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: 13px;
			line-height: 1.6;
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			border: none;
			outline: none;
			resize: none;
		}

		.empty-state {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 12px;
			opacity: 0.4;
		}
		.empty-state .icon { font-size: 36px; }
		.empty-state p { font-size: 12px; }
	</style>
</head>
<body>
	<div class="toolbar">
		<button id="newBtn">+ New</button>
		<button id="timestampBtn">Timestamp</button>
		<div class="spacer"></div>
		<span class="count" id="noteCount"></span>
	</div>

	<div class="notes-list visible" id="notesList">
		<div class="empty-state" id="emptyState">
			<div class="icon">&#128221;</div>
			<p>No notes yet. Click + New to start.</p>
		</div>
	</div>

	<div class="editor-area" id="editorArea">
		<div class="editor-header">
			<span class="back" id="backBtn">&larr;</span>
			<input type="text" id="titleInput" placeholder="Note title..." />
		</div>
		<div class="editor-content">
			<textarea id="contentArea" placeholder="Start typing your notes..."></textarea>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		let state = vscode.getState() || { notes: [], activeId: null, view: 'list' };

		const notesList = document.getElementById('notesList');
		const editorArea = document.getElementById('editorArea');
		const emptyState = document.getElementById('emptyState');
		const titleInput = document.getElementById('titleInput');
		const contentArea = document.getElementById('contentArea');
		const noteCount = document.getElementById('noteCount');

		function save() {
			vscode.setState(state);
			vscode.postMessage({ type: 'stateChanged', notes: state.notes });
		}

		function generateId() {
			return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
		}

		function formatDate(iso) {
			const d = new Date(iso);
			return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}

		function showList() {
			state.view = 'list';
			state.activeId = null;
			notesList.classList.add('visible');
			editorArea.classList.remove('visible');
			renderList();
			save();
		}

		function showEditor(noteId) {
			const note = state.notes.find(n => n.id === noteId);
			if (!note) return;
			state.view = 'editor';
			state.activeId = noteId;
			notesList.classList.remove('visible');
			editorArea.classList.add('visible');
			titleInput.value = note.title;
			contentArea.value = note.content;
			contentArea.focus();
			save();
		}

		function createNote() {
			const note = {
				id: generateId(),
				title: 'Untitled Note',
				content: '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			state.notes.unshift(note);
			save();
			showEditor(note.id);
		}

		function deleteNote(id) {
			state.notes = state.notes.filter(n => n.id !== id);
			if (state.activeId === id) {
				showList();
			} else {
				renderList();
			}
			save();
		}

		function updateActiveNote() {
			if (!state.activeId) return;
			const note = state.notes.find(n => n.id === state.activeId);
			if (!note) return;
			note.title = titleInput.value || 'Untitled Note';
			note.content = contentArea.value;
			note.updatedAt = new Date().toISOString();
			save();
		}

		function insertTimestamp() {
			if (state.view !== 'editor') return;
			const ts = '[' + new Date().toLocaleString() + '] ';
			const pos = contentArea.selectionStart;
			contentArea.value = contentArea.value.substring(0, pos) + ts + contentArea.value.substring(pos);
			contentArea.selectionStart = contentArea.selectionEnd = pos + ts.length;
			contentArea.focus();
			updateActiveNote();
		}

		function renderList() {
			const items = state.notes;
			noteCount.textContent = items.length + ' note' + (items.length !== 1 ? 's' : '');

			if (items.length === 0) {
				emptyState.style.display = 'flex';
				// Remove any non-empty-state children
				Array.from(notesList.children).forEach(el => {
					if (el !== emptyState) el.remove();
				});
				return;
			}

			emptyState.style.display = 'none';
			// Remove old items
			Array.from(notesList.children).forEach(el => {
				if (el !== emptyState) el.remove();
			});

			items.forEach(note => {
				const el = document.createElement('div');
				el.className = 'note-item' + (note.id === state.activeId ? ' active' : '');
				el.innerHTML =
					'<div class="info">' +
					'<div class="title">' + escapeHtml(note.title) + '</div>' +
					'<div class="date">' + formatDate(note.updatedAt) + '</div>' +
					'</div>' +
					'<span class="delete" data-id="' + note.id + '">x</span>';

				el.addEventListener('click', (e) => {
					if (e.target.classList.contains('delete')) {
						deleteNote(e.target.dataset.id);
						return;
					}
					showEditor(note.id);
				});
				notesList.appendChild(el);
			});
		}

		function escapeHtml(s) {
			return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		// Event listeners
		document.getElementById('newBtn').addEventListener('click', createNote);
		document.getElementById('backBtn').addEventListener('click', () => {
			updateActiveNote();
			showList();
		});
		document.getElementById('timestampBtn').addEventListener('click', insertTimestamp);

		let saveTimer;
		titleInput.addEventListener('input', () => {
			clearTimeout(saveTimer);
			saveTimer = setTimeout(updateActiveNote, 300);
		});
		contentArea.addEventListener('input', () => {
			clearTimeout(saveTimer);
			saveTimer = setTimeout(updateActiveNote, 300);
		});

		// Handle messages from extension
		window.addEventListener('message', (e) => {
			const msg = e.data;
			if (msg.type === 'newNote') createNote();
			if (msg.type === 'insertTimestamp') insertTimestamp();
			if (msg.type === 'exportRequest') {
				vscode.postMessage({ type: 'exportData', notes: state.notes });
			}
		});

		// Restore state
		if (state.view === 'editor' && state.activeId) {
			showEditor(state.activeId);
		} else {
			renderList();
		}
	</script>
</body>
</html>`;
}

/* ─── Extension Activation ───────────────────────────────────────── */

export function activate(context: vscode.ExtensionContext) {
	let currentView: vscode.WebviewView | undefined;

	const provider: vscode.WebviewViewProvider = {
		resolveWebviewView(webviewView: vscode.WebviewView) {
			currentView = webviewView;

			webviewView.webview.options = {
				enableScripts: true,
				localResourceRoots: [context.extensionUri],
			};

			webviewView.webview.html = getNotesHtml();

			// Handle messages from the webview
			webviewView.webview.onDidReceiveMessage((msg) => {
				if (msg.type === 'stateChanged') {
					// Persist notes to global state
					context.globalState.update('educode-notes', msg.notes);

					// Auto-sync to Obsidian vault
					const { vaultPath, autoSync } = getObsidianConfig();
					if (vaultPath && autoSync && msg.notes?.length > 0) {
						// Sync the most recently updated note
						const sorted = [...msg.notes].sort(
							(a: Note, b: Note) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
						);
						syncNoteToVault(sorted[0], vaultPath);
					}
				}
				if (msg.type === 'exportData') {
					exportNotes(msg.notes);
				}
			});

			webviewView.onDidDispose(() => {
				currentView = undefined;
			});
		}
	};

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('educode.notesEditor', provider, {
			webviewOptions: { retainContextWhenHidden: true },
		})
	);

	// Command: New Note
	context.subscriptions.push(
		vscode.commands.registerCommand('educode.notes.new', async () => {
			await vscode.commands.executeCommand('educode.notesEditor.focus');
			if (currentView) {
				currentView.webview.postMessage({ type: 'newNote' });
			}
		})
	);

	// Command: Insert Timestamp
	context.subscriptions.push(
		vscode.commands.registerCommand('educode.notes.timestamp', () => {
			if (currentView) {
				currentView.webview.postMessage({ type: 'insertTimestamp' });
			}
		})
	);

	// Command: Export Notes
	context.subscriptions.push(
		vscode.commands.registerCommand('educode.notes.export', () => {
			if (currentView) {
				currentView.webview.postMessage({ type: 'exportRequest' });
			}
		})
	);

	// Command: Set Obsidian Vault Path
	context.subscriptions.push(
		vscode.commands.registerCommand('educode.notes.setObsidianVault', async () => {
			const uris = await vscode.window.showOpenDialog({
				canSelectFolders: true,
				canSelectFiles: false,
				canSelectMany: false,
				openLabel: 'Select Obsidian Vault',
				title: 'Choose your Obsidian vault folder',
			});

			if (uris && uris.length > 0) {
				const vaultPath = uris[0].fsPath;
				const config = vscode.workspace.getConfiguration('educode.notes');
				await config.update('obsidianVaultPath', vaultPath, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(
					`Obsidian vault set to: ${vaultPath}. Notes will sync to ${vaultPath}/EduCode/`
				);
			}
		})
	);

	// Command: Sync All Notes to Obsidian
	context.subscriptions.push(
		vscode.commands.registerCommand('educode.notes.syncToObsidian', async () => {
			const { vaultPath } = getObsidianConfig();
			if (!vaultPath) {
				const action = await vscode.window.showWarningMessage(
					'No Obsidian vault configured. Set one now?',
					'Set Vault Path'
				);
				if (action) {
					await vscode.commands.executeCommand('educode.notes.setObsidianVault');
				}
				return;
			}

			const notes = context.globalState.get<Note[]>('educode-notes', []);
			if (notes.length === 0) {
				vscode.window.showInformationMessage('No notes to sync.');
				return;
			}

			const synced = syncAllNotesToVault(notes, vaultPath);
			vscode.window.showInformationMessage(
				`Synced ${synced} note${synced !== 1 ? 's' : ''} to ${vaultPath}/EduCode/`
			);
		})
	);
}

async function exportNotes(notes: Note[]) {
	if (!notes || notes.length === 0) {
		vscode.window.showInformationMessage('No notes to export.');
		return;
	}

	const content = notes.map(n =>
		`# ${n.title}\n_Created: ${n.createdAt} | Updated: ${n.updatedAt}_\n\n${n.content}\n\n---\n`
	).join('\n');

	const uri = await vscode.window.showSaveDialog({
		defaultUri: vscode.Uri.file('notes.md'),
		filters: { 'Markdown': ['md'], 'Text': ['txt'] },
	});

	if (uri) {
		await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
		vscode.window.showInformationMessage(`Exported ${notes.length} notes to ${uri.fsPath}`);
	}
}

export function deactivate() {}
