# Система рівнів скілів — Дизайн-документ

## 1. Огляд механіки

### Суть системи

Кожен скіл у гілці тепер має **3 рівні**:
- **Рівень 1** — стандартне розблокування (як зараз). Новий скіл гілки з'являється як картка при левел-апі.
- **Рівень 2** — апгрейд уже відкритого скілу. Помірний буст.
- **Рівень 3** — потужний апгрейд. Відчутна перевага, але не ломить баланс.

Максимальний рівень скілу: **3**. Generic-апгрейди залишаються без рівневої системи (беруться один раз, як і зараз).

### Взаємодія з поточною системою

Поточна система: 1 гілка × 5 скілів, розблокуються послідовно.

Нова система розширює це так:
- Кожен **вже розблокований** скіл у вибраній гілці може з'явитись як картка апгрейду.
- Між розблокуванням нового скілу і апгрейдом існуючого — є вибір.

Це означає, що гілка з 5 скілами тепер має **15 потенційних покращень** (5 × 3 рівні), замість 5.

---

## 2. Потік вибору при левел-апі

### Рівень 1 (перший левел-ап)

Без змін: гравець бачить 3 картки — по одній від кожної гілки, обирає гілку.

### Рівні 2+

Гравець бачить **3 картки**, складені з пулів:

| Слот | Що показується |
|------|----------------|
| **Слот A** | Наступний нерозблокований скіл вибраної гілки (якщо є) |
| **Слот B** | Апгрейд (рівень 2 або 3) одного з уже розблокованих скілів гілки (вибирається випадково з доступних) |
| **Слот C** | Один випадковий generic-апгрейд з пулу (G1–G10, ті що ще не взяті) |

Якщо всі 5 скілів гілки вже розблоковані — Слот A замінюється другим апгрейдом (рівень 2/3) іншого скілу.  
Якщо всі скіли максимального рівня — замість Слоту B з'являється ще один generic.  
Якщо generic-пул вичерпано — Слот C замінюється апгрейдом скілу.

Порядок карток A/B/C — перемішується (рандомна позиція).

### Карткове відображення

Картка апгрейду скілу візуально відрізняється від розблокування:
- Показує поточний рівень скілу та нову зірочку / іконку рівня (напр. ★★☆).
- Заголовок: `"[Назва скілу] — Рівень 2"`.
- Опис: тільки дельта ефекту (`"+25% dmg"`, `"radius +20px"`), а не повне описання скілу.
- Колір рамки картки: той самий колір гілки (як зараз), але з легким золотим відтінком.

---

## 3. Обмеження і баланс

- **Макс рівень скілу: 3.** Скіл рівня 3 не з'являється в пулі апгрейдів.
- **Generic-апгрейди** — без рівнів, беруться один раз (система незмінна).
- **Послідовність збережена:** не можна отримати апгрейд рівня 2 раніше, ніж гравець розблокував скіл (рівень 1).
- **Один апгрейд скілу за левел-ап:** гравець не може взяти два апгрейди одного скілу за одне вибирання.
- **Scaling логіка apply:** функція `apply()` в коді має перевіряти поточний рівень і застосовувати відповідний бонус поверх попереднього. Архітектурне рішення про реалізацію — окремо.

---

## 4. Таблиці рівнів скілів за героями

> Умовні позначення: `dmg` — base damage гравця, `CD` — attackCooldown, `px` — пікселі, `s` — секунди.

---

### Ignara — гілка Inferno

| Скіл | Рівень 1 (розблокування) | Рівень 2 | Рівень 3 |
|------|--------------------------|----------|----------|
| **Wide Burn** | Explosion radius +20px | Radius ще +20px | Radius ще +25px (загалом +65px) |
| **Inferno Reach** | Fireball range +30px | Range ще +25px | Range ще +30px + fireballs pierce 1 enemy |
| **White Fire** | +30% fireball dmg | +20% dmg | +25% dmg + fireballs leave 1s burn trail |
| **Scorched Earth** | Burn DOT 15% dmg ×6 ticks/3s, +15% dmg | Burn ticks ×8 (замість 6), +10% dmg | Burn DOT зростає до 25% dmg/tick |
| **Firestorm** | 2 mini-fireballs 50% dmg 35px AoE, +15% dmg | Mini-fireballs 3 (замість 2), +10% dmg | Mini-fireballs AoE +15px, +15% dmg |

---

