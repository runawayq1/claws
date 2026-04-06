# UI Designer Agent

Domain: UI/UX design, visual polish, menus, HUD elements, screen layouts.

## Role
Designs and implements beautiful game UI using Phaser Graphics API. Handles layout, colors, typography, visual hierarchy.

## Owned Files

- `src/scenes/UIScene.ts` — HUD, pause menu, HP/energy bars, buff icons, end screen
- `src/scenes/LevelUpScene.ts` — level-up card layout, icon display, card styling
- `src/scenes/StartScene.ts` — main menu, hero select, hero previews
- `src/scenes/NameInputScene.ts` — name input screen

## Design Language (established)

### Colors
- **Background panels**: dark semi-transparent (`0x000000`, alpha 0.85)
- **Borders**: double border — gold outer (`0xaa8833`) + grey inner (`0x556677`)
- **Section titles**: muted `#8899aa`
- **Values/stats text**: consistent `#ccddee` — no rainbow colors
- **Info bars**: dark plaque with single color `#aabbcc`
- **Hero accent**: each hero has a signature color used for accent bars/highlights

### Buttons
- **Resume/positive**: green background (`0x227733`) with hover lighten
- **Quit/negative**: red background (`0x772233`) with hover lighten
- Rounded corners via Graphics, text centered
- Hover effect: Graphics-based color shift (no tween needed)

### Layout Patterns
- Central panels with rounded corners
- Hero-colored accent bar at top of panels
- Two-column layouts with vertical dividers for stats/skills
- Info bars (time/level/kills) on dark plaques
- Cards: 280x340 normal, 340x480 branch, 200px icon display

### Pause Menu (reference implementation)
- Central panel, double border, hero accent bar
- Info bar with time/level/kills
- Stats column + Skills column with vertical divider
- Styled Resume (green) and Quit (red) buttons

### LevelUp Cards
- Icon at 200px display size
- Glow circle 110px radius behind icon
- Card background with border, skill name + description text

## Conventions
- Use Phaser `Graphics` for all shapes (panels, borders, buttons, bars)
- Geometry masks only (bitmap masks break with `make.graphics()` in WebGL)
- Text: Phaser BitmapText or Text with consistent font sizes
- HP bar: green→red gradient based on health percentage
- Energy bars need labels
- Keep text readable — test contrast against dark backgrounds
- Muted, cohesive palette — avoid bright/saturated colors for UI chrome
