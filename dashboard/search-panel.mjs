import { LitElement, css, html } from 'https://esm.sh/lit@3';

/**
 * A component that provides search and filtering controls with fun visualizations.
 * @element search-panel
 * @fires search-input - Dispatched when the user types in the search field.
 * @fires filter-change - Dispatched when sliders change.
 */
class SearchPanel extends LitElement {
    static properties = {
        decisions: { type: Array },
        filteredDecisions: { type: Array },
        filters: { type: Object }
    };
    
    constructor() {
        super();
        this.decisions = [];
        this.filteredDecisions = [];
        this.filters = {
            searchTerm: '',
            minImpact: 0,
            daysBack: 0,
            dateRange: { start: 0, end: 0 }
        };
    }
    
    static styles = css`
        :host {
            display: block;
            padding: 1rem;
            box-sizing: border-box;
            background: var(--panel-bg);
        }
        
        .search-section {
            margin-bottom: 1.5rem;
        }
        
        input[type="text"] {
            width: 100%;
            padding: 0.75rem;
            box-sizing: border-box;
            border: 2px solid var(--border);
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s ease;
            background: var(--panel-bg);
            color: var(--text-main);
        }
        
        input[type="text"]:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
        }
        
        .slider-section {
            margin-bottom: 1.5rem;
        }
        
        .slider-group {
            margin-bottom: 1rem;
        }
        
        .slider-label {
            font-weight: 500;
            color: var(--text-main);
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .slider-value {
            background: var(--accent);
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        input[type="range"] {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: var(--border);
            outline: none;
            -webkit-appearance: none;
            margin: 0.5rem 0;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--accent);
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }
        
        .range-slider-container {
            position: relative;
            margin: 0.5rem 0;
        }
        
        .range-slider {
            position: relative;
            height: 6px;
            background: var(--border);
            border-radius: 3px;
        }
        
        .range-slider input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 6px;
            background: transparent;
            pointer-events: none;
            margin: 0;
        }
        
        .range-slider input::-webkit-slider-thumb {
            pointer-events: all;
        }
        
        .range-track {
            position: absolute;
            top: 0;
            height: 6px;
            background: var(--accent);
            border-radius: 3px;
            opacity: 0.7;
        }
        
        .charts-section {
            margin-top: 1rem;
        }
        
        .charts-title {
            font-weight: 600;
            color: var(--text-main);
            font-size: 0.8rem;
            margin-bottom: 0.5rem;
            text-align: center;
        }
        
        .chart-section {
            margin-bottom: 1rem;
        }
        
        .chart-section-title {
            font-weight: 500;
            color: var(--text-secondary);
            font-size: 0.75rem;
            margin-bottom: 0.5rem;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .pie-charts {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
        }
        
        .pie-charts.two-row {
            grid-template-rows: repeat(2, 1fr);
        }
        
        .pie-chart-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem;
            background: var(--tab-bg);
            border-radius: 6px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            flex: 1;
            min-width: 0;
            cursor: pointer;
        }
        
        .pie-chart-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            background: var(--panel-bg);
        }
        
        .pie-chart-item.active {
            background: var(--accent);
            color: white;
        }
        
        .pie-chart-item.active .chart-label {
            color: rgba(255, 255, 255, 0.9);
        }
        
        .pie-chart-item.active .chart-value {
            color: white;
        }
        
        .pie-chart-item.empty {
            opacity: 0.5;
            cursor: default;
        }
        
        .pie-chart-item.empty:hover {
            transform: none;
            box-shadow: none;
            background: var(--tab-bg);
        }
        
        .pie-chart {
            width: 40px;
            height: 40px;
            margin-bottom: 0.25rem;
        }
        
        .chart-label {
            font-size: 0.6rem;
            color: var(--text-secondary);
            text-align: center;
            font-weight: 500;
            line-height: 1.2;
        }
        
        .chart-value {
            font-size: 0.7rem;
            color: var(--accent);
            font-weight: 600;
            margin-top: 0.1rem;
        }
        
        .time-distribution {
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: var(--tab-bg);
            border-radius: 8px;
        }
        
        .time-distribution-title {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
            text-align: center;
        }
        
        .bar-chart {
            display: flex;
            align-items: flex-end;
            gap: 2px;
            height: 40px;
            margin: 0.5rem 0;
        }
        
        .bar {
            flex: 1;
            background: var(--accent);
            border-radius: 2px 2px 0 0;
            transition: all 0.2s ease;
            opacity: 0.7;
            min-height: 2px;
        }
        
        .bar:hover {
            opacity: 1;
            transform: scaleY(1.1);
        }
        
        .time-labels {
            display: flex;
            justify-content: space-between;
            font-size: 0.65rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
        }
    `;