### Ignara — гілка Fortress

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Heat Shield** | +15% armor | +10% armor | +10% armor + on-hit: відштовхує ворогів на 30px |
| **Pyromaniac** | On kill: +5 HP, +1 HP/s regen | On kill: +8 HP (замість 5), +1 HP/s regen | On kill: +10 HP, +1 HP/s regen, +1 speed на 3s |
| **Molten Skin** | When hit: AoE 30% dmg 50px, +10% armor | AoE radius +20px (70px), +5% armor | AoE dmg +40% (замість 30%), +5% armor |
| **Ember Veil** | +10% armor | +10% armor | +10% armor + Molten Skin CD -1s (якщо є) |
| **Phoenix Heart** | Revive 1× at 50% HP, +30 max HP | Revive відновлює 65% HP (замість 50%), +20 max HP | On revive: 2s invuln + AoE 80% dmg 80px |

---

### Ignara — гілка Havoc

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Backdraft** | Fireball knockback 120→300px, +10% dmg | Knockback +100px (400px), +10% dmg | Knocked-back ворог при зіткненні з іншим: AoE 40% dmg |
| **Eruption** | Explosion radius +40px | Radius ще +30px | Radius ще +30px + вибухи підпалюють землю 1s |
| **Lava Trail** | Drop fire pools 20% dmg/tick, +10 speed | Pools 25% dmg/tick, +8 speed | Pools тривають 2× довше, +5 speed |
| **Wildfire** | On kill: chain explosion 50px 40% dmg, +5 dmg | Chain explosion radius +20px (70px), +5 dmg | Chain explosion може ланцюгуватись ще 1 раз |
| **Meltdown** | Below 40% HP: ×1.5 dmg, +15% dmg | Поріг 50% HP (замість 40%), +10% dmg | Множник ×1.75 (замість ×1.5), +10% dmg |

---

### Nazar — гілка Way of the Blade

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Shadow Step** | Blink 30px before melee, +10 range | Blink відстань +20px (50px), +5 range | Blink залишає тінь 0.5s що завдає 20% dmg |
| **Twin Blades** | +1 strike per melee | +1 strike (всього +2) | +1 strike (всього +3) + останній удар: knockback 80px |
| **Blade Surge** | Lunge 1.5× range, hit 70% dmg line, +5 dmg | Lunge dmg 85% (замість 70%), +5 dmg | Lunge пронизує необмежену кількість ворогів на лінії |
| **Hemorrhage** | Bleed 15% dmg ×6 ticks/3s, +10% dmg | Bleed ×8 ticks/4s, +8% dmg | Bleed накладається двічі (стекується до 2 стеків) |
| **Assassinate** | 2× dmg vs 1 enemy in range, +15% dmg | Бонус зростає до 2.3× (замість 2×), +10% dmg | Assassinate також спрацьовує якщо 2 або менше ворогів |

---

### Nazar — гілка Way of Venom

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Toxic Slash** | DOT puddle 30% dmg/tick 3s, +3 dmg | Puddle 35% dmg/tick, +3 dmg | Puddle 40% dmg/tick + отруює без slash (пасивна аура) |
| **Virulent Strain** | Puddles ×1.8 radius, 5s duration, +15 splash | Duration 7s (замість 5s), +10 splash | Puddles тепер накладають Weakness дебаф -15% armor |
| **Pandemic** | On kill: spread cloud 50% radius 50% dmg, +3 dmg | Cloud radius 65% (замість 50%), +3 dmg | On kill: 2 clouds (замість 1), +5 dmg |
| **Weakness** | Poisoned take +30% dmg, +10% dmg | Poisoned take +40% dmg, +8% dmg | Poisoned take +50% dmg + slow 20% |
| **Necrosis** | Poison dmg ramps +20% per tick, +15% dmg | Ramp +30% per tick (замість 20%), +10% dmg | Ramp cap збільшується +2 extra ticks |

---

### Nazar — гілка Way of Shadow

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Vanish** | After melee: 400ms invuln, +10% armor | Invuln 600ms (замість 400ms), +5% armor | Invuln 800ms + перший удар після Vanish: +50% dmg |
| **Phantom Trail** | Moving: shadow trail 15% dmg/tick 15px, +10 speed | Trail dmg 20%/tick, +8 speed | Trail radius 25px (замість 15px), +5 speed |
| **Smoke Bomb** | On melee: slow enemies 60% in 50px, +15 splash | Slow radius 70px (замість 50px), +10 splash | Slow тривалість +1s + ворог не може атакувати під час slow |
| **Blood Scent** | Execute melee targets below 20% HP, +10% dmg | Execute поріг 25% HP (замість 20%), +8% dmg | Execute в радіусі melee range × 1.5 |
| **Death Mark** | 1st hit marks; 2nd hit +40% dmg, +15% dmg | Mark бонус +55% (замість 40%), +10% dmg | Mark не зникає, спрацьовує на кожен 2-й удар |

