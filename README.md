# CHAR/ISMA: ASCII & Pixel Art Generator

## Overview

**CHAR/ISMA** is a simple yet powerful web application that transforms images, videos, and webcam footage into ASCII and pixel art. Designed with a distinctive brutalist aesthetic, it allows users to create unique visual art from any multimedia content.

[Explore CHAR/ISMA now in Vercel](https://char-isma.vercel.app/)

## Key Features

- **Multiple Input Sources**: Process images, videos, and real-time webcam feeds
- **Customizable Output**: Control characters, colors, and resolution
- **Three Rendering Styles**: Character-based, icon-based, and gradient-based
- **Live Processing**: See changes in real-time
- **Recording**: Capture and save your creations as videos
- **Frame Export**: Save static images at any point

## How It Works

CHAR/ISMA analyzes the brightness values of your source media and maps them to different representations based on your settings. Dark areas become one style (background), while light areas become another (elements).

## Getting Started

### 1. Select a Source
- Upload an image or video
- Use your webcam for real-time effects

### 2. Configure Styles
- **For dark areas (Background)**:
  - Choose a character, icon, or gradient
  - Set colors and properties
- **For light areas (Elements)**:
  - Same options as dark areas

### 3. Adjust Parameters
- Set grid resolution (columns and rows)
- Adjust brightness threshold
- Customize colors

### 4. Process and Export
- Apply effects
- Play/pause for video content
- Record output
- Capture frames

## Examples

### Character Mode
Perfect for classic ASCII art. Try using:
- `#` and `.` for high contrast
- `0` and `1` for a binary look
- Custom characters for unique styles

### Icon Mode
Upload custom icons to replace characters:
- Emoji for playful results
- Simple shapes for abstract patterns
- Logo elements for branded content

### Gradient Mode
Create colorful flowing designs:
- Set complementary colors for vibrant results
- Use similar colors for subtle effects
- Experiment with different directions

## Tips & Tricks

- **Resolution Balance**: Higher resolution (more rows/columns) gives more detail but smaller elements
- **Contrast Matters**: Images with good contrast produce better results
- **Threshold Experimentation**: Small changes to the threshold can dramatically alter the output
- **Style Inversion**: Try swapping light/dark styles for surprising effects
- **Character Selection**: Dense characters (`@`, `#`, `8`) work well for dark areas, while lighter ones (`.`, `,`, `'`) work for light areas

## Technical Requirements

- Modern web browser (Chrome, Firefox, Edge recommended)
- Camera access for webcam features
- No installation needed - runs entirely in browser

## Limitations

- Processing speed depends on your device's capabilities
- Some video formats may not be supported in all browsers
- High-resolution outputs may be resource-intensive

## About the Project

CHAR/ISMA was created by SammyCabello as an exploration of digital art forms and the aesthetic possibilities of reinterpreting visual media. The name is a play on "charisma" and the core elements it uses: **CHAR**acters and **I**mages/**S**ymbols/**M**edia/**A**rt.

Built with vanilla JavaScript, HTML5 Canvas, and CSS, it demonstrates how powerful creative tools can be constructed using standard web technologies.

## Installation

```bash
# Clone the repository
git clone https://github.com/sammytsukino/char-isma.git

# Navigate to the project directory
cd char-isma

# No build process required - open index.html in your browser
# or use a local server:
python -m http.server
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is available under the MIT License. See the LICENSE file for details.

## Acknowledgments

- Inspired by classic ASCII art techniques
- Special thanks to the open-source community
- Crafted with ❤️ by SAMMYCABELLO
