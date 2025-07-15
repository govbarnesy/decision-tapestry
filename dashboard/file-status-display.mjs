import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * Component to display file status from github_metadata
 * @element file-status-display
 * @property {Object} fileStatus - File status object with created, modified, deleted, missing arrays
 * @property {Array} affectedComponents - Original affected_components list for comparison
 */
class FileStatusDisplay extends LitElement {
    static properties = {
        fileStatus: { type: Object },
        affectedComponents: { type: Array }
    };

    static styles = css`
        :host {
            display: block;
        }

        .file-status-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .status-group {
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
        }

        .status-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .status-icon {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            color: white;
        }

        .status-icon.created {
            background: #28a745;
        }

        .status-icon.modified {
            background: #0366d6;
        }

        .status-icon.deleted {
            background: #dc3545;
        }

        .status-icon.missing {
            background: #6a737d;
        }

        .status-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-main);
        }

        .status-count {
            font-size: 12px;
            padding: 2px 6px;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            color: var(--text-secondary);
        }

        .file-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .file-item {
            font-size: 13px;
            font-family: monospace;
            color: var(--text-secondary);
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 4px;
            word-break: break-all;
            transition: background 0.2s ease;
        }

        .file-item:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        .empty-message {
            font-size: 13px;
            color: var(--text-secondary);
            font-style: italic;
            padding: 8px;
            text-align: center;
        }

        .components-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
        }

        .components-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-main);
        }

        .sync-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
        }

        .sync-badge.in-sync {
            background: rgba(40, 167, 69, 0.1);
            color: #28a745;
        }

        .sync-badge.out-of-sync {
            background: rgba(220, 53, 69, 0.1);
            color: #dc3545;
        }

        /* Collapsible sections */
        .status-group.collapsed .file-list {
            display: none;
        }

        .status-header {
            cursor: pointer;
            user-select: none;
        }

        .expand-icon {
            margin-left: auto;
            transition: transform 0.2s ease;
        }

        .status-group.collapsed .expand-icon {
            transform: rotate(-90deg);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .file-status-container {
                gap: 12px;
            }

            .status-group {
                padding: 8px;
            }

            .file-item {
                font-size: 12px;
            }
        }
    `;

    constructor() {
        super();
        this.fileStatus = null;
        this.affectedComponents = [];
        this._collapsedSections = new Set();
    }

    _toggleSection(section) {
        if (this._collapsedSections.has(section)) {
            this._collapsedSections.delete(section);
        } else {
            this._collapsedSections.add(section);
        }
        this.requestUpdate();
    }

    _getStatusIcon(status) {
        const icons = {
            created: '+',
            modified: '~',
            deleted: '-',
            missing: '?'
        };
        return icons[status] || '';
    }

    _checkSyncStatus() {
        if (!this.fileStatus || !this.affectedComponents) return null;
        
        const allTrackedFiles = [
            ...(this.fileStatus.created || []),
            ...(this.fileStatus.modified || []),
            ...(this.fileStatus.deleted || [])
        ];
        
        const trackedSet = new Set(allTrackedFiles);
        const componentSet = new Set(this.affectedComponents);
        
        // Check if all affected components are tracked
        for (const component of componentSet) {
            if (!trackedSet.has(component)) {
                return false;
            }
        }
        
        return true;
    }

    _renderFileSection(status, files) {
        if (!files || files.length === 0) return '';
        
        const isCollapsed = this._collapsedSections.has(status);
        
        return html`
            <div class="status-group ${isCollapsed ? 'collapsed' : ''}">
                <div class="status-header" @click="${() => this._toggleSection(status)}">
                    <div class="status-icon ${status}">
                        ${this._getStatusIcon(status)}
                    </div>
                    <span class="status-title">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <span class="status-count">${files.length}</span>
                    <svg class="expand-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/>
                    </svg>
                </div>
                <ul class="file-list">
                    ${files.map(file => html`
                        <li class="file-item">${file}</li>
                    `)}
                </ul>
            </div>
        `;
    }

    render() {
        if (!this.fileStatus) {
            return html`
                <div class="empty-message">
                    No file status information available.
                </div>
            `;
        }

        const syncStatus = this._checkSyncStatus();
        const hasAnyFiles = (this.fileStatus.created?.length || 0) +
                          (this.fileStatus.modified?.length || 0) +
                          (this.fileStatus.deleted?.length || 0) +
                          (this.fileStatus.missing?.length || 0) > 0;

        if (!hasAnyFiles) {
            return html`
                <div class="empty-message">
                    No file changes tracked for this decision.
                </div>
            `;
        }

        return html`
            <div class="components-header">
                <h3 class="components-title">Affected Components</h3>
                ${syncStatus !== null ? html`
                    <span class="sync-badge ${syncStatus ? 'in-sync' : 'out-of-sync'}">
                        ${syncStatus ? 'In Sync' : 'Out of Sync'}
                    </span>
                ` : ''}
            </div>
            <div class="file-status-container">
                ${this._renderFileSection('created', this.fileStatus.created)}
                ${this._renderFileSection('modified', this.fileStatus.modified)}
                ${this._renderFileSection('deleted', this.fileStatus.deleted)}
                ${this._renderFileSection('missing', this.fileStatus.missing)}
            </div>
        `;
    }
}

customElements.define('file-status-display', FileStatusDisplay);

export { FileStatusDisplay };