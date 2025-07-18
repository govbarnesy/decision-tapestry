# Decision Tapestry Theme Guide

## Overview

The Decision Tapestry theming system provides a consistent, maintainable approach to styling across all components. It supports both light and dark modes with smooth transitions and accessibility features.

## Theme Files

1. **`theme-system.css`** - Core theme variables and patterns
2. **`gallery-theme-overrides.css`** - Gallery-specific theme enhancements
3. **`style.css`** - Main application styles (imports theme system)

## Using Theme Variables

### Colors

```css
/* Primary actions and highlights */
background: var(--color-primary);
color: var(--color-primary-hover);

/* Text hierarchy */
color: var(--text-primary);      /* Main text */
color: var(--text-secondary);    /* Secondary text */
color: var(--text-muted);        /* Muted/disabled text */

/* Backgrounds */
background: var(--background);         /* Main app background */
background: var(--panel-bg);          /* Panel/card backgrounds */
background: var(--hover-bg);          /* Hover states */
background: var(--selected-bg);       /* Selected states */

/* Status colors */
color: var(--color-success);     /* Success states */
color: var(--color-warning);     /* Warnings */
color: var(--color-error);       /* Errors */
color: var(--color-info);        /* Information */
```

### Spacing

```css
/* Consistent spacing scale */
padding: var(--spacing-sm);      /* 8px */
margin: var(--spacing-md);       /* 16px */
gap: var(--spacing-lg);          /* 24px */
```

### Typography

```css
/* Font families */
font-family: var(--font-family);      /* System fonts */
font-family: var(--font-family-mono); /* Monospace */

/* Font sizes */
font-size: var(--font-size-sm);       /* 0.875rem */
font-size: var(--font-size-base);     /* 1rem */
font-size: var(--font-size-lg);       /* 1.125rem */

/* Font weights */
font-weight: var(--font-weight-normal);    /* 400 */
font-weight: var(--font-weight-semibold);  /* 600 */
font-weight: var(--font-weight-bold);      /* 700 */
```

### Borders & Shadows

```css
/* Borders */
border: var(--border-width) solid var(--border-color);
border-radius: var(--border-radius-lg);

/* Shadows */
box-shadow: var(--shadow-sm);     /* Subtle */
box-shadow: var(--shadow-md);     /* Default */
box-shadow: var(--shadow-lg);     /* Elevated */
box-shadow: var(--shadow-xl);     /* Modal/dropdown */
```

## Component Patterns

### Card Pattern

```css
.my-card {
  background: var(--card-bg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.my-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Button Pattern

```css
.my-button {
  background: var(--color-primary);
  color: var(--text-inverse);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
}

.my-button:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}
```

### Input Pattern

```css
.my-input {
  background: var(--input-bg);
  color: var(--text-primary);
  border: var(--border-width-2) solid var(--border-color);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  transition: all var(--transition-base);
}

.my-input:focus {
  outline: none;
  border-color: var(--focus-border);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

## Dark Mode Support

The theme system automatically handles dark mode through:

1. **CSS Variables** - All colors adjust automatically
2. **System Preference** - Respects `prefers-color-scheme`
3. **Manual Toggle** - Via `.dark-theme` class on body

### Component Example

```css
/* Light mode (default) */
.my-component {
  background: var(--panel-bg);
  color: var(--text-primary);
}

/* Dark mode handled automatically via CSS variables */
/* No need for separate dark mode styles! */
```

### Special Dark Mode Overrides

For cases where you need different behavior in dark mode:

```css
body.dark-theme .my-special-component {
  /* Special dark mode styling */
  filter: brightness(0.8);
}
```

## Accessibility

### Focus States

```css
.my-interactive-element:focus-visible {
  outline: 2px solid var(--focus-border);
  outline-offset: 2px;
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .my-component {
    border-width: 2px;
    /* Enhanced contrast styles */
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .my-component {
    transition: none;
    animation: none;
  }
}
```

## Best Practices

1. **Always use theme variables** instead of hard-coded colors
2. **Test in both light and dark modes** during development
3. **Use semantic color names** (e.g., `--color-primary` not `--blue`)
4. **Maintain contrast ratios** for accessibility (WCAG AA minimum)
5. **Keep transitions smooth** but respect reduced motion preferences
6. **Use consistent spacing** via spacing variables
7. **Group related theme overrides** in component-specific sections

## Migration Guide

When updating existing components:

```css
/* Old */
background: #2196f3;
color: #666;
padding: 16px;

/* New */
background: var(--color-primary);
color: var(--text-secondary);
padding: var(--spacing-md);
```

## Adding New Theme Variables

Add new variables to `theme-system.css`:

```css
:root {
  /* Add to light theme section */
  --my-new-color: #123456;
}

body.dark-theme {
  /* Add dark mode version */
  --my-new-color: #654321;
}
```

## Testing Theme Changes

1. Toggle between light/dark modes using the theme button
2. Check all interactive states (hover, focus, active)
3. Verify contrast ratios using browser dev tools
4. Test with system dark mode preference
5. Check print styles if applicable

Remember: A well-themed component works seamlessly in any theme without component-specific theme code!