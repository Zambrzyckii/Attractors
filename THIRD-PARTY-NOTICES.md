# Third-party notices

This repository includes material from the projects below. Their licenses apply to that material, not to the rest of the repository, which is covered by [LICENSE](LICENSE).

## Minimal AgX implementation

- Source: https://iolite-engine.com/blog_posts/minimal_agx_implementation
- Used in: `src/engine/shaders/tonemap.glsl`
- License: MIT

The tone mapping takes the inset and outset matrices, the exposure range and the contrast polynomial from this implementation. Its author sourced the original values from Troy Sobotka's AgX, https://github.com/sobotka/AgX.

```text
MIT License

Copyright (c) 2024 Missing Deadlines (Benjamin Wrensch)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Fonts

- Newsreader, https://github.com/productiontype/Newsreader
- Spline Sans Mono, https://github.com/SorkinType/SplineSansMono
- STIX Two Text, https://github.com/stipub/stixfonts
- Used in: `public/fonts/`
- License: OFL-1.1

The copyright lines and the full SIL Open Font License 1.1 for all three fonts are in [public/fonts/OFL.txt](public/fonts/OFL.txt), which ships next to the font files.

## Bloom

The bloom downsample and upsample filters, with the Karis average on the first level, follow Jorge Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare", SIGGRAPH 2014.