---

### Sifra — гілка Frost

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Deep Freeze** | Shards slow +30%, +10% dmg | Slow +40% (замість 30%), +8% dmg | Slow +50%, shards проходять крізь одного ворога |
| **Blizzard Aura** | Slow enemies 40% in 60px aura | Aura radius 75px (замість 60px) | Aura slow 55% (замість 40%) + 5 dmg/s |
| **Frost Nova** | Every 4th shot: 8 shards ring 50% dmg, +3 dmg | Ring shards 10 (замість 8), +3 dmg | Nova dmg 65% (замість 50%), cooldown кожен 3-й shot |
| **Absolute Zero** | Freeze stun 2s when slowed below 35%, +15% dmg | Freeze threshold 45% (замість 35%), +10% dmg | Frozen ворог при смерті: вибухає cold AoE 60px 40% dmg |
| **Eternal Winter** | Frost field 20% dmg/s 60% slow 55px, +15% dmg | Frost field radius 70px (замість 55px), +10% dmg | Frost field dmg 30%/s (замість 20%), +10% dmg |

---

### Sifra — гілка Shatter

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Permafrost** | +40% dmg vs slowed enemies, +10% dmg | Бонус +55% (замість 40%), +8% dmg | Бонус +70%, також спрацьовує на заморожених |
| **Shatter** | On hit: +2 mini-shards seek nearby foes | +3 shards (всього +5), shards seek 20px further | Shards explode on impact: 20% dmg 20px AoE |
| **Ice Spear** | +8 dmg, +20px range | +6 dmg, +15px range | +8 dmg, pierces +1 target |
| **Frostbite** | +1 shatter shard, shards seek +20px further | +1 shard (всього +2), shards seek ще +15px | Shards повертаються (рикошет до 1 extra target) |
| **Avalanche** | +3 shatter shards per hit, +20% dmg | +2 shards (всього +5), +15% dmg | Кожен shard slow +25%, +15% dmg |

---

### Sifra — гілка Crystal

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Wide Shard** | Shard AoE radius +20px | Radius ще +20px | Radius ще +20px + shards knockback 60px |
| **Ice Armor** | Absorb shield (30+15% maxHP), regen after 3s | Shield regen after 2s (замість 3s) | Shield HP +25% більше (30+20% maxHP) |
| **Mirror Ice** | Shards pierce +2 extra targets | Pierce +1 (всього +3), +10% dmg | Pierce +1 (всього +4) + перший pierced ворог: -20% armor на 3s |
| **Cryo Shield** | When hit: fire 3 shards 25% dmg 80px, +5% armor | Shards 4 (замість 3), +5% armor | Shards 50% dmg (замість 25%), +5% armor |
| **Diamond Dust** | +2 shard pierce, +25% dmg | +1 pierce (всього +3), +15% dmg | Shards залишають ice patch 3s, slow 50% |

---

### Sifra — гілка Lightning

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Spark Initiate** | Chain to 1 nearby foe 80px 60% dmg, +15% dmg | Chain до 2 targets (замість 1), +10% dmg | Chain range +40px (120px), +10% dmg |
| **Arc Reach** | Cone +50% wider, side-arc 40% dmg, +15 range | Side-arc dmg 55% (замість 40%), +10 range | Side-arc targets 2 (замість 1), +10 range |
| **Overcharge** | ~8% chance: cone 3× dmg burst, +15% dmg | Шанс зростає до ~12%, +10% dmg | На proc: stunує ціль 0.5s, +10% dmg |
| **Ball Lightning** | Orbit 45px: zap 40px for 30% dmg/s, +3 dmg | Zap radius 55px (замість 40px), +3 dmg | 2 Ball Lightning одночасно (замість 1), +5 dmg |
| **Storm Lord** | Every 2s: random enemy struck 2× dmg, +20% dmg | Every 1.5s (замість 2s), +15% dmg | Strike розгалужується до 2 сусідніх ворогів, +10% dmg |

---