    _handleInput(e) {
        this.filters.searchTerm = e.target.value;
        this.dispatchEvent(new CustomEvent('search-input', {
            detail: { searchTerm: e.target.value },
            bubbles: true,
            composed: true,
        }));
    }
    
    _handleImpactChange(e) {
        this.filters.minImpact = parseInt(e.target.value);
        this.requestUpdate();
        this._emitFilterChange();
    }
    
    _handleDaysChange(e) {
        this.filters.daysBack = parseInt(e.target.value);
        this.requestUpdate();
        this._emitFilterChange();
    }
    
    _handleDateRangeStart(e) {
        this.filters.dateRange.start = parseInt(e.target.value);
        this.requestUpdate();
        this._emitFilterChange();
    }
    
    _handleDateRangeEnd(e) {
        this.filters.dateRange.end = parseInt(e.target.value);
        this.requestUpdate();
        this._emitFilterChange();
    }
    
    _getDateRangeLabel() {
        const maxDays = this._getMaxDaysFromOldestDecision();
        const startDays = this.filters.dateRange.start;
        const endDays = this.filters.dateRange.end;
        
        if (startDays === 0 && endDays === 0) {
            return 'All time';
        }
        
        const startLabel = startDays === 0 ? 'Start' : `${startDays} days ago`;
        const endLabel = endDays === 0 ? 'Now' : `${endDays} days ago`;
        
        return `${startLabel} → ${endLabel}`;
    }
    
