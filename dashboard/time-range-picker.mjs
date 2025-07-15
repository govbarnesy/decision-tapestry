import { LitElement, css, html } from 'https://esm.sh/lit@3';
import { 
    extractDate, 
    getAvailableDates,
    calculateTimeStatistics
} from '../utils/time-filtering-utils.mjs';

/**
 * Time range picker with commit awareness
 * @element time-range-picker
 * @fires range-change - Dispatched when the time range is changed
 */
class TimeRangePicker extends LitElement {
    static properties = {
        decisions: { type: Array },
        startDate: { type: String },
        endDate: { type: String },
        dateType: { type: String },
        showPresets: { type: Boolean },
        showHistogram: { type: Boolean }
    };
    
    constructor() {
        super();
        this.decisions = [];
        this.startDate = '';
        this.endDate = '';
        this.dateType = 'decision';
        this.showPresets = true;
        this.showHistogram = true;
    }
    
    static styles = css`
        :host {
            display: block;
            background: var(--panel-bg);
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .picker-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .picker-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-main);
        }
        
        .date-type-badge {
            font-size: 11px;
            padding: 2px 8px;
            background: rgba(0, 82, 204, 0.1);
            color: var(--accent);
            border-radius: 12px;
            font-weight: 500;
        }
        
        .picker-body {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .date-inputs {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 12px;
            align-items: center;
        }
        
        .date-input-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .input-label {
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .date-input {
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--panel-bg);
            color: var(--text-main);
            font-size: 13px;
            width: 100%;
            transition: all 0.2s ease;
        }
        
        .date-input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
        }
        
        .date-input:invalid {
            border-color: #dc3545;
        }
        
        .date-separator {
            color: var(--text-secondary);
            font-size: 14px;
            padding-top: 20px;
        }
        
        .presets-section {
            border-top: 1px solid var(--border);
            padding-top: 16px;
        }
        
        .presets-title {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .presets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 8px;
        }
        
        .preset-button {
            padding: 6px 12px;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--panel-bg);
            color: var(--text-main);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        }
        
        .preset-button:hover {
            border-color: var(--accent);
            background: rgba(0, 82, 204, 0.05);
        }
        
        .preset-button.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }
        
        .histogram-section {
            border-top: 1px solid var(--border);
            padding-top: 16px;
        }
        
        .histogram-title {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .histogram {
            height: 60px;
            display: flex;
            align-items: flex-end;
            gap: 2px;
            position: relative;
            padding: 0 4px;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 4px;
        }
        
        .histogram-bar {
            flex: 1;
            background: var(--accent);
            opacity: 0.3;
            border-radius: 2px 2px 0 0;
            transition: all 0.2s ease;
            min-height: 2px;
            position: relative;
        }
        
        .histogram-bar.in-range {
            opacity: 0.8;
            background: var(--accent);
        }
        
        .histogram-bar:hover {
            opacity: 1;
        }
        
        .histogram-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-4px);
            background: var(--panel-bg);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .histogram-bar:hover .histogram-tooltip {
            opacity: 1;
        }
        
        .range-summary {
            margin-top: 12px;
            padding: 8px 12px;
            background: rgba(0, 82, 204, 0.05);
            border-radius: 4px;
            font-size: 12px;
            color: var(--text-main);
            text-align: center;
            border: 1px solid rgba(0, 82, 204, 0.2);
        }
        
        .range-summary strong {
            color: var(--accent);
        }
        
        .apply-button {
            margin-top: 16px;
            padding: 10px 20px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        }
        
        .apply-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 82, 204, 0.3);
        }
        
        .apply-button:active {
            transform: translateY(0);
        }
        
        @media (max-width: 768px) {
            .date-inputs {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            
            .date-separator {
                display: none;
            }
            
            .presets-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;
    
    connectedCallback() {
        super.connectedCallback();
        this._initializeDates();
    }
    
    _initializeDates() {
        if (!this.startDate && !this.endDate && this.decisions.length > 0) {
            const stats = calculateTimeStatistics(this.decisions);
            if (stats.dateRange.earliest) {
                this.startDate = stats.dateRange.earliest.toISOString().split('T')[0];
            }
            if (stats.dateRange.latest) {
                this.endDate = stats.dateRange.latest.toISOString().split('T')[0];
            }
        }
    }
    
    _generateHistogramData() {
        if (!this.decisions || this.decisions.length === 0) {
            return { bars: [], maxCount: 0 };
        }
        
        // Get date range
        const stats = calculateTimeStatistics(this.decisions);
        if (!stats.dateRange.earliest || !stats.dateRange.latest) {
            return { bars: [], maxCount: 0 };
        }
        
        const startTime = stats.dateRange.earliest.getTime();
        const endTime = stats.dateRange.latest.getTime();
        const totalDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
        
        // Create buckets (max 50 bars)
        const bucketCount = Math.min(50, Math.max(10, Math.ceil(totalDays / 30)));
        const bucketSize = (endTime - startTime) / bucketCount;
        const buckets = new Array(bucketCount).fill(0);
        const bucketDates = [];
        
        // Count decisions in each bucket
        this.decisions.forEach(decision => {
            const date = extractDate(decision.date, this.dateType);
            if (date) {
                const bucketIndex = Math.floor((date.getTime() - startTime) / bucketSize);
                if (bucketIndex >= 0 && bucketIndex < bucketCount) {
                    buckets[bucketIndex]++;
                }
            }
        });
        
        // Generate bucket date labels
        for (let i = 0; i < bucketCount; i++) {
            const bucketStart = new Date(startTime + (i * bucketSize));
            const bucketEnd = new Date(startTime + ((i + 1) * bucketSize));
            bucketDates.push({ start: bucketStart, end: bucketEnd });
        }
        
        const maxCount = Math.max(...buckets);
        
        return {
            bars: buckets.map((count, index) => ({
                count,
                ...bucketDates[index],
                height: maxCount > 0 ? (count / maxCount) * 100 : 0
            })),
            maxCount
        };
    }
    
    _isBarInRange(bar) {
        if (!this.startDate && !this.endDate) return false;
        
        const rangeStart = this.startDate ? new Date(this.startDate) : null;
        const rangeEnd = this.endDate ? new Date(this.endDate) : null;
        
        if (rangeStart && bar.end < rangeStart) return false;
        if (rangeEnd && bar.start > rangeEnd) return false;
        
        return true;
    }
    
    _applyPreset(preset) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (preset) {
            case 'all': {
                const stats = calculateTimeStatistics(this.decisions);
                this.startDate = stats.dateRange.earliest ? stats.dateRange.earliest.toISOString().split('T')[0] : '';
                this.endDate = stats.dateRange.latest ? stats.dateRange.latest.toISOString().split('T')[0] : '';
                break;
            }
            case 'today':
                this.startDate = today.toISOString().split('T')[0];
                this.endDate = today.toISOString().split('T')[0];
                break;
            case 'week': {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                this.startDate = weekAgo.toISOString().split('T')[0];
                this.endDate = today.toISOString().split('T')[0];
                break;
            }
            case 'month': {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                this.startDate = monthAgo.toISOString().split('T')[0];
                this.endDate = today.toISOString().split('T')[0];
                break;
            }
            case 'quarter': {
                const quarterAgo = new Date(today);
                quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                this.startDate = quarterAgo.toISOString().split('T')[0];
                this.endDate = today.toISOString().split('T')[0];
                break;
            }
            case 'year': {
                const yearAgo = new Date(today);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                this.startDate = yearAgo.toISOString().split('T')[0];
                this.endDate = today.toISOString().split('T')[0];
                break;
            }
            case 'ytd': {
                const yearStart = new Date(today.getFullYear(), 0, 1);
                this.startDate = yearStart.toISOString().split('T')[0];
                this.endDate = today.toISOString().split('T')[0];
                break;
            }
        }
        
        this._emitRangeChange();
    }
    
    _getDecisionsInRange() {
        if (!this.startDate && !this.endDate) return this.decisions.length;
        
        const rangeStart = this.startDate ? new Date(this.startDate) : null;
        const rangeEnd = this.endDate ? new Date(this.endDate) : null;
        
        return this.decisions.filter(decision => {
            const date = extractDate(decision.date, this.dateType);
            if (!date) return false;
            
            if (rangeStart && date < rangeStart) return false;
            if (rangeEnd && date > rangeEnd) return false;
            
            return true;
        }).length;
    }
    
    _formatDateRange() {
        if (!this.startDate && !this.endDate) return 'All time';
        
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        
        if (this.startDate && this.endDate) {
            const start = new Date(this.startDate).toLocaleDateString('en-US', options);
            const end = new Date(this.endDate).toLocaleDateString('en-US', options);
            return `${start} - ${end}`;
        } else if (this.startDate) {
            const start = new Date(this.startDate).toLocaleDateString('en-US', options);
            return `From ${start}`;
        } else {
            const end = new Date(this.endDate).toLocaleDateString('en-US', options);
            return `Until ${end}`;
        }
    }
    
    _emitRangeChange() {
        this.dispatchEvent(new CustomEvent('range-change', {
            detail: {
                startDate: this.startDate,
                endDate: this.endDate,
                dateType: this.dateType
            },
            bubbles: true,
            composed: true
        }));
    }
    
    _renderHistogram() {
        const { bars, maxCount } = this._generateHistogramData();
        
        if (bars.length === 0) {
            return html`<div style="text-align: center; color: var(--text-secondary); font-size: 12px; padding: 20px;">
                No data to display
            </div>`;
        }
        
        return html`
            <div class="histogram">
                ${bars.map(bar => html`
                    <div 
                        class="histogram-bar ${this._isBarInRange(bar) ? 'in-range' : ''}"
                        style="height: ${bar.height}%"
                    >
                        <div class="histogram-tooltip">
                            ${bar.count} decision${bar.count !== 1 ? 's' : ''}<br>
                            ${bar.start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                `)}
            </div>
        `;
    }
    
    render() {
        const decisionsInRange = this._getDecisionsInRange();
        const totalDecisions = this.decisions.length;
        
        return html`
            <div class="picker-header">
                <h3 class="picker-title">Select Time Range</h3>
                <span class="date-type-badge">${this.dateType.replace('_', ' ')}</span>
            </div>
            