### Amun — гілка Wrath

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Thorns** | When hit: reflect 50% dmg 60px, +5% armor | Reflect 65% dmg (замість 50%), +5% armor | Reflect 80% dmg + 1s slow на всі уражені цілі |
| **Wrath** | When hit: AoE burst 60% dmg 70px, +10% dmg | Burst radius 90px (замість 70px), +8% dmg | Burst dmg 80% (замість 60%), +8% dmg |
| **Consecration** | Aura pulse 40% dmg 70px / 1.5s, +25 splash, +3 dmg | Pulse частота 1.2s (замість 1.5s), +15 splash, +3 dmg | Pulse dmg 55% (замість 40%), +15 splash, +5 dmg |
| **Living Fortress** | Aura dmg scales 0.5–2× with HP %, +30 max HP | Min scale 0.6× (замість 0.5×), +20 max HP | Max scale 2.3× (замість 2×), +20 max HP |
| **Divine Judgment** | Auto-execute below 15% HP in 80+range px, +15% dmg | Execute поріг 20% HP (замість 15%), +10% dmg | Execute при смерті: AoE 50% dmg 60px навколо цілі |

---

### Amun — гілка Bastion

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Fortify** | +15% armor, activates defense aura visual | +10% armor | +10% armor + на-хіт: 5% шанс відбити удар (0 dmg) |
| **Aura of Might** | Aura: 3 DPS to all in 60px, +3 dmg | Aura DPS 4 (замість 3), aura radius 75px, +3 dmg | Aura DPS 6, +4 dmg |
| **Iron Will** | Any single hit capped at 10% max HP, +10% armor | Cap зменшується до 8% max HP, +5% armor | Cap 6% max HP + після кожного заблокованого: +2 HP regen на 3s |
| **Regenerate** | Below 40% HP: regen ×3, +2 HP/s | Поріг 50% HP (замість 40%), +1 HP/s | Regen ×4 (замість ×3), +1 HP/s |
| **Undying** | Revive 1× at full HP + 100px shockwave, +30 max HP | Shockwave radius 150px (замість 100px), +20 max HP | Revive 2× (можна умерти двічі), +20 max HP |

---

### Amun — гілка Quake

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Titan's Pulse** | Boulder 300px 1.5× dmg AoE, +5 dmg, +15 splash | Boulder range 400px (замість 300px), +5 dmg | Boulder AoE radius +25px, bounce до 1 сусіднього ворога |
| **Earthquake** | Shockwave hit: stun 0.8s, +10% dmg | Stun 1.2s (замість 0.8s), +8% dmg | Stun поширюється ланцюгом на 1 ворога поруч |
| **Colossus** | Shockwave knockback 500px (vs 200px), +5 dmg | Knocked ворог завдає 30% dmg цілям на шляху | Knocked ворог AoE при зупинці: 40% dmg 50px |
| **Gravity Well** | Every 2s: pull enemies 120+range px, +15 range | Pull radius +30px, +10 range | Pull також уповільнює 40% на 2s після притягання |
| **Cataclysm** | 2nd shockwave 60% dmg at 350ms delay, +15% dmg | 2nd shockwave 75% dmg (замість 60%), +10% dmg | 3rd shockwave 40% dmg at 600ms delay, +10% dmg |

---

### Khashin — гілка Gale

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Razor Wind** | Wind slash +25% dmg, pierce +1 target | Pierce +1 (всього +2), +15% dmg | Slash повертається: проходить туди і назад |
| **Gust Strike** | Wind slash knocks enemies back 150px | Knockback +100px (250px) | Knocked ворог при зіткненні: 40% dmg AoE 50px |
| **Dust Devil** | Every 5th attack: spawns drifting tornado | Tornado кожен 4-й attack (замість 5-го) | Tornado тривалість +1.5s, radius +15px |
| **Cyclone Surge** | Dust Devils +50% bigger, +1s longer, +15% dmg | Dust Devils +25% більше (всього +75%), +10% dmg | Dust Devils притягують ворогів до центру |
| **Eye of the Storm** | Anchored tornado every 8s, +20% dmg | CD 6s (замість 8s), +15% dmg | 2 anchored tornados одночасно, +10% dmg |

---

### Khashin — гілка Dune

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Choking Sand** | Blinded enemies take +35% dmg | Dmg бонус +50% (замість 35%) | Blind тривалість +1s на всіх застосуваннях |
| **Sand Armor** | Absorb shield 25% max HP, regen after 4s | Shield regen after 2.5s (замість 4s) | Shield HP 35% max HP (замість 25%) |
| **Abrasion** | Blinded enemies -20% armor, +3 dmg | Armor debuff -30% (замість -20%), +3 dmg | Armor debuff тепер постійний поки ворог живий |
| **Scarab Tide** | On kill: 4 seeking scarabs apply Blind | Scarabs 6 (замість 4) | Scarabs також наносять 15% dmg при торканні |
| **Sandstorm Wall** | Haboob arcs spawn lingering sand clouds | Sand clouds тривалість +2s | Clouds dmg ворогів всередині: 10% dmg/s |

