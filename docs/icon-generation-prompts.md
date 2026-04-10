# Icon Generation Prompts — DALL-E Archive

> Archive of DALL-E prompts used to generate the skill icon spritesheet for CLAWS.
> Spritesheet: `public/assets/icons/skill_icons_sheet.png` (1280×1280, 10×10 grid).
> After adding new frames, update `ICON_FRAME_MAP` in `src/systems/UpgradeSystem.ts`.

## Guidelines

- **Style**: 128x128 pixel art RPG skill icon, 32-bit retro style
- **Generic skills**: Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel
- **Hero-specific (personal) skills**: Ornate colored pixel border frame matching the hero/branch color theme — each hero and branch has unique frame colors and stud shapes
- **Base structure**: `128x128 pixel art RPG skill icon, 32-bit retro style. [FRAME DESCRIPTION]. Inside the frame on a solid black background: [CONTENT]. Bold silhouette, high contrast, limited palette 5-6 colors, slight [COLOR] inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the [gray/gold] frame.`
- DALL-E generations: request 1024x1024 and resize to 128x128 after

---

## Generic Skills

All generic icons use a **stone-gray pixel border frame** — light gray #999999 outer edge, darker gray #555555 inner bevel, small round rivets in corners.

### Sharp Edge (g1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: a gleaming steel sword edge in close-up, sharp cutting blade catching blue-white light with faint motion lines. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Swift Feet (g2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: armored boots mid-stride with cyan speed-trail arcs behind them and a wind swirl at the ankles. Bold silhouette, high contrast, limited palette 5-6 colors, slight cyan inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Eagle Eye (g3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: a single large eagle eye with amber iris and a crosshair targeting reticle overlaid, gold rim-light. Bold silhouette, high contrast, limited palette 5-6 colors, slight amber inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Quick Hands (g4)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: two gauntleted fists in rapid alternating strikes with motion-blur afterimages and green speed lines. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Vitality (g5)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: a large stylized heart glowing with crimson inner light, amber energy veins radiating from center. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Regeneration (g6)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: a caduceus healing symbol wreathed in green wisps with leaf-like particle sparks drifting upward. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Cleave (g7)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: a heavy axe blade mid-swing with a wide silver cleave arc energy trail and crimson impact sparks at the cutting edge. Bold silhouette, high contrast, limited palette 5-6 colors, slight silver inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Wisdom (g8)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: an ancient tome floating open with violet arcane runes hovering above its pages, magical light from the spine. Bold silhouette, high contrast, limited palette 5-6 colors, slight violet inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Multistrike (g9)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: three overlapping sword-slash arcs in rapid succession, each offset in angle with yellow-white blade trails fading behind them. Bold silhouette, high contrast, limited palette 5-6 colors, slight yellow inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

### Iron Skin (g10)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Simple stone-gray pixel border frame with small round rivets in corners, light gray #999999 outer edge, darker gray #555555 inner bevel. Inside the frame on a solid black background: a torso covered in riveted iron plates, steel-grey with a faint blue defensive shimmer outlining the edge and small cracks revealing the hardness within. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the gray frame.

---

## Ignara Skills