            <div class="picker-body">
                <div class="date-inputs">
                    <div class="date-input-group">
                        <label class="input-label" for="start-date">Start Date</label>
                        <input 
                            id="start-date"
                            type="date" 
                            class="date-input"
                            .value=${this.startDate}
                            @change=${(e) => {
                                this.startDate = e.target.value;
                                this._emitRangeChange();
                            }}
                        >
                    </div>
                    
                    <span class="date-separator">to</span>
                    
                    <div class="date-input-group">
                        <label class="input-label" for="end-date">End Date</label>
                        <input 
                            id="end-date"
                            type="date" 
                            class="date-input"
                            .value=${this.endDate}
                            @change=${(e) => {
                                this.endDate = e.target.value;
                                this._emitRangeChange();
                            }}
                        >
                    </div>
                </div>
                
                ${this.showPresets ? html`
                    <div class="presets-section">
                        <div class="presets-title">Quick Presets</div>
                        <div class="presets-grid">
                            <button class="preset-button" @click=${() => this._applyPreset('all')}>
                                All Time
                            </button>
                            <button class="preset-button" @click=${() => this._applyPreset('today')}>
                                Today
                            </button>
                            <button class="preset-button" @click=${() => this._applyPreset('week')}>
                                Last 7 Days
                            </button>
                            <button class="preset-button" @click=${() => this._applyPreset('month')}>
                                Last Month
                            </button>
                            <button class="preset-button" @click=${() => this._applyPreset('quarter')}>
                                Last Quarter
                            </button>
                            <button class="preset-button" @click=${() => this._applyPreset('year')}>
                                Last Year
                            </button>
                            <button class="preset-button" @click=${() => this._applyPreset('ytd')}>
                                Year to Date
                            </button>
                        </div>
                    </div>
                ` : ''}
                
                ${this.showHistogram ? html`
                    <div class="histogram-section">
                        <div class="histogram-title">Decision Distribution</div>
                        ${this._renderHistogram()}
                    </div>
                ` : ''}
                
                <div class="range-summary">
                    <strong>${decisionsInRange}</strong> of <strong>${totalDecisions}</strong> decisions 
                    in range: ${this._formatDateRange()}
                </div>
                
                <button class="apply-button" @click=${this._emitRangeChange}>
                    Apply Time Range
                </button>
            </div>
        `;
    }
}

customElements.define('time-range-picker', TimeRangePicker);

export { TimeRangePicker };