---

### Khashin — гілка Mirage

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Tailwind** | +20 speed, -10% attack CD | +15 speed, -8% attack CD | +15 speed + sprint burst: при вбивстві +30% speed на 2s |
| **Phantom Step** | Auto-dash 100px away every 6s | Dash відстань 150px (замість 100px), CD 5s | CD 4s + dash залишає вибух повітря 40% dmg 40px |
| **Mirage** | Phantom Step leaves a decoy 2s | Decoy тривалість 3s (замість 2s) | Decoy атакує (1 удар 50% dmg) перед зникненням |
| **Drift** | Moving: slow trails 40% slow | Trail slow 55% (замість 40%) | Trail також наносить 10% dmg/tick |
| **Desert Wind** | Every 10s: 180px wind burst + 3s DR | Wind burst radius 240px (замість 180px), CD 8s | Burst knockback відстань ×2, +3s DR тривалість |

---

### Muller — гілка Shardfall

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Coarse Cut** | Crystal wave cone +15° wider | Cone ще +15° (всього +30°) | Cone +10° (всього +40°) + остання хвиля подвійна dmg |
| **Deep Vein** | Spikes +30% dmg at max range | Дистанція де бонус спрацьовує: 80% range (замість max) | Bonus +45% (замість 30%) |
| **Shardstorm** | Double wave per slam | Друга хвиля: +15% dmg | Третя хвиля 60% dmg (всього 3 хвилі на slam) |
| **Crystal Shrapnel** | Spikes spray 3 shards on death | Shards 5 (замість 3) | Shards seek nearest enemy (замість random direction) |
| **Tectonic Fury** | Every 5th slam: crystal eruption ring | Every 4th slam (замість 5-го) | Eruption ring radius +30px, dmg +25% |

---

### Muller — гілка Geode Shell

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Stone Skin** | +2% DR per kill, max 5 stacks | Max stacks 7 (замість 5) | Max stacks 10, stacks тепер не спадають між хвилями |
| **Geode Shell** | Below 50% HP: absorb next hit, 20s CD | CD 15s (замість 20s) | HP поріг 60% (замість 50%), абсорбований dmg переходить у контратаку 30% |
| **Crystal Wall** | Barrier every 8s blocking enemies | CD 6s (замість 8s) | Barrier також завдає 25% dmg ворогам що торкаються |
| **Resonance Armor** | Wave impact grants 0.5s invuln | Invuln 0.8s (замість 0.5s) | Invuln 1.2s + під час invuln: +40% dmg |
| **Living Geode** | +25 HP, melee reflect 15 dmg | +20 max HP, reflect 20 dmg (замість 15) | +20 max HP, reflect 30 dmg + slow 30% на 1s |

---

### Muller — гілка Deep Seam

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Planted Shard** | Slams leave crystal mines | Mines trigger radius +15px | Mines dmg +30%, тепер детонують і від ворогів в русі |
| **Crystal Pillar** | Auto pillar every 12s | CD 9s (замість 12s) | Pillar тривалість +3s, завдає 15% dmg/s навколо |
| **Fault Line** | Wave carves 4s ground hazard | Hazard dmg +25% | Fault Line тривалість 6s (замість 4s) |
| **Resonance Field** | Structures slow enemies 20% | Slow 30% (замість 20%) | Slow + -15% armor debuff для ворогів у полі |
| **The Mother Lode** | Massive crystal eruption every 12s | CD 9s (замість 12s) | Eruption +30% radius + knockout knockback 150px |

---

### Huntress — гілка Predator

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Critical Strike** | 20% crit chance → 2× dmg, +10% dmg | Crit chance 28% (замість 20%), +8% dmg | Crit dmg 2.5× (замість 2×), +8% dmg |
| **Marked Target** | Hit marks enemy 5s; marked +30% dmg, +3 dmg | Mark тривалість 8s (замість 5s), +3 dmg | Marked take +45% dmg (замість 30%), +5 dmg |
| **Battle Frenzy** | On kill: -10% attack CD for 5s, +3 dmg | Frenzy тривалість 7s (замість 5s), +3 dmg | On kill: -15% CD (замість -10%) + +10% dmg на 4s |
| **Headhunter** | Auto-execute below 15% HP in 100px, +15% dmg | Execute поріг 20% HP, +10% dmg | Execute в 130px (замість 100px), +10% dmg |
| **Volley** | Every 5th spear: 3 at once 60% extra dmg, +10% dmg | Volley кожен 4-й spear (замість 5-го), +8% dmg | Volley 4 spears (замість 3), +8% dmg |

