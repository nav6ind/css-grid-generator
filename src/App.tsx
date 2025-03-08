import { useState, useCallback, useEffect, DragEvent, MouseEvent } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import './App.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface GridItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  color: string // Make color required
}

interface GridConfig {
  columns: number
  rows: number
  gap: number
  borderRadius: number // Add this
  items: GridItem[]
}

interface GeneratedCode {
  css: string;
  html: string;
  cssFilename: string;
  htmlFilename: string;
}

interface ColorPalette {
  name: string;
  color: string;
}

const DEFAULT_COLORS: ColorPalette[] = [
  { name: 'Gray', color: '#333333' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Purple', color: '#8b5cf6' },
];

const STORAGE_KEY = 'grid-generator-state';

// Add this helper function before the App component
const getMaxId = (items: GridItem[]): number => {
  return Math.max(...items.map(item => {
    const numId = parseInt(item.i);
    return isNaN(numId) ? 0 : numId;
  }), 0);
};

function App() {
  const initialConfig: GridConfig = {
    columns: 4,
    rows: 3,
    gap: 10,
    borderRadius: 8, // Add this
    items: [
      { i: '1', x: 0, y: 0, w: 1, h: 1, color: '#333333' },
      { i: '2', x: 1, y: 0, w: 1, h: 1, color: '#333333' },
    ]
  };

  const [gridConfig, setGridConfig] = useState<GridConfig>(initialConfig);
  const [history, setHistory] = useState<GridConfig[]>([])
  const [future, setFuture] = useState<GridConfig[]>([])
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({
    css: '',
    html: '',
    cssFilename: 'grid-layout.css',
    htmlFilename: 'grid-layout.html'
  });

  const findEmptyPosition = useCallback(() => {
    const occupiedPositions = new Set(
      gridConfig.items.flatMap(item => {
        const positions = [];
        for (let x = item.x; x < item.x + item.w; x++) {
          for (let y = item.y; y < item.y + item.h; y++) {
            positions.push(`${x},${y}`);
          }
        }
        return positions;
      })
    );

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < gridConfig.columns; x++) {
        if (!occupiedPositions.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  }, [gridConfig]);

  const addItem = () => {
    const position = findEmptyPosition();
    const newItem = {
      i: String(gridConfig.items.length + 1),
      ...position,
      w: 1,
      h: 1,
      color: '#333333' // Initialize with default color
    };
    setGridConfig(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleColorChange = (itemId: string, color: string) => {
    setGridConfig(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.i === itemId ? { 
          ...item, 
          color: color
        } : item
      )
    }));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, color: string) => {
    e.dataTransfer.setData('color', color);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, itemId: string) => {
    e.preventDefault();
    const color = e.dataTransfer.getData('color');
    handleColorChange(itemId, color);
  };

  useEffect(() => {
    const css = `/* Base Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Full viewport setup */
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  min-height: 100dvh; /* For mobile browsers */
  overflow-x: hidden;
}

/* Main container */
.container {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: grid;
  grid-template-rows: 1fr;
}

/* Grid Container */
.grid-container {
  display: grid;
  grid-template-columns: repeat(${gridConfig.columns}, minmax(0, 1fr));
  gap: ${gridConfig.gap}px;
  padding: max(16px, 2vw);
  width: 100%;
  height: 100%;
  align-content: stretch;
  justify-content: stretch;
}

/* Grid Items */
${gridConfig.items.map(item => `
.grid-item-${item.i} {
  grid-column: ${item.x + 1} / span ${item.w};
  grid-row: ${item.y + 1} / span ${item.h};
  background: ${item.color || 'var(--item-bg, #ffffff)'};
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
  border-radius: ${gridConfig.borderRadius}px;
  overflow: hidden; /* Add this to ensure content respects border radius */
  
  /* Ensure items fill their space */
  height: 100%;
  min-height: 100%;
  
  /* Content layout */
  display: flex;
  flex-direction: column;
  padding: clamp(1rem, 2vw, 2rem);
}`).join('\n')}

/* Item Content */
.grid-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  height: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: ${Math.max(8, gridConfig.gap/2)}px;
  }
}

/* Theme variables */
:root {
  --item-bg: #ffffff;
  
  @media (prefers-color-scheme: dark) {
    --item-bg: #2a2a2a;
  }
}`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grid Layout</title>
    <link rel="stylesheet" href="grid-layout.css">
</head>
<body>
    <div class="container">
        <div class="grid-container">
${gridConfig.items.map(item => 
            `            <div class="grid-item-${item.i}">
                <div class="grid-item-content">
                    <h2>Item ${item.i}</h2>
                    <p>${item.w}×${item.h}</p>
                </div>
            </div>`
).join('\n')}
        </div>
    </div>
</body>
</html>`;

    setGeneratedCode({ 
      css,
      html,
      cssFilename: 'grid-layout.css',
      htmlFilename: 'grid-layout.html'
    });
  }, [gridConfig]);

  const handleGridChange = useCallback((layout: GridItem[]) => {
    if (!Array.isArray(layout)) return;
    
    const updatedItems = layout.map(item => {
      // Find the existing item to preserve its color
      const existingItem = gridConfig.items.find(i => i.i === item.i);
      return {
        ...item,
        x: Math.max(0, item.x),
        y: Math.max(0, item.y),
        w: Math.max(1, item.w),
        h: Math.max(1, item.h),
        color: existingItem?.color || '#333333' // Preserve color
      };
    });

    setHistory(prev => [...prev, gridConfig]);
    setGridConfig(prev => ({ ...prev, items: updatedItems }));
    setFuture([]);
  }, [gridConfig]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setFuture(prev => [gridConfig, ...prev]);
    setHistory(newHistory);
    setGridConfig(previousState);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const nextState = future[0];
    const newFuture = future.slice(1);
    setHistory(prev => [...prev, gridConfig]);
    setFuture(newFuture);
    setGridConfig(nextState);
  };

  const handleReset = () => {
    setHistory(prev => [...prev, gridConfig]);
    setFuture([]);
    setGridConfig(initialConfig);
  };

  const [selectedColor, setSelectedColor] = useState('#333333');

  // Load state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGridConfig(parsed.gridConfig);
        setSelectedColor(parsed.selectedColor);
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      gridConfig,
      selectedColor
    }));
  }, [gridConfig, selectedColor]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'z': 
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case 'y': handleRedo(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleUndo, handleRedo]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="grid-generator">
      <header>
        <h1>CSS Grid Generator</h1>
        <div className="controls-container">
          <div className="controls-section">
            <h4>Grid Settings</h4>
            <div className="controls">
              <div className="control-group">
                <label>Columns</label>
                <input
                  type="number"
                  value={gridConfig.columns}
                  onChange={e => setGridConfig(prev => ({
                    ...prev,
                    columns: parseInt(e.target.value) || 1
                  }))}
                  min="1"
                  max="12"
                />
                <span className="input-hint">1-12 columns</span>
              </div>
              <div className="control-group">
                <label>Gap</label>
                <input
                  type="number"
                  value={gridConfig.gap}
                  onChange={e => setGridConfig(prev => ({
                    ...prev,
                    gap: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="50"
                />
                <span className="input-hint">0-50 pixels</span>
              </div>
              <div className="control-group">
                <label>Rounded Corners</label>
                <input
                  type="number"
                  value={gridConfig.borderRadius}
                  onChange={e => setGridConfig(prev => ({
                    ...prev,
                    borderRadius: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="50"
                />
                <span className="input-hint">0-50 pixels</span>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <h4>Actions</h4>
            <div className="controls">
              <button onClick={addItem} className="button primary">
                <span className="icon">+</span>
                Add Item
              </button>
              <button 
                onClick={handleUndo}
                disabled={!history.length}
                className="button secondary"
              >
                <span className="icon">↩</span>
                Undo
              </button>
              <button 
                onClick={handleRedo}
                disabled={!future.length}
                className="button secondary"
              >
                <span className="icon">↪</span>
                Redo
              </button>
              <button 
                onClick={handleReset}
                className="button warning"
              >
                <span className="icon">↺</span>
                Reset
              </button>
            </div>
          </div>

          <div className="controls-section">
            <h4>Colors</h4>
            <div className="color-palette">
              {DEFAULT_COLORS.map((paletteColor) => (
                <button
                  key={paletteColor.color}
                  className="color-swatch"
                  style={{ backgroundColor: paletteColor.color }}
                  onClick={() => setSelectedColor(paletteColor.color)}
                  title={paletteColor.name}
                />
              ))}
            </div>
            <div className="control-instructions">
              <ol>
                <li>First, click on any grid item you want to color</li>
                <li>Then either:
                  <ul>
                    <li>Use the color picker to select a color</li>
                    <li>Or drag the color preview box onto any grid item</li>
                  </ul>
                </li>
                <li>The selected item will update with your chosen color</li>
              </ol>
            </div>
            <div className="color-controls">
              <div className="custom-color-container">
                <div className="color-tool">
                  <label>Pick Color</label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="custom-color-picker"
                    title="Choose a color"
                  />
                </div>
                <div className="color-tool">
                  <label>Drag to Apply</label>
                  <div
                    className="custom-color-preview"
                    style={{ backgroundColor: selectedColor }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, selectedColor)}
                    title="Drag this color to any grid item"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid-preview">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: gridConfig.items }}
          breakpoints={{ lg: 1200 }}
          cols={{ lg: gridConfig.columns }}
          rowHeight={100}
          containerPadding={[20, 20]}
          margin={[gridConfig.gap, gridConfig.gap]}
          onLayoutChange={handleGridChange}
          isDraggable
          isResizable
          compactType={null}
          preventCollision
          maxRows={20}
          useCSSTransforms={true}
        >
          {gridConfig.items.map(item => (
            <div 
              key={item.i} 
              data-id={item.i}
              className="grid-item"
              style={{ 
                backgroundColor: item.color,
                borderRadius: `${gridConfig.borderRadius}px`
              }}
              tabIndex={0}
              onDrop={(e) => handleDrop(e, item.i)}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="grid-item-content">
                <span>Item {item.i}</span>
                <div className="grid-item-info">
                  {item.w}×{item.h} at ({item.x}, {item.y})
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      <div className="code-output">
        <div className="code-section">
          <div className="code-header">
            <h3>CSS</h3>
            <div className="code-actions">
              <button onClick={() => copyToClipboard(generatedCode.css)}>
                Copy
              </button>
              <button onClick={() => {
                const blob = new Blob([generatedCode.css], { type: 'text/css' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = generatedCode.cssFilename;
                a.click();
                URL.revokeObjectURL(url);
              }}>Download</button>
            </div>
          </div>
          <pre>{generatedCode.css}</pre>
        </div>
        <div className="code-section">
          <div className="code-header">
            <h3>HTML</h3>
            <div className="code-actions">
              <button onClick={() => copyToClipboard(generatedCode.html)}>
                Copy
              </button>
              <button onClick={() => {
                const blob = new Blob([generatedCode.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = generatedCode.htmlFilename;
                a.click();
                URL.revokeObjectURL(url);
              }}>Download</button>
            </div>
          </div>
          <pre>{generatedCode.html}</pre>
        </div>
      </div>
    </div>
  )
}

export default App
