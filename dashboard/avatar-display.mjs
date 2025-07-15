import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * Component to display GitHub avatars with fallback for string authors
 * @element github-avatar
 * @property {Object|String} author - Either a GitHub user object or string author name
 * @property {String} size - Avatar size: 'small' (24px), 'medium' (40px), 'large' (64px)
 * @property {Boolean} showName - Whether to show the author name next to avatar
 */
class GitHubAvatar extends LitElement {
    static properties = {
        author: { type: Object },
        size: { type: String },
        showName: { type: Boolean }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .avatar-wrapper {
            position: relative;
            display: inline-block;
        }

        .avatar {
            border-radius: 50%;
            object-fit: cover;
            transition: transform 0.2s ease;
        }

        .avatar:hover {
            transform: scale(1.05);
        }

        .avatar.small {
            width: 24px;
            height: 24px;
        }

        .avatar.medium {
            width: 40px;
            height: 40px;
        }

        .avatar.large {
            width: 64px;
            height: 64px;
        }

        .fallback-avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            border-radius: 50%;
            user-select: none;
        }

        .fallback-avatar.small {
            width: 24px;
            height: 24px;
            font-size: 10px;
        }

        .fallback-avatar.medium {
            width: 40px;
            height: 40px;
            font-size: 16px;
        }

        .fallback-avatar.large {
            width: 64px;
            height: 64px;
            font-size: 24px;
        }

        .author-name {
            font-size: 14px;
            color: var(--text-main);
            font-weight: 500;
        }

        a {
            text-decoration: none;
            color: inherit;
        }

        a:hover .author-name {
            color: var(--accent);
            text-decoration: underline;
        }

        .loading {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;

    constructor() {
        super();
        this.size = 'medium';
        this.showName = false;
    }

    _getInitials(name) {
        if (!name || typeof name !== 'string') return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    _isGitHubUser(author) {
        return author && typeof author === 'object' && 'github_username' in author;
    }

    _getDisplayName(author) {
        if (this._isGitHubUser(author)) {
            return author.display_name || author.github_username;
        }
        return author || 'Unknown';
    }

    _renderAvatar() {
        const sizeClass = this.size;
        
        if (this._isGitHubUser(this.author) && this.author.avatar_url) {
            return html`
                <img 
                    class="avatar ${sizeClass}"
                    src="${this.author.avatar_url}"
                    alt="${this._getDisplayName(this.author)}'s avatar"
                    @error="${this._handleImageError}"
                />
            `;
        }

        // Fallback avatar with initials
        const initials = this._getInitials(this._getDisplayName(this.author));
        return html`
            <div class="fallback-avatar ${sizeClass}">
                ${initials}
            </div>
        `;
    }

    _handleImageError(e) {
        // Replace broken image with fallback
        const img = e.target;
        const wrapper = img.parentElement;
        const initials = this._getInitials(this._getDisplayName(this.author));
        const fallback = document.createElement('div');
        fallback.className = `fallback-avatar ${this.size}`;
        fallback.textContent = initials;
        wrapper.replaceChild(fallback, img);
    }

    render() {
        const displayName = this._getDisplayName(this.author);
        const isGitHubUser = this._isGitHubUser(this.author);
        const profileUrl = isGitHubUser ? this.author.profile_url : null;

        const avatarContent = html`
            <div class="avatar-wrapper">
                ${this._renderAvatar()}
            </div>
            ${this.showName ? html`<span class="author-name">${displayName}</span>` : ''}
        `;

        if (profileUrl) {
            return html`
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" title="View GitHub profile">
                    ${avatarContent}
                </a>
            `;
        }

        return avatarContent;
    }
}

customElements.define('github-avatar', GitHubAvatar);

export { GitHubAvatar };