---

### Huntress — гілка Stalker

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Kill Stride** | On kill: +20% speed for 3s, +10 speed | Speed бонус +30% (замість 20%), +8 speed | Stride тривалість 5s (замість 3s), +7 speed |
| **Caltrops** | Moving: spike zone every 800ms 15% dmg, +3 dmg | Caltrops drop кожні 600ms (замість 800ms), +3 dmg | Caltrop dmg 20% (замість 15%), +5 dmg |
| **Net Throw** | Every 8th spear roots 1.5s, +3 dmg | Root тривалість 2.2s (замість 1.5s), +3 dmg | Net кидається кожним 6-м spear (замість 8-м), +5 dmg |
| **Camouflage** | On kill: invisible 2s, +10 speed | Invis тривалість 3s (замість 2s), +8 speed | Перший удар після Camo: +60% dmg, +7 speed |
| **Leap** | Auto-leap 120px away if 4+ enemies in 50px, 4s CD | Leap distance 160px (замість 120px), CD 3s | Leap landing: AoE 50% dmg 60px, +10 speed |

---

### Huntress — гілка Warden

| Скіл | Рівень 1 | Рівень 2 | Рівень 3 |
|------|----------|----------|----------|
| **Heavy Spear** | Spears +40% dmg + knockback, +5 dmg | Knockback +100px, +5 dmg | Heavy Spear пробиває +1 ціль при knockback |
| **Explosive Tips** | On first pierce: AoE 35% dmg 40px, +15 splash | AoE dmg 50% (замість 35%), +10 splash | AoE спрацьовує на кожен pierce (не тільки перший) |
| **Splinter Shot** | Spear miss: 3 shards 30% dmg 80px, +4 dmg | Shards 4 (замість 3), +4 dmg | Shards seek nearest enemy (замість random) |
| **Spear Wall** | 3 orbiting spears 20% dmg/s 18px, +3 dmg | 4 orbiting spears (замість 3), +3 dmg | Orbiting spears dmg 30%/s (замість 20%), +5 dmg |
| **Earth Slam** | Melee shockwave line 150px 60% dmg, +20% dmg | Shockwave line 200px (замість 150px), +15% dmg | Shockwave branching: 2 лінії у конусі |

---

## 5. Підсумок балансу

### Числові рамки

| Параметр | Lvl 2 | Lvl 3 |
|----------|-------|-------|
| Dmg бонус (відносний) | +8–15% | +10–20% |
| Dmg бонус (абсолютний) | +3–8 | +5–10 |
| Radius / range | +10–20px | +15–30px |
| CD зменшення | 10–15% | 15–25% |
| Duration | +1–2s | +2–3s |
| Якісні бонуси (нові ефекти) | рідко | можливо на lvl 3 |

### Правила якісних ефектів на Lvl 3

Кілька скілів на рівні 3 отримують **якісну зміну** (нова міні-механіка), а не лише числа. Правило: якісний ефект рівня 3 не повинен бути складнішим за вже існуючу механіку скілу. Наприклад:
- Якщо скіл вже має chain — chain +1 target.
- Якщо скіл вже має DoT — DoT стекується.
- Якщо скіл вже має knockback — knockback завдає splash при ударі.

### Взаємодія з Generic-апгрейдами

Generic-апгрейди (G1–G10) залишаються без рівнів. Вони підсилюють базові характеристики гравця і непрямо посилюють всі скіли одночасно. Тому немає потреби їх рівневати — вони виконують роль "поперечних" підсилень.

### Максимальний рівень

- Всі скіли: **max рівень 3**.
- Теоретичний максимум per-гілка: 5 скілів × 3 рівні = **15 апгрейдів** + 10 generic = **25 пікапів** на одного героя (не рахуючи повторних generic).
- На практиці гравець досягне рівня 20–25 за гру, тож пройде 3–5 скілів гілки + 2–3 апгрейди + 5–7 generic. Повне проходження гілки до рівня 3 — ціль для довгих або NG+ сесій.