Ignara is a fire mage — consecration, divine fire, wrath. Each branch has 3 regular skills + 1 ultimate.
Ignara skills use **branch-colored frames** — Inferno (fire-red #CC3300), Fortress (ember-orange #CC6600), Havoc (crimson #FF4400).

### Inferno Branch

#### Wide Burn (if1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate fire-red pixel border frame with small flame-shaped studs in corners, fire-red #CC3300 outer edge, darker #882200 inner bevel. Inside the frame on a solid black background: a fireball explosion with a wide circular blast ring expanding outward, deep orange and burnt-amber fire with a visible heat-wave radius ring. Bold silhouette, high contrast, limited palette 5-6 colors, slight orange inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the fire-red frame.

#### Inferno Reach (if2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate fire-red pixel border frame with small flame-shaped studs in corners, fire-red #CC3300 outer edge, darker #882200 inner bevel. Inside the frame on a solid black background: a fireball stretched long with a fiery comet tail showing extreme range, deep orange with a bright ember core fading to smoke. Bold silhouette, high contrast, limited palette 5-6 colors, slight orange inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the fire-red frame.

#### White Fire (if3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate fire-red pixel border frame with small flame-shaped studs in corners, fire-red #CC3300 outer edge, darker #882200 inner bevel. Inside the frame on a solid black background: a fireball with a white-hot core radiating outward to orange then dark-edged smoke, supernatural heat beyond normal flame. Bold silhouette, high contrast, limited palette 5-6 colors, slight white inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the fire-red frame.

#### Firestorm (if5) — ULTIMATE
Unlocks when Wide Burn, Inferno Reach, and White Fire are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate fire-red pixel border frame with small flame-shaped studs in corners, fire-red #CC3300 outer edge, darker #882200 inner bevel. Inside the frame on a solid black background: a central fireball flanked by two smaller satellite fire orbs orbiting it, swirling flame arcs connecting all three. Bold silhouette, high contrast, limited palette 5-6 colors, slight orange inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the fire-red frame.

### Fortress Branch

#### Heat Shield (io1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ember-orange pixel border frame with small shield-shaped studs in corners, ember-orange #CC6600 outer edge, darker #884400 inner bevel. Inside the frame on a solid black background: a round shield forged from volcanic red metal with heat shimmer waves radiating off its surface, faint orange glow at the rim. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ember-orange frame.

#### Pyromaniac (io2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ember-orange pixel border frame with small shield-shaped studs in corners, ember-orange #CC6600 outer edge, darker #884400 inner bevel. Inside the frame on a solid black background: a smoldering skull wreathed in dark red flames with a small green HP orb rising from its crown, crimson fire with a single vivid emerald spark. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ember-orange frame.

#### Molten Skin (io3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ember-orange pixel border frame with small shield-shaped studs in corners, ember-orange #CC6600 outer edge, darker #884400 inner bevel. Inside the frame on a solid black background: a humanoid silhouette with cracked skin revealing molten lava beneath, a reactive AoE burst ring expanding outward, red-orange with dark obsidian outer surface. Bold silhouette, high contrast, limited palette 5-6 colors, slight orange inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ember-orange frame.

#### Phoenix Heart (io5) — ULTIMATE
Unlocks when Heat Shield, Pyromaniac, and Molten Skin are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ember-orange pixel border frame with small shield-shaped studs in corners, ember-orange #CC6600 outer edge, darker #884400 inner bevel. Inside the frame on a solid black background: a radiant phoenix rising from flames with a glowing heart at its chest, red-orange wings spread wide with a warm gold revival aura at the core. Bold silhouette, high contrast, limited palette 5-6 colors, slight gold inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ember-orange frame.

### Havoc Branch

#### Backdraft (ih1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crimson pixel border frame with small spike-shaped studs in corners, crimson #FF4400 outer edge, darker #AA2200 inner bevel. Inside the frame on a solid black background: a fireball with a massive concussive shockwave ring blasting backward, amber-orange fire with fierce concentric blast-wave rings. Bold silhouette, high contrast, limited palette 5-6 colors, slight amber inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crimson frame.

#### Eruption (ih2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crimson pixel border frame with small spike-shaped studs in corners, crimson #FF4400 outer edge, darker #AA2200 inner bevel. Inside the frame on a solid black background: a volcanic eruption bursting upward from the ground with columns of fire and lava, amber-orange with dark ash clouds rising alongside. Bold silhouette, high contrast, limited palette 5-6 colors, slight amber inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crimson frame.

#### Lava Trail (ih3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crimson pixel border frame with small spike-shaped studs in corners, crimson #FF4400 outer edge, darker #AA2200 inner bevel. Inside the frame on a solid black background: glowing lava footprints trailing behind a striding figure, molten ground pools dripping orange-red in each print. Bold silhouette, high contrast, limited palette 5-6 colors, slight orange inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crimson frame.

#### Meltdown (ih5) — ULTIMATE
Unlocks when Backdraft, Eruption, and Lava Trail are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crimson pixel border frame with small spike-shaped studs in corners, crimson #FF4400 outer edge, darker #AA2200 inner bevel. Inside the frame on a solid black background: a crumbling warrior glowing molten from within, deep cracks blazing orange-red while the outer shell crumbles in dark amber. Bold silhouette, high contrast, limited palette 5-6 colors, slight orange inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crimson frame.

---

## Nazar Skills

Nazar is a shadow assassin — stealth, poison, shadow strikes. Each branch has 3 regular skills + 1 ultimate.
Nazar skills use **branch-colored frames** — Blade (dark-red #882222), Venom (poison-green #228822), Shadow (dark-purple #442266).

### Way of the Blade Branch

#### Shadow Step (nb1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-red pixel border frame with small dagger-shaped studs in corners, dark-red #882222 outer edge, darker #551111 inner bevel. Inside the frame on a solid black background: a shadowy figure blinking forward with a dark afterimage trail left behind, silver-white with dark shadow blur fading at the origin. Bold silhouette, high contrast, limited palette 5-6 colors, slight silver inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-red frame.

#### Twin Blades (nb2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-red pixel border frame with small dagger-shaped studs in corners, dark-red #882222 outer edge, darker #551111 inner bevel. Inside the frame on a solid black background: two crossed daggers with overlapping motion-blur arcs showing rapid dual strikes, silver blades with faint white metallic sheen and slash trails. Bold silhouette, high contrast, limited palette 5-6 colors, slight silver inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-red frame.

#### Blade Surge (nb3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-red pixel border frame with small dagger-shaped studs in corners, dark-red #882222 outer edge, darker #551111 inner bevel. Inside the frame on a solid black background: a dagger lunging in a straight piercing line cutting through two enemy silhouettes, silver with a thin white energy line tracing the path. Bold silhouette, high contrast, limited palette 5-6 colors, slight silver inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-red frame.

#### Assassinate (nb5) — ULTIMATE
Unlocks when Shadow Step, Twin Blades, and Blade Surge are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-red pixel border frame with small dagger-shaped studs in corners, dark-red #882222 outer edge, darker #551111 inner bevel. Inside the frame on a solid black background: a single dagger poised over a lone enemy silhouette with a cold white execution-glow targeting highlight on the target. Bold silhouette, high contrast, limited palette 5-6 colors, slight silver inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-red frame.

### Way of Venom Branch

#### Toxic Slash (nv1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate poison-green pixel border frame with small skull-shaped studs in corners, poison-green #228822 outer edge, darker #114411 inner bevel. Inside the frame on a solid black background: a blade dripping green venom mid-slash with a toxic puddle splash forming below, silver blade with a sickly green puddle. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the poison-green frame.

#### Virulent Strain (nv2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate poison-green pixel border frame with small skull-shaped studs in corners, poison-green #228822 outer edge, darker #114411 inner bevel. Inside the frame on a solid black background: an enlarged poison cloud spreading wider with spore particles drifting outward, olive-green haze with yellow-green spores at the edges. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the poison-green frame.

#### Pandemic (nv3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate poison-green pixel border frame with small skull-shaped studs in corners, poison-green #228822 outer edge, darker #114411 inner bevel. Inside the frame on a solid black background: a skull-shaped green cloud splitting into two smaller satellite clouds, dark green with small secondary cloud wisps branching outward. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the poison-green frame.

#### Necrosis (nv5) — ULTIMATE
Unlocks when Toxic Slash, Virulent Strain, and Pandemic are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate poison-green pixel border frame with small skull-shaped studs in corners, poison-green #228822 outer edge, darker #114411 inner bevel. Inside the frame on a solid black background: rotting tissue with poison ticks brightening with each successive tick, dark green fading to near-black necrotic patches with intensifying toxic sparks at center. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the poison-green frame.

### Way of Shadow Branch

#### Vanish (ns1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-purple pixel border frame with small crescent studs in corners, dark-purple #442266 outer edge, darker #221133 inner bevel. Inside the frame on a solid black background: a figure dissolving into dark purple shadow, a fading translucent silhouette with shadow wisps, deep purple near-invisibility. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-purple frame.

#### Phantom Trail (ns2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-purple pixel border frame with small crescent studs in corners, dark-purple #442266 outer edge, darker #221133 inner bevel. Inside the frame on a solid black background: a running figure leaving dark shadow afterimages behind it, purple and charcoal grey shadow clones with faint damage sparks at their edges. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-purple frame.

#### Smoke Bomb (ns3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-purple pixel border frame with small crescent studs in corners, dark-purple #442266 outer edge, darker #221133 inner bevel. Inside the frame on a solid black background: a round smoke bomb exploding into a spreading purple-grey cloud with a swirling deceleration spiral within the smoke. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-purple frame.

#### Death Mark (ns5) — ULTIMATE
Unlocks when Vanish, Phantom Trail, and Smoke Bomb are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate dark-purple pixel border frame with small crescent studs in corners, dark-purple #442266 outer edge, darker #221133 inner bevel. Inside the frame on a solid black background: a glowing purple rune branded onto a target silhouette, the mark pulsing with a double-strike arrow glyph overlaid. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the dark-purple frame.

---

## Sifra Skills

Sifra is an ice/frost mage with an alternate lightning path. Each branch has 3 regular skills + 1 ultimate.
Sifra skills use **branch-colored frames** — Lightning (electric-purple #7744CC), Frost (frost-blue #3388CC), Shatter (ice-blue #4499BB), Crystal (ice-white #AAEEFF).

### Lightning Branch

#### Spark Initiate (sl1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate electric-purple pixel border frame with small lightning-bolt studs in corners, electric-purple #7744CC outer edge, darker #553388 inner bevel. Inside the frame on a solid black background: a crackling electric cone chaining to a second nearby enemy, forked lightning arc bridging two targets, violet and pale blue-white lightning. Bold silhouette, high contrast, limited palette 5-6 colors, slight violet inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the electric-purple frame.

#### Arc Reach (sl2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate electric-purple pixel border frame with small lightning-bolt studs in corners, electric-purple #7744CC outer edge, darker #553388 inner bevel. Inside the frame on a solid black background: a wide broadened arc of electricity fanning outward with lateral side-bolts spreading the cone, violet with pale electric arcs at the wide fringes. Bold silhouette, high contrast, limited palette 5-6 colors, slight violet inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the electric-purple frame.

#### Overcharge (sl3)
Lvl 3 unlocks Ball Lightning orbit.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate electric-purple pixel border frame with small lightning-bolt studs in corners, electric-purple #7744CC outer edge, darker #553388 inner bevel. Inside the frame on a solid black background: a blinding electrical overload burst with a central white flash, violet outer ring fading to near-white explosive core. Bold silhouette, high contrast, limited palette 5-6 colors, slight violet inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the electric-purple frame.

#### Storm Lord (sl5) — ULTIMATE
Unlocks when Spark Initiate, Arc Reach, and Overcharge are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate electric-purple pixel border frame with small lightning-bolt studs in corners, electric-purple #7744CC outer edge, darker #553388 inner bevel. Inside the frame on a solid black background: a storm deity silhouette wreathed in lightning hurling a massive bolt downward at a target, violet with a commanding white thunder-bolt and faint storm-crown. Bold silhouette, high contrast, limited palette 5-6 colors, slight violet inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the electric-purple frame.

### Frost Branch

#### Deep Freeze (sf1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate frost-blue pixel border frame with small snowflake studs in corners, frost-blue #3388CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: an enemy encased in a solid block of ice with frost shards radiating outward, sky blue and white with thick crystalline ice walls. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the frost-blue frame.

#### Blizzard Aura (sf2)
Lvl 3 unlocks Frost Nova every 4th shot.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate frost-blue pixel border frame with small snowflake studs in corners, frost-blue #3388CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: a swirling blizzard aura ring surrounding a caster, sky blue with white snowflakes and a gentle spiral wind extending outward. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the frost-blue frame.

#### Ice Armor (sf3 / sc2)
Lvl 3 unlocks Blizzard Aura when shield is up.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate frost-blue pixel border frame with small snowflake studs in corners, frost-blue #3388CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: a figure encased in glowing crystal ice armor plates, icy white with crystalline plate segments and a blue shield glow. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the frost-blue frame.

#### Eternal Winter (sf5) — ULTIMATE
Unlocks when Deep Freeze, Blizzard Aura, and Ice Armor are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate frost-blue pixel border frame with small snowflake studs in corners, frost-blue #3388CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: an ever-expanding frost field consuming the ground with a perpetual blizzard above it, sky blue with a spreading white snowstorm field. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the frost-blue frame.

### Shatter Branch

#### Permafrost (ss1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-blue pixel border frame with small crystal-shard studs in corners, ice-blue #4499BB outer edge, darker #226688 inner bevel. Inside the frame on a solid black background: a frozen enemy surface covered in permafrost cracks with a damage-boost halo above it, pale blue with white frost crackle and a faint red up-arrow. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-blue frame.

#### Shatter (ss2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-blue pixel border frame with small crystal-shard studs in corners, ice-blue #4499BB outer edge, darker #226688 inner bevel. Inside the frame on a solid black background: a single ice shard striking a target and fracturing into two smaller seeker shards splitting off in different directions, pale blue and white with crisp crystal-break lines. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-blue frame.

#### Ice Spear (ss3)
Lvl 2 adds pierce, Lvl 3 unlocks Mirror Ice (+2 pierce).
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-blue pixel border frame with small crystal-shard studs in corners, ice-blue #4499BB outer edge, darker #226688 inner bevel. Inside the frame on a solid black background: a long sharp ice lance pointing forward with a faceted crystalline spear tip and light frost aura along the shaft. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-blue frame.

#### Avalanche (ss5) — ULTIMATE
Unlocks when Permafrost, Shatter, and Ice Spear are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-blue pixel border frame with small crystal-shard studs in corners, ice-blue #4499BB outer edge, darker #226688 inner bevel. Inside the frame on a solid black background: three clustered ice shard bundles crashing forward like an avalanche, pale blue and white with overlapping shard clusters rolling forward. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-blue frame.

### Crystal Branch (ice-white: #AAEEFF)

#### Wide Shard (sc1 / glacial_pierce)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-white pixel border frame with small diamond-shard studs in corners, ice-white #AAEEFF outer edge, darker #7799BB inner bevel. Inside the frame on a solid black background: a crystal shard with expanded AoE glow ring, wider splash radius upgrade, icy white-blue with blast radius ring expanding outward. Bold silhouette, high contrast, limited palette 5-6 colors, slight ice-white inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-white frame.

#### Mirror Ice (sc3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-white pixel border frame with small diamond-shard studs in corners, ice-white #AAEEFF outer edge, darker #7799BB inner bevel. Inside the frame on a solid black background: a shard piercing through multiple enemies in sequence, pierce chain through targets, icy white with refracted pierce lines through translucent crystal. Bold silhouette, high contrast, limited palette 5-6 colors, slight ice-white inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-white frame.

#### Cryo Shield (sc4)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-white pixel border frame with small diamond-shard studs in corners, ice-white #AAEEFF outer edge, darker #7799BB inner bevel. Inside the frame on a solid black background: a retaliatory ice shield firing shards outward when struck, reactive cryo burst on damage received, icy white with defensive burst shards radiating outward. Bold silhouette, high contrast, limited palette 5-6 colors, slight ice-white inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-white frame.

#### Diamond Dust (sc5) — ULTIMATE
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate ice-white pixel border frame with small diamond-shard studs in corners, ice-white #AAEEFF outer edge, darker #7799BB inner bevel. Inside the frame on a solid black background: a sparkling cloud of diamond-fine ice particles with multiple pierce trails, ultra-sharp crystalline dust damage, brilliant white and pale blue with prismatic diamond sparkle. Bold silhouette, high contrast, limited palette 5-6 colors, slight ice-white inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the ice-white frame.

---

## Amun Skills

Amun is an Egyptian sun warrior — thorns, wrath, consecration, quake. Each branch has 3 regular skills + 1 ultimate.
Amun skills use **branch-colored frames** — Wrath (solar-gold #CCAA00), Bastion (bronze-gold #CC8800), Quake (earth-bronze #CC6622).

### Wrath Branch

#### Thorns (aw1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate solar-gold pixel border frame with small sun-disc studs in corners, solar-gold #CCAA00 outer edge, darker #887700 inner bevel. Inside the frame on a solid black background: a warrior silhouette surrounded by outward-facing thorns and spikes in a retaliatory damage-reflect aura, red-orange with dark iron thorns radiating defensively. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the solar-gold frame.

#### Wrath (aw2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate solar-gold pixel border frame with small sun-disc studs in corners, solar-gold #CCAA00 outer edge, darker #887700 inner bevel. Inside the frame on a solid black background: a fist slamming the ground with an explosive burst of fiery rage energy, red-orange with fierce shockwave rings and dark flame wisps. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the solar-gold frame.

#### Consecration (aw3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate solar-gold pixel border frame with small sun-disc studs in corners, solar-gold #CCAA00 outer edge, darker #887700 inner bevel. Inside the frame on a solid black background: a sacred fire circle on the ground pulsing outward with divine flames, orange-gold with a dark border separating the sacred ring from outside. Bold silhouette, high contrast, limited palette 5-6 colors, slight gold inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the solar-gold frame.

#### Divine Judgment (aw5) — ULTIMATE
Unlocks when Thorns, Wrath, and Consecration are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate solar-gold pixel border frame with small sun-disc studs in corners, solar-gold #CCAA00 outer edge, darker #887700 inner bevel. Inside the frame on a solid black background: a narrow golden beam of divine light striking down from above onto a doomed enemy, warm gold and pale white execution ray against dark background. Bold silhouette, high contrast, limited palette 5-6 colors, slight gold inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the solar-gold frame.

### Bastion Branch

#### Fortify (ab1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bronze-gold pixel border frame with small shield-shaped studs in corners, bronze-gold #CC8800 outer edge, darker #885500 inner bevel. Inside the frame on a solid black background: a thick kite shield with fortification runes carved into its face, defensive stance with a soft blue energy aura and layered armor plates behind it. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bronze-gold frame.

#### Aura of Might (ab2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bronze-gold pixel border frame with small shield-shaped studs in corners, bronze-gold #CC8800 outer edge, darker #885500 inner bevel. Inside the frame on a solid black background: a golden pulsing aura ring radiating from a warrior silhouette, warm concentric rings of force emanating outward. Bold silhouette, high contrast, limited palette 5-6 colors, slight gold inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bronze-gold frame.

#### Iron Will (ab3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bronze-gold pixel border frame with small shield-shaped studs in corners, bronze-gold #CC8800 outer edge, darker #885500 inner bevel. Inside the frame on a solid black background: an iron helm with a damage-cap glyph etched onto the brow, stoic and unyielding, steel-blue with faint adamantine highlights. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bronze-gold frame.

#### Undying (ab5) — ULTIMATE
Unlocks when Fortify, Aura of Might, and Iron Will are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bronze-gold pixel border frame with small shield-shaped studs in corners, bronze-gold #CC8800 outer edge, darker #885500 inner bevel. Inside the frame on a solid black background: a fallen warrior rising from death surrounded by a full-HP revival burst and a shockwave ring blasting outward, blue and pale white revival glow. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bronze-gold frame.

### Quake Branch

#### Titan's Pulse (aq1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate earth-bronze pixel border frame with small boulder-shaped studs in corners, earth-bronze #CC6622 outer edge, darker #884411 inner bevel. Inside the frame on a solid black background: a massive fist slamming the earth launching a boulder projectile forward, ground cracking beneath with golden-brown earth energy and dust clouds rising. Bold silhouette, high contrast, limited palette 5-6 colors, slight gold inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the earth-bronze frame.

#### Earthquake (aq2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate earth-bronze pixel border frame with small boulder-shaped studs in corners, earth-bronze #CC6622 outer edge, darker #884411 inner bevel. Inside the frame on a solid black background: the ground shattering with seismic cracks radiating outward and stunned enemy silhouettes with stun stars above their heads, brown and gold seismic waves. Bold silhouette, high contrast, limited palette 5-6 colors, slight gold inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the earth-bronze frame.

#### Colossus (aq3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate earth-bronze pixel border frame with small boulder-shaped studs in corners, earth-bronze #CC6622 outer edge, darker #884411 inner bevel. Inside the frame on a solid black background: a giant fist sending a shockwave that pushes enemies far away, golden-brown with impact lines showing vast push distance. Bold silhouette, high contrast, limited palette 5-6 colors, slight gold inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the earth-bronze frame.

#### Cataclysm (aq5) — ULTIMATE
Unlocks when Titan's Pulse, Earthquake, and Colossus are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate earth-bronze pixel border frame with small boulder-shaped studs in corners, earth-bronze #CC6622 outer edge, darker #884411 inner bevel. Inside the frame on a solid black background: two shockwave rings expanding outward at different sizes — first immediate and small, second delayed and larger — fiery orange and gold with earth and fire combining. Bold silhouette, high contrast, limited palette 5-6 colors, slight orange inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the earth-bronze frame.

---

## Khashin Skills

Khashin is a martial arts fighter with desert/wind motifs. Each branch has 3 regular skills + 1 ultimate.
Khashin skills use **branch-colored frames** — Gale (sky-blue #4488CC), Dune (sand-gold #AA8833), Mirage (haze-lavender #9977CC).

### Gale Branch

#### Razor Wind (kw1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sky-blue pixel border frame with small wind-spiral studs in corners, sky-blue #4488CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: a slicing crescent wind blade cutting through two enemy silhouettes, sky blue with a sharp white wind arc and a clearly defined cutting edge. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sky-blue frame.

#### Gust Strike (kw2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sky-blue pixel border frame with small wind-spiral studs in corners, sky-blue #4488CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: a powerful wind blast hitting an enemy and sending them flying backward, sky blue with an explosive wind burst and trailing push-lines behind the airborne enemy. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sky-blue frame.

#### Dust Devil (kw3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sky-blue pixel border frame with small wind-spiral studs in corners, sky-blue #4488CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: a small drifting sand tornado wandering across the ground, sky blue mixed with tan sand spinning in a compact vortex column. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sky-blue frame.

#### Cyclone Surge (kw4)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sky-blue pixel border frame with small wind-spiral studs in corners, sky-blue #4488CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: a larger more ferocious cyclone tower spinning faster and taller, empowered dust devil upgrade, sky blue with intensified wind spiral and sand particles surging upward. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sky-blue frame.

#### Eye of the Storm (kw5) — ULTIMATE
Unlocks when Razor Wind, Gust Strike, and Dust Devil are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sky-blue pixel border frame with small wind-spiral studs in corners, sky-blue #4488CC outer edge, darker #225588 inner bevel. Inside the frame on a solid black background: a massive anchored tornado with a calm white eye at the center surrounded by violent cyclone walls, deep sky blue outer walls with a tranquil pale center. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sky-blue frame.

### Dune Branch

#### Choking Sand (kd1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sand-gold pixel border frame with small scarab-shaped studs in corners, sand-gold #AA8833 outer edge, darker #775522 inner bevel. Inside the frame on a solid black background: a cloud of blinding sand engulfing an enemy face with closed blinded eyes, amber with a tan sand burst around a silhouette whose eyes are covered. Bold silhouette, high contrast, limited palette 5-6 colors, slight amber inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sand-gold frame.

#### Sand Armor (kd2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sand-gold pixel border frame with small scarab-shaped studs in corners, sand-gold #AA8833 outer edge, darker #775522 inner bevel. Inside the frame on a solid black background: a warrior coated in a swirling layer of compressed sand forming protective armor plates, amber with flowing sand coating the torso in layered defensive form. Bold silhouette, high contrast, limited palette 5-6 colors, slight amber inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sand-gold frame.

#### Abrasion (kd3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sand-gold pixel border frame with small scarab-shaped studs in corners, sand-gold #AA8833 outer edge, darker #775522 inner bevel. Inside the frame on a solid black background: sharp sand particles grinding away at armor plates with abrasive force, amber with sand grains scraping crumbling dark armor fragments. Bold silhouette, high contrast, limited palette 5-6 colors, slight amber inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sand-gold frame.

#### Sandstorm Wall (kd5) — ULTIMATE
Unlocks when Choking Sand, Sand Armor, and Abrasion are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate sand-gold pixel border frame with small scarab-shaped studs in corners, sand-gold #AA8833 outer edge, darker #775522 inner bevel. Inside the frame on a solid black background: a dense towering wall of swirling sand looming over the battlefield, amber with a thick sand wall filling the upper portion and darkening the background behind it. Bold silhouette, high contrast, limited palette 5-6 colors, slight amber inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the sand-gold frame.

### Mirage Branch

#### Tailwind (km1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate haze-lavender pixel border frame with small crescent studs in corners, haze-lavender #9977CC outer edge, darker #664488 inner bevel. Inside the frame on a solid black background: a figure surging forward with rushing lavender wind lines flowing behind them, elongated flowing acceleration lines. Bold silhouette, high contrast, limited palette 5-6 colors, slight lavender inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the haze-lavender frame.

#### Phantom Step (km2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate haze-lavender pixel border frame with small crescent studs in corners, haze-lavender #9977CC outer edge, darker #664488 inner bevel. Inside the frame on a solid black background: a figure mid-dash leaving a ghost silhouette blur at the origin point, lavender and pale purple with a faint afterimage standing where the figure was. Bold silhouette, high contrast, limited palette 5-6 colors, slight lavender inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the haze-lavender frame.

#### Mirage (km3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate haze-lavender pixel border frame with small crescent studs in corners, haze-lavender #9977CC outer edge, darker #664488 inner bevel. Inside the frame on a solid black background: a shimmering heat-mirage decoy standing still while the real figure dashes away, lavender with a wavering translucent decoy silhouette and heat distortion lines. Bold silhouette, high contrast, limited palette 5-6 colors, slight lavender inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the haze-lavender frame.

#### Desert Wind (km5) — ULTIMATE
Unlocks when Tailwind, Phantom Step, and Mirage are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate haze-lavender pixel border frame with small crescent studs in corners, haze-lavender #9977CC outer edge, darker #664488 inner bevel. Inside the frame on a solid black background: a sweeping 180-degree desert wind blast exploding outward sending enemies flying with a hemicircular blast arc, lavender and white. Bold silhouette, high contrast, limited palette 5-6 colors, slight lavender inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the haze-lavender frame.

---

## Muller Skills

Muller is a crystal/gem warrior — crystal waves, geode shields, deep-seam traps. Each branch has 3 regular skills + 1 ultimate.
Muller skills use **branch-colored frames** — Shardfall (crystal-blue #3388AA), Geode Shell (teal-green #448899), Deep Seam (slate-purple #556688).

### Shardfall Branch

#### Coarse Cut (cm1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crystal-blue pixel border frame with small crystal-shard studs in corners, crystal-blue #3388AA outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: a wide crystal wave cone fanning out broadly, blue with a crystalline spike cone spreading at a very wide angle. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crystal-blue frame.

#### Deep Vein (cm2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crystal-blue pixel border frame with small crystal-shard studs in corners, crystal-blue #3388AA outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: crystal spikes erupting at maximum range with amplified damage glow at the tips, blue with tall crystal spikes at the far edge radiating brighter intensity. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crystal-blue frame.

#### Shardstorm (cm3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crystal-blue pixel border frame with small crystal-shard studs in corners, crystal-blue #3388AA outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: two crystal wave arcs erupting simultaneously from a single ground slam, blue with two mirrored crystal wave cones launching at once. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crystal-blue frame.

#### Tectonic Fury (cm5) — ULTIMATE
Unlocks when Coarse Cut, Deep Vein, and Shardstorm are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate crystal-blue pixel border frame with small crystal-shard studs in corners, crystal-blue #3388AA outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: a full radial ring of crystal spikes erupting outward from a central slam point, vivid blue with a complete circular crystal burst and ground crack at center. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the crystal-blue frame.

### Geode Shell Branch

#### Stone Skin (cr1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate teal-green pixel border frame with small geode-shard studs in corners, teal-green #448899 outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: a rocky stone-skin texture layering onto a figure, teal-grey with layered stone plates forming progressively over a silhouette with five stack marks visible. Bold silhouette, high contrast, limited palette 5-6 colors, slight teal inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the teal-green frame.

#### Geode Shell (cr2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate teal-green pixel border frame with small geode-shard studs in corners, teal-green #448899 outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: a geode half-shell opening to reveal a glowing crystal interior, teal with a cracked geode revealing a shimmering crystal hollow and shield-glow emanating from within. Bold silhouette, high contrast, limited palette 5-6 colors, slight teal inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the teal-green frame.

#### Crystal Wall (cr3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate teal-green pixel border frame with small geode-shard studs in corners, teal-green #448899 outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: a solid translucent crystal barrier rising from the ground blocking a path, teal and pale blue with a translucent crystal wall filling the upper frame. Bold silhouette, high contrast, limited palette 5-6 colors, slight teal inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the teal-green frame.

#### Living Geode (cr5) — ULTIMATE
Unlocks when Stone Skin, Geode Shell, and Crystal Wall are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate teal-green pixel border frame with small geode-shard studs in corners, teal-green #448899 outer edge, darker #225566 inner bevel. Inside the frame on a solid black background: a warrior whose torso is fused with a living geode crystal, teal with crystalline armor fused to flesh and melee-reflect sparks at the outer surface. Bold silhouette, high contrast, limited palette 5-6 colors, slight teal inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the teal-green frame.

### Deep Seam Branch

#### Planted Shard (cf1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate slate-purple pixel border frame with small ore-chunk studs in corners, slate-purple #556688 outer edge, darker #334455 inner bevel. Inside the frame on a solid black background: a crystal shard embedded point-down in cracked earth as a mine, purple with a glowing crystal spike planted vertically in the ground pulsing with trap energy. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the slate-purple frame.

#### Crystal Pillar (cf2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate slate-purple pixel border frame with small ore-chunk studs in corners, slate-purple #556688 outer edge, darker #334455 inner bevel. Inside the frame on a solid black background: a tall crystal pillar auto-erupting upward from the ground, purple with a towering glowing crystal column shooting skyward. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the slate-purple frame.

#### Fault Line (cf3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate slate-purple pixel border frame with small ore-chunk studs in corners, slate-purple #556688 outer edge, darker #334455 inner bevel. Inside the frame on a solid black background: a luminous crack running across the ground left by a crystal wave, purple with a glowing fault crack splitting the terrain from one side to the other. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the slate-purple frame.

#### The Mother Lode (cf5) — ULTIMATE
Unlocks when Planted Shard, Crystal Pillar, and Fault Line are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate slate-purple pixel border frame with small ore-chunk studs in corners, slate-purple #556688 outer edge, darker #334455 inner bevel. Inside the frame on a solid black background: a colossal crystal eruption detonating upward from the earth, vivid purple with a massive crystal formation bursting from cracked ground in a dramatic upward spray. Bold silhouette, high contrast, limited palette 5-6 colors, slight purple inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the slate-purple frame.

---

## Huntress Skills

Huntress is a ranged/agile spear fighter — piercing shots, traps, predator instincts. Each branch has 3 regular skills + 1 ultimate.
Huntress skills use **branch-colored frames** — Predator (blood-red #CC4422), Stalker (forest-green #22AA44), Warden (bark-brown #886622).

Note: Huntress currently borrows generic/other-hero icon frames as placeholders. These prompts define the intended original icons.

### Predator Branch

#### Critical Strike (hp1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate blood-red pixel border frame with small arrowhead studs in corners, blood-red #CC4422 outer edge, darker #882211 inner bevel. Inside the frame on a solid black background: a spear tip striking with a critical-hit starburst flash, red with a sharp impact highlight and crack-pattern radiating from the strike point. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the blood-red frame.

#### Marked Target (hp2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate blood-red pixel border frame with small arrowhead studs in corners, blood-red #CC4422 outer edge, darker #882211 inner bevel. Inside the frame on a solid black background: a target silhouette with a glowing red marker rune branded onto it, dark red with a pulsing marking glyph. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the blood-red frame.

#### Battle Frenzy (hp3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate blood-red pixel border frame with small arrowhead studs in corners, blood-red #CC4422 outer edge, darker #882211 inner bevel. Inside the frame on a solid black background: a clenched fist surrounded by speed-slash arcs with manic energy lines radiating outward, red with intense frenzy lines. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the blood-red frame.

#### Volley (hp5) — ULTIMATE
Unlocks when Critical Strike, Marked Target, and Battle Frenzy are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate blood-red pixel border frame with small arrowhead studs in corners, blood-red #CC4422 outer edge, darker #882211 inner bevel. Inside the frame on a solid black background: three spears launching simultaneously in a tight spread volley, red with three spear silhouettes fanned slightly apart in synchronized release. Bold silhouette, high contrast, limited palette 5-6 colors, slight red inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the blood-red frame.

### Stalker Branch

#### Kill Stride (hs1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate forest-green pixel border frame with small leaf-shaped studs in corners, forest-green #22AA44 outer edge, darker #116622 inner bevel. Inside the frame on a solid black background: a hunter striding over a downed enemy with speed lines surging from their boots, hunter-green with acceleration lines and a fallen foe silhouette below. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the forest-green frame.

#### Caltrops (hs2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate forest-green pixel border frame with small leaf-shaped studs in corners, forest-green #22AA44 outer edge, darker #116622 inner bevel. Inside the frame on a solid black background: spiked metal caltrops scattered across a patch of ground, hunter-green with dark iron caltrops embedded in the earth. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the forest-green frame.

#### Net Throw (hs3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate forest-green pixel border frame with small leaf-shaped studs in corners, forest-green #22AA44 outer edge, darker #116622 inner bevel. Inside the frame on a solid black background: a weighted hunting net mid-throw spreading open, hunter-green with a rope net spreading outward in flight. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the forest-green frame.

#### Leap (hs5) — ULTIMATE
Unlocks when Kill Stride, Caltrops, and Net Throw are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate forest-green pixel border frame with small leaf-shaped studs in corners, forest-green #22AA44 outer edge, darker #116622 inner bevel. Inside the frame on a solid black background: a figure leaping away from a crowd of enemies with enemy silhouettes below being left behind, hunter-green with a jumping silhouette. Bold silhouette, high contrast, limited palette 5-6 colors, slight green inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the forest-green frame.

### Warden Branch

#### Heavy Spear (hw1)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bark-brown pixel border frame with small spear-tip studs in corners, bark-brown #886622 outer edge, darker #554411 inner bevel. Inside the frame on a solid black background: a massive oversized spear with a thick heavy tip and knockback force lines, steel-blue with a thick powerful shaft and impact blast wave. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bark-brown frame.

#### Explosive Tips (hw2)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bark-brown pixel border frame with small spear-tip studs in corners, bark-brown #886622 outer edge, darker #554411 inner bevel. Inside the frame on a solid black background: a spear tip with a small explosive charge detonating on impact, steel-blue with an explosion burst at the spear tip and a radius ring. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bark-brown frame.

#### Splinter Shot (hw3)
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bark-brown pixel border frame with small spear-tip studs in corners, bark-brown #886622 outer edge, darker #554411 inner bevel. Inside the frame on a solid black background: a spear breaking apart into three smaller shard fragments spraying outward, steel-blue with a broken spear shaft and three diverging splinter arcs. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bark-brown frame.

#### Earth Slam (hw5) — ULTIMATE
Unlocks when Heavy Spear, Explosive Tips, and Splinter Shot are all at level 2+.
> 128x128 pixel art RPG skill icon, 32-bit retro style. Ornate bark-brown pixel border frame with small spear-tip studs in corners, bark-brown #886622 outer edge, darker #554411 inner bevel. Inside the frame on a solid black background: a spear slammed point-first into the earth sending a shockwave line forward, steel-blue with the impact point and a straight shockwave crack extending outward. Bold silhouette, high contrast, limited palette 5-6 colors, slight blue inner glow. Crisp hard pixel edges, no anti-aliasing, no gradients. Single centered object inside the bark-brown frame.

---

## Generation Notes

- Request images at **1024x1024** and resize to 128x128 after cutting
- DALL-E tends to add decorative borders — lean into the frame descriptions
- Use the batch workflow: one generation per branch (4 icons per image)
- After generation, run the PIL script from the icon workflow to auto-cut and paste into `skill_icons_sheet.png`
- Spritesheet layout: `public/assets/icons/skill_icons_sheet.png` (1280×1280, 10×10 grid)
- After adding new frames, update `ICON_FRAME_MAP` in `src/systems/UpgradeSystem.ts`
- Each hero has exactly 3 branches × 4 skills (3 regular + 1 ultimate) = 12 skills per hero