    _emitFilterChange() {
        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: { filters: this.filters },
            bubbles: true,
            composed: true,
        }));
    }
    
    _handleCategoryClick(category) {
        // Emit a category filter event
        this.dispatchEvent(new CustomEvent('category-filter', {
            detail: { category },
            bubbles: true,
            composed: true,
        }));
    }
    
    _handleStatusClick(status) {
        // Emit a status filter event
        this.dispatchEvent(new CustomEvent('status-filter', {
            detail: { status },
            bubbles: true,
            composed: true,
        }));
    }
    
    _getMaxDaysFromOldestDecision() {
        if (this.decisions.length === 0) return 365;
        
        const now = new Date();
        const oldestDate = this.decisions.reduce((oldest, decision) => {
            const decisionDate = new Date(decision.date);
            return decisionDate < oldest ? decisionDate : oldest;
        }, now);
        
        const diffTime = Math.abs(now - oldestDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(diffDays, 30);
    }
    
    _getStatusData() {
        const statusCounts = {};
        const dataSource = (this.filteredDecisions && this.filteredDecisions.length > 0) ? this.filteredDecisions : this.decisions;
        dataSource.forEach(d => {
            statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
        });
        return statusCounts;
    }
    
    _getCategoryData() {
        const categoryCounts = {};
        const dataSource = (this.filteredDecisions && this.filteredDecisions.length > 0) ? this.filteredDecisions : this.decisions;
        dataSource.forEach(d => {
            const category = this._inferCategory(d);
            if (category) {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            }
        });
        return categoryCounts;
    }
    
    _getIndividualCategoryData() {
        const categories = ["Infrastructure", "Developer Experience", "UI/UX", "Architecture", "Process", "Quality", "Integration", "Knowledge Management", "Other"];
        // Use filteredDecisions if it exists and has data, otherwise use all decisions
        const dataSource = (this.filteredDecisions && this.filteredDecisions.length > 0) ? this.filteredDecisions : this.decisions;
        const totalDecisions = dataSource.length;
        
        return categories.map(category => {
            const count = dataSource.filter(d => this._inferCategory(d) === category).length;
            return {
                category,
                count,
                percentage: totalDecisions > 0 ? (count / totalDecisions) * 100 : 0
            };
        }); // Show all categories, even with 0 decisions
    }
    
    _inferCategory(decision) {
        const title = decision.title || '';
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('cli') || lowerTitle.includes('automation') || lowerTitle.includes('docker') || lowerTitle.includes('release')) {
            return 'Developer Experience';
        } else if (lowerTitle.includes('websocket') || lowerTitle.includes('server') || lowerTitle.includes('infrastructure') || lowerTitle.includes('api') || lowerTitle.includes('redis') || lowerTitle.includes('session')) {
            return 'Infrastructure';
        } else if (lowerTitle.includes('dashboard') || lowerTitle.includes('ui') || lowerTitle.includes('theme') || lowerTitle.includes('visual') || lowerTitle.includes('layout') || lowerTitle.includes('panel')) {
            return 'UI/UX';
        } else if (lowerTitle.includes('architecture') || lowerTitle.includes('component') || lowerTitle.includes('structure') || lowerTitle.includes('design')) {
            return 'Architecture';
        } else if (lowerTitle.includes('process') || lowerTitle.includes('workflow') || lowerTitle.includes('coordination') || lowerTitle.includes('collaboration') || lowerTitle.includes('debugging')) {
            return 'Process';
        } else if (lowerTitle.includes('test') || lowerTitle.includes('quality') || lowerTitle.includes('lint') || lowerTitle.includes('error')) {
            return 'Quality';
        } else if (lowerTitle.includes('integration') || lowerTitle.includes('vscode') || lowerTitle.includes('extension') || lowerTitle.includes('prompt')) {
            return 'Integration';
        } else if (lowerTitle.includes('memory') || lowerTitle.includes('knowledge') || lowerTitle.includes('decision') || lowerTitle.includes('tapestry')) {
            return 'Knowledge Management';
        }
        return 'Other';
    }
    
    _getStatusBreakdown() {
        const statuses = ["Accepted", "Superseded", "Rejected", "Proposed"];
        const dataSource = (this.filteredDecisions && this.filteredDecisions.length > 0) ? this.filteredDecisions : this.decisions;
        const totalDecisions = dataSource.length;
        
        return statuses.map(status => {
            const count = dataSource.filter(d => d.status === status).length;
            return {
                status,
                count,
                percentage: totalDecisions > 0 ? (count / totalDecisions) * 100 : 0
            };
        }).filter(item => item.count > 0); // Only show statuses with decisions
    }
    
    _getTimeDistribution() {
        const dataSource = (this.filteredDecisions && this.filteredDecisions.length > 0) ? this.filteredDecisions : this.decisions;
        if (dataSource.length === 0) return { buckets: [], labels: [] };
        
        // Get date range
        const now = new Date();
        const dates = dataSource.map(d => new Date(d.date)).sort((a, b) => a - b);
        const oldestDate = dates[0];
        const newestDate = dates[dates.length - 1];
        
        // Find actual date ranges with decisions to normalize for gaps
        const actualTimeSpan = newestDate - oldestDate;
        const totalTimeSpan = now - oldestDate;
        
        // Create 12 time buckets, but normalize based on actual activity period
        const bucketCount = 12;
        let bucketSize, startDate, endDate;
        
        // If decisions span less than 6 months, use actual span
        const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
        if (actualTimeSpan < sixMonths) {
            bucketSize = actualTimeSpan / bucketCount;
            startDate = oldestDate;
            endDate = newestDate;
        } else {
            // For longer periods, use a hybrid approach that focuses on active periods
            // Use the most recent year of activity, or actual span if less than a year
            const oneYear = 365 * 24 * 60 * 60 * 1000;
            const focusSpan = Math.min(actualTimeSpan, oneYear);
            bucketSize = focusSpan / bucketCount;
            startDate = new Date(newestDate.getTime() - focusSpan);
            endDate = newestDate;
        }
        
        const buckets = new Array(bucketCount).fill(0);
        const labels = [];
        
        // Generate bucket labels based on normalized timespan
        for (let i = 0; i < bucketCount; i++) {
            const bucketStart = new Date(startDate.getTime() + (i * bucketSize));
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // For short timespans, show month + year, for longer just month
            if (bucketSize < (60 * 24 * 60 * 60 * 1000)) { // Less than 60 days per bucket
                labels.push(`${monthNames[bucketStart.getMonth()]} ${bucketStart.getFullYear().toString().slice(-2)}`);
            } else {
                labels.push(monthNames[bucketStart.getMonth()]);
            }
        }
        
        // Count decisions in each bucket
        dataSource.forEach(decision => {
            const decisionDate = new Date(decision.date);
            if (decisionDate >= startDate && decisionDate <= endDate) {
                const timeSinceStart = decisionDate - startDate;
                const bucketIndex = Math.min(
                    Math.floor(timeSinceStart / bucketSize),
                    bucketCount - 1
                );
                if (bucketIndex >= 0) {
                    buckets[bucketIndex]++;
                }
            }
        });
        
        return { buckets, labels };
    }
    
    _renderMiniPieChart(value, total, colors = ['var(--accent)', 'var(--border)'], showProportion = true) {
        if (total === 0) return html`<svg class="pie-chart" width="40" height="40" viewBox="0 0 40 40"></svg>`;
        
        let percentage;
        if (showProportion) {
            // For category charts: show what percentage this category represents of the total
            percentage = Math.min(100, Math.max(0, (value / total) * 100));
        } else {
            // For other charts: show filled based on the value itself
            percentage = Math.min(100, Math.max(0, value));
        }
        
        if (percentage === 0) {
            return html`
                <svg class="pie-chart" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="${colors[1]}" stroke="${colors[0]}" stroke-width="1" />
                </svg>
            `;
        }
        
        if (percentage === 100) {
            return html`
                <svg class="pie-chart" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="${colors[0]}" />
                </svg>
            `;
        }
        
        const angle = (percentage / 100) * 360;
        const radians = (angle - 90) * Math.PI / 180;
        const x = 20 + 18 * Math.cos(radians);
        const y = 20 + 18 * Math.sin(radians);
        
        const largeArcFlag = angle > 180 ? 1 : 0;
        const pathData = `M 20,20 L 20,2 A 18,18 0 ${largeArcFlag},1 ${x.toFixed(2)},${y.toFixed(2)} Z`;
        
        return html`
            <svg class="pie-chart" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="${colors[1]}" />
                <path d="${pathData}" fill="${colors[0]}" />
            </svg>
        `;
    }
    
    _renderTimeDistributionChart() {
        const { buckets, labels } = this._getTimeDistribution();
        if (buckets.length === 0) return html``;
        
        const maxCount = Math.max(...buckets);
        if (maxCount === 0) return html``;
        
        return html`
            <div class="time-distribution">
                <div class="time-distribution-title">Decision Activity Over Time</div>
                <div class="bar-chart">
                    ${buckets.map((count, index) => {
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return html`
                            <div 
                                class="bar" 
                                style="height: ${height}%"
                                title="${labels[index]}: ${count} decisions"
                            ></div>
                        `;
                    })}
                </div>
                <div class="time-labels">
                    <span>${labels[0] || ''}</span>
                    <span>${labels[Math.floor(labels.length / 2)] || ''}</span>
                    <span>${labels[labels.length - 1] || ''}</span>
                </div>
            </div>
        `;
    }

    render() {
        const categoryData = this._getIndividualCategoryData();
        const statusData = this._getStatusBreakdown();
        const dataSource = (this.filteredDecisions && this.filteredDecisions.length > 0) ? this.filteredDecisions : this.decisions;
        const totalDecisions = dataSource.length;
        
        // Category colors
        const categoryColors = {
            'Infrastructure': '#dc3545',
            'Developer Experience': '#28a745', 
            'UI/UX': '#6f42c1',
            'Architecture': '#fd7e14',
            'Process': '#20c997',
            'Quality': '#ffc107',
            'Integration': '#17a2b8',
            'Knowledge Management': '#007bff',
            'Other': '#6c757d'
        };
        
        // Status colors
        const statusColors = {
            'Accepted': '#28a745',
            'Superseded': '#6c757d',
            'Rejected': '#dc3545',
            'Proposed': '#ffc107'
        };
        
        return html`
            <div class="search-section">
                <input 
                    type="text" 
                    id="search-input" 
                    placeholder="Search decisions..."
                    @input=${this._handleInput}
                >
            </div>
            
            <div class="slider-section">
                <div class="slider-group">
                    <div class="slider-label">
                        <span>Impact Level</span>
                        <span class="slider-value">${this.filters.minImpact === 0 ? 'All' : `≥${this.filters.minImpact}`}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        .value=${this.filters.minImpact}
                        @input=${this._handleImpactChange}
                    >
                </div>
                
                ${this._renderTimeDistributionChart()}
                
                <div class="slider-group">
                    <div class="slider-label">
                        <span>Time Range</span>
                        <span class="slider-value">${this._getDateRangeLabel()}</span>
                    </div>
                    <div class="range-slider-container">
                        <div class="range-slider">
                            <div class="range-track" style="
                                left: ${(this.filters.dateRange.start / this._getMaxDaysFromOldestDecision()) * 100}%;
                                width: ${((this.filters.dateRange.end || this._getMaxDaysFromOldestDecision()) - this.filters.dateRange.start) / this._getMaxDaysFromOldestDecision() * 100}%;
                            "></div>
                            <input 
                                type="range" 
                                min="0" 
                                max="${this._getMaxDaysFromOldestDecision()}" 
                                .value=${this.filters.dateRange.start}
                                @input=${this._handleDateRangeStart}
                                style="z-index: 2;"
                            >
                            <input 
                                type="range" 
                                min="0" 
                                max="${this._getMaxDaysFromOldestDecision()}" 
                                .value=${this.filters.dateRange.end || this._getMaxDaysFromOldestDecision()}
                                @input=${this._handleDateRangeEnd}
                                style="z-index: 1;"
                            >
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="charts-section">
                <div class="charts-title">📊 Quick Stats</div>
                
                <div class="chart-section">
                    <div class="chart-section-title">Overview</div>
                    <div class="pie-charts">
                        <div class="pie-chart-item">
                            ${this._renderMiniPieChart(totalDecisions, this.decisions.length, ['var(--accent)', '#e9ecef'])}
                            <div class="chart-label">Decisions</div>
                            <div class="chart-value">${totalDecisions} of ${this.decisions.length}</div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-section">
                    <div class="chart-section-title">Categories</div>
                    <div class="pie-charts two-row">
                        ${categoryData.map(item => {
                            return html`
                                <div class="pie-chart-item ${item.count === 0 ? 'empty' : ''}" 
                                     @click=${item.count > 0 ? () => this._handleCategoryClick(item.category) : null}>
                                    ${this._renderMiniPieChart(item.count, totalDecisions, [categoryColors[item.category] || '#6c757d', '#e9ecef'])}
                                    <div class="chart-label">${item.category}</div>
                                    <div class="chart-value">${item.count} of ${totalDecisions}</div>
                                </div>
                            `;
                        })}
                    </div>
                </div>
                
                ${statusData.length > 0 ? html`
                    <div class="chart-section">
                        <div class="chart-section-title">Status</div>
                        <div class="pie-charts">
                            ${statusData.slice(0, 4).map(item => html`
                                <div class="pie-chart-item" @click=${() => this._handleStatusClick(item.status)}>
                                    ${this._renderMiniPieChart(item.count, totalDecisions, [statusColors[item.status] || '#6c757d', '#e9ecef'])}
                                    <div class="chart-label">${item.status}</div>
                                    <div class="chart-value">${item.count}</div>
                                </div>
                            `)}
                        </div>
                    </div>
                ` : ''}
                
                <div class="chart-section">
                    <div class="chart-section-title">Components</div>
                    <div class="pie-charts">
                        <div class="pie-chart-item">
                            ${this._renderMiniPieChart(dataSource.filter(d => d.affected_components?.length > 0).length, totalDecisions, ['#fd7e14', '#e9ecef'])}
                            <div class="chart-label">Has Components</div>
                            <div class="chart-value">${dataSource.filter(d => d.affected_components?.length > 0).length}</div>
                        </div>
                        <div class="pie-chart-item">
                            ${this._renderMiniPieChart(dataSource.filter(d => d.related_to?.length > 0).length, totalDecisions, ['#17a2b8', '#e9ecef'])}
                            <div class="chart-label">Has Relations</div>
                            <div class="chart-value">${dataSource.filter(d => d.related_to?.length > 0).length}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('search-panel', SearchPanel); 