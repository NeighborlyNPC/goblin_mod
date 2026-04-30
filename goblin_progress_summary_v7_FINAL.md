# Goblin Girl Mob - Full Design Reference (v7 — FINAL)

## 📋 PROJECT OVERVIEW

**Platform**: Bedrock Edition (Behavior Pack + Resource Pack + Scripting API)  
**Tool**: Bridge v2  
**Model Format**: Blockbench (`.geo.json`, `.animation.json`)  
**Source Mod**: Expandable Goblins (Java, Forge 1.20.1) by irritator-fan-NSFW  
**Port Type**: Mob-only port — mechanics rebuilt from scratch, assets custom-made

---

## 🧠 HOW IT ALL FITS TOGETHER

The Goblin Girl is a tameable mob that grows through four visual stages by consuming honey bottles. As she eats more she gets bigger, slower, and tankier — but also harder to manage. The core gameplay loop is: **feed her to grow her, then help her regress back down by keeping her calm and rubbing her belly**. Left alone in the wild she is hostile, greedy, and will pick up gold items she finds on the ground. Tamed, she becomes a companion that fights for you, follows you, and depends on you to manage her size. The pop system exists as a risk/reward moment at stage 4 — pushing her too far has consequences.

---

## ✅ CONFIRMED ASSETS

### Model
- Blockbench `.geo.json` complete
- `hand1` renamed to `rightItem` — holds weapons and tools in right hand
- Left-hand items (honey bottle, food) baked directly into animations — no `leftItem` bone needed
- No further model changes required

### Texture System
Four layers combined in the render controller at spawn:

| Layer | Files | Count | Query / Property |
|---|---|---|---|
| Skin + eyes | `goblin0.png` – `goblin9.png` | 10 | `query.variant` |
| Clothes | `cloths0.png` – `cloths7.png` | 8 | `query.skin_id` |
| Hair | `hair0.png` – `hair15.png` | 16 | `goblin:hair_index` (script) |
| Goblin type | Set by weapon spawn roll | 0 / 1 / 2 | `query.mark_variant` |

- Eye color is baked into each skin texture — no separate eye layer needed
- Hair uses a transparency-based hue overlay to multiply variety without extra textures
- `query.mark_variant` is reserved for goblin type and is never randomized for appearance
- All four values are assigned at spawn and remain fixed for the lifetime of that goblin

### Nametag Easter Eggs (Full Texture Overrides)
Naming a goblin with a specific nametag replaces all layered textures with a single hand-crafted full texture. These textures have exclusive traits that cannot appear through random generation.

| File | Nametag Trigger | Status |
|---|---|---|
| `poppy.png` | "Poppy" | ✅ Complete |
| TBD | TBD | ❌ Not yet made |
| TBD | TBD | ❌ Not yet made |

- Trigger name = filename without extension, capitalized (e.g. `poppy.png` → "Poppy")
- Script checks `query.get_name` each tick → sets `goblin:full_skin` (−1 = none, 0/1/2 = override index)
- Render controller checks `goblin:full_skin` first — if set, skips layered stack entirely
- Removing or changing the nametag returns the goblin to her randomized layers

### Animation Files
All confirmed complete in merged animation file:

| Key | Loop | Length | Notes |
|---|---|---|---|
| `walking` | loop | 4s | Full body walk, jiggle physics |
| `standing` | loop | 4s | Gentle idle, eye blink at ~2s |
| `leaning` | loop | 8s | Eyes closed, hunched forward, sleepy idle |
| `punching` | non-loop | 1s | Unarmed melee attack and mace attack |
| `swinging` | non-loop | 1s | Sword, axe, and tool attack |
| `loading` | hold_on_last_frame | 0.7s | Crossbow charge phase |
| `shooting` | hold_on_last_frame | 0.7s | Crossbow fire and recoil |
| `sitting` | loop | 12s | Seated pose, blink cycle |
| `resting` | loop | 12s | Relaxed seated, head tilted down |
| `drinking` | hold_on_last_frame | 2s | Honey bottle raised, belly grows, blush, bottle fades |
| `apple` | hold_on_last_frame | 2s | Apple eating, item baked into animation |
| `carrot` | hold_on_last_frame | 2s | Carrot eating, item baked into animation |
| `melon` | hold_on_last_frame | 2s | Melon eating, item baked into animation |
| `popping!!!` | hold_on_last_frame | 4s | Real pop — entity scales to 0 at 3.5s |
| `popping???` | hold_on_last_frame | 60s | Fake-out — merged with staying, full immobility |
| `relaxed` | hold_on_last_frame | — | Stage 1 body shape overlay |
| `bloated` | hold_on_last_frame | — | Stage 2 body shape overlay |
| `stuffed` | hold_on_last_frame | — | Stage 3 body shape overlay |
| `packed` | hold_on_last_frame | — | Stage 4 body shape overlay |

**Planned future animation (not blocking):**
- `mace_attack` — dedicated heavy smash; `punching` used in the meantime

---

## 🗡️ GOBLIN TYPES & WEAPON SYSTEM

### What Goblin Types Are
Goblins spawn as one of three variants determined at spawn. The variant affects starting weapon, texture color tones, and AI behavior. All three variants share the same stage, regression, and healing systems.

### Spawn Variants
| Type | `mark_variant` | Spawn Chance | Starting Weapon | Texture Tones |
|---|---|---|---|---|
| Normal | 0 | 65% | None | Green |
| Ranged | 1 | 25% | Crossbow (pre-loaded) | Yellow |
| Mace | 2 | 10% | Mace | Blue / purple |

### Weapon AI Priority
Priority determines which attack behavior fires first when multiple weapons are available:
1. **Mace** — closes to melee, uses `punching` animation
2. **Crossbow** — stays at range, uses `loading` → `shooting` sequence
3. **Picked-up gold weapon or tool** — melee, uses `swinging` (sword/axe/tools) or `punching` (mace)
4. **Unarmed** — fallback punch, uses `punching`

- Crossbow goblins still pick up dropped gold weapons out of greed, but crossbow attack always fires first
- Crossbow goblins are fully still during `loading` and `shooting` — no other animation layers
- Mace reuses `punching` for now — dedicated `mace_attack` planned as future polish

### Gold Item Pickup
Goblins pick up specific gold items they find on the ground. All other gold items are ignored.

| Category | Items | Effect on Pickup |
|---|---|---|
| Weapons | Golden sword, golden axe | Equipped in `rightItem`, melee with `swinging` |
| Tools | Golden shovel, golden pickaxe, golden hoe | Equipped in `rightItem`, melee with `swinging` |
| Mace | Mace | Equipped in `rightItem`, melee with `punching` |
| Food | Golden carrot, golden apple, glistering melon slice | Stored silently — backup heal, never displayed |
| Honey | Honey bottle | Triggers `drinking` animation → stage +1 |
| Currency | Gold ingot, gold nugget | Picked up and kept — purpose TBD |

---

## 🤝 TAMING

Taming converts a hostile wild goblin into a permanent companion. Wild goblins will not accept taming items unless the player is already non-hostile to them (wearing gold armor helps).

- **Method**: Hand-fed only — right-click with a taming item. Dropping items on the ground does not trigger taming.
- **Taming items**: Golden carrot, golden apple, cooked rabbit, glistering melon slice
- **Success chance**: ~10–20% per attempt (cat-level — multiple attempts expected)
- Once tamed the goblin follows her owner, defends them, and can be commanded to sit

---

## ⚔️ PIGLIN-STYLE GOLD BEHAVIOR

Wild goblins are hostile to players by default — they will attack on sight. However like piglins, they respect gold. A player wearing any single piece of gold armor causes wild goblins to ignore them entirely rather than attack. This gives players a way to interact with, feed, or tame wild goblins safely without needing to fight them first. Tamed goblins are never hostile to their owner regardless of armor.

---

## 🔢 STAGE SYSTEM

Stages represent how full the goblin is. As she eats honey she advances through four stages, each making her visually larger, slower, and more durable. Regression (described below) brings her back down over time.

| Stage | State | Speed | HP | Appearance |
|---|---|---|---|---|
| 1 | `relaxed` | 0.30 | 20 | Slim, base appearance |
| 2 | `bloated` | 0.27 | 24 | Noticeably bigger belly |
| 3 | `stuffed` | 0.24 | 28 | Large, slower movement |
| 4 | `packed` | 0.21 | 32 | Maximum size, eyes half-closed |

*(Speed and HP are placeholders — tune during testing)*

- Tracked via entity property `goblin:stage` (values 1–4)
- Stage body shape overlays are additive animations always playing on the base layer
- At stage 4 the goblin is at her largest and the pop system becomes active

### Stage Advancement
| Method | Condition | Effect |
|---|---|---|
| Hand-feed honey bottle | Right-click with `minecraft:honey_bottle` | `drinking` plays → stage +1 |
| Drop honey bottle | Goblin walks over and picks it up | `drinking` plays → stage +1 |
| Self-heal last resort | HP ≤ 8, food inventory empty, stage 4 | Seeks nearby honey → drinks → heals → pop risk |

- At stage 4 the goblin ignores honey bottles under normal circumstances
- She only seeks or accepts honey at stage 4 when near death and her food inventory is completely empty

---

## 💊 HEALING SYSTEM

When HP drops to 8 or below the goblin attempts to heal herself. She checks her inventory and surroundings in priority order:

1. **Gold food (inventory)** — silently consumes one food item, plays the matching eating animation (`apple`, `carrot`, or `melon`), movement is locked for 2 seconds, no stage change. This is the preferred heal at all stages.
2. **Honey bottle (last resort, stage 4 only)** — only used if food inventory is completely empty. Seeks a nearby dropped honey bottle or accepts one hand-fed. Full instant heal. Triggers the pop system.

### 50/50 at Stages 1–3
At stages 1–3, if both food and honey are available when HP is low, there is a **50% chance** she reaches for honey instead of food. At stage 4 this 50/50 does not apply — food is always tried first and honey is only a last resort.

### Spawn Inventory
- 5 honey bottles
- 3 golden carrots
- 3 golden apples
- 3 glistering melon slices

---

## 🍯 HONEY BOTTLE MECHANICS

- **Item**: Vanilla `minecraft:honey_bottle` — no custom item needed
- **Delivery**: Drop on ground (goblin walks over and picks it up) OR hand-feed (right-click)
- **Visual**: Bottle model baked into `drinking` animation, fades out at end
- **Movement**: Locked for full 2s duration of `drinking`
- **Result**: Stage advances by 1, goblin is healed

---

## 💥 POP SYSTEM (Stage 4 Only)

When the goblin drinks a honey bottle at stage 4 — whether self-induced or player-fed — she has reached her absolute limit. The pop system fires. There is no way to prevent it once honey is consumed at stage 4.

A random roll determines the outcome:

| Outcome | Animation | What Happens |
|---|---|---|
| **Real pop** (`popping!!!`) | 4s | Goblin scales to 0 at 3.5s, explosion fires, she dies naturally from her own blast |
| **Fake-out** (`popping???`) | 60s | Goblin falls into sitting pose, fully immobilized for 60 seconds, then recovers normally |

### Explosion Details (Real Pop Only)
- Uses `minecraft:explode` with `"breaks_blocks": false` and `"fire": false`
- Produces the visual effect, sound, and knockback of an explosion but causes zero terrain damage
- The explosion damages the goblin herself, killing her as a natural death — no kill command, no chat message
- Fires at the 3.5s mark in sync with the scale-to-zero keyframe in the animation

### Pop Randomness
- Decided via `math.random()` in Molang — no scripting needed for the split itself
- Exact percentage TBD (suggest 20–30% real pop chance)

### Movement Lock
- Both outcomes lock all movement for their full duration
- Fake-out lock: ~60 seconds — she cannot be commanded, attacked out of it, or interrupted
- Real pop lock: irrelevant as the entity is removed

---

## 📉 REGRESSION SYSTEM

### What Regression Is
Regression is the process of the goblin digesting and returning to a lower stage. It does not happen automatically over time — it requires the goblin to be in a resting pose (leaning) or receive active care from her tamed owner (belly rub while sitting). This is intentional: the player has to invest time and attention to bring her back down, which creates a meaningful loop around the feeding mechanic.

### The Digestion Timer
A single countdown timer `goblin:digestion_timer` tracks regression progress (in seconds, script-managed):

| Event | Effect | Notes |
|---|---|---|
| Leaning (passive) | −1 second per second | Counts down automatically while in lean pose |
| Belly rub (crouch + right-click, sitting) | −4 seconds per rub | Tamed owner only |
| Taking any hit | +1 second | Applies regardless of current pose |
| Timer reaches 0 | Regress one stage, timer resets to 20 | — |

- **Base timer**: 20 seconds
- **Maximum timer**: 25 seconds (overflow cap — hits cannot push it above 25)
- **Minimum timer**: 0 (triggers regression)
- Timer resets to 20 after each regression
- At stage 1 the timer still runs and resets harmlessly — regression has no effect at the base stage
- Taking damage while leaning interrupts the lean pose (goblin stands up, startled) but the timer value is preserved — she does not lose progress, the countdown simply pauses until she leans again

### Idle Pose Selection
When idle, the goblin autonomously chooses to sit or lean based on a weighted random roll. Stage affects the weighting because higher stages make sitting upright less comfortable:

| Stage | Sit % | Lean % |
|---|---|---|
| 1 | 100% | 0% |
| 2 | 75% | 25% |
| 3 | 50% | 50% |
| 4 | 25% | 75% |

- Leaning has a longer activation delay than sitting — she takes more time to slump into the lean
- The player can override and force sit at any time (tamed only) via right-click

---

## 🪑 SITTING / LEANING SYSTEM

### Autonomous Behavior
The goblin enters sitting or leaning poses on her own based on an idle timer and the stage-weighted roll above. She stands back up after some time or when provoked. Taking a hit while leaning causes her to stand up immediately (wolf behavior).

### Player Interactions (Tamed Only Unless Noted)
| Input | Goblin State | Effect |
|---|---|---|
| Right-click (empty hand) | Standing or leaning | Force sit |
| Right-click (empty hand) | Sitting | Stand up |
| Crouch + right-click (empty hand) | Sitting | Belly rub → −4s digestion timer |
| Right-click (taming item) | Wild | Tame attempt (~10–20% chance) |
| Right-click (honey bottle) | Any | Triggers `drinking` → stage +1 |
| Right-click (food item) | Any | Triggers matching eating animation |

---

## 🔒 MOVEMENT LOCK SYSTEM

Certain animations prevent all movement for their duration. A `locked_state` component group zeroes movement speed and removes navigation and AI goals on entry. It is removed when the animation completes via timer or script event.

| Animation | Duration | Unlock Method |
|---|---|---|
| `drinking` | 2s | Timer → unlock event |
| `apple` / `carrot` / `melon` | 2s each | Timer → unlock event |
| `loading` + `shooting` | ~1.4s total | Completes naturally |
| `popping!!!` | 4s | Entity killed — moot |
| `popping???` (merged) | ~60s | Timer → unlock at end |

---

## 🎨 FUTURE FEATURES

| Feature | Notes |
|---|---|
| `mace_attack` animation | Dedicated heavy smash — `punching` used for now |
| Belly rub reaction animation | Short jiggle + ear wiggle response (1–2s non-loop) |
| Sounds | Wire up original mod `.ogg` files via `sound_definitions.json` |
| Teleport to owner when too far | Standard tamed mob behavior |
| Dye cosmetic system | Visual collar / outfit color options |
| Remaining nametag textures | 2 more full textures to design — names and files TBD |
| Gold ingot / nugget behavior | Picked up, exact purpose TBD |

---

## ❌ NOT YET BUILT

- ❌ `goblin_behavior.json` — stages, taming, pickup, combat AI, healing, pop, movement lock, interactions
- ❌ `goblin_script.js` — digestion timer, regression, pop kill, texture randomization, nametag check
- ❌ `goblin_client.json` — entity resource definition, render controller layering
- ❌ `goblin.animation_controllers.json` — stage base layer, motion layer, weapon states, lock states

---

## 📁 FILE STATUS

| File | Status |
|---|---|
| `goblin.animation.json` | ✅ Complete |
| `goblin.states.json` | ✅ Complete |
| `goblin.pop.json` | ✅ Complete |
| `goblin.geo.json` | ✅ Complete |
| `goblin0–9.png` (skins) | ✅ Complete |
| `cloths0–7.png` | ✅ Complete |
| `hair0–15.png` | ✅ Complete |
| `poppy.png` | ✅ Complete |
| Remaining nametag textures | ❌ Not yet made |
| `goblin_client.json` | ❌ Not started |
| `goblin.animation_controllers.json` | ❌ Not started |
| `goblin_behavior.json` | ❌ Not started |
| `goblin_script.js` | ❌ Not started |

---

## 🎯 BUILD ORDER

1. `goblin.animation_controllers.json` — stage base layer, motion layer, weapon states, lock states
2. `goblin_behavior.json` — all components, events, and component groups
3. `goblin_client.json` — textures, render controller, animation wiring
4. `goblin_script.js` — digestion timer, regression, pop death, texture randomization, nametag

---

## 💡 DESIGN NOTES & DECISIONS

| # | Decision | Notes |
|---|---|---|
| 1 | Scripting API in use | Digestion timer, regression, pop kill, texture randomization, nametag |
| 2 | Leaning = passive digestion | Timer counts down automatically while in lean pose |
| 3 | Belly rub = active digestion | Crouch + right-click while sitting, tamed only, −4s per rub |
| 4 | Hits add time | +1s per hit, cap 25s, applies regardless of pose |
| 5 | Timer base 20s, cap 25s | Resets to 20 after each regression |
| 6 | Stage 1 timer resets harmlessly | No stage 0 — regression fires but has no effect |
| 7 | Hit interrupts leaning | Goblin stands up startled, timer value preserved |
| 8 | Vanilla honey bottle | No custom item needed |
| 9 | Honey via drop or hand-feed | Both methods work |
| 10 | Taming hand-fed only | Dropped items ignored for taming |
| 11 | Taming chance ~10–20% | Cat-level — multiple attempts expected |
| 12 | Cosmetic-only explosion | `breaks_blocks: false`, `fire: false` |
| 13 | Pop death = natural from own explosion | No kill command, no chat message |
| 14 | Pop randomness via Molang `math.random()` | No scripting needed for split |
| 15 | Stage 4 honey = last resort only | Near death + empty food inventory required |
| 16 | 50/50 honey vs food at stages 1–3 | Stage 4 always tries food first |
| 17 | Spawn inventory defined | 5 honey, 3 carrots, 3 apples, 3 melons |
| 18 | Eating locks movement | 2s lock, same as drinking |
| 19 | Left-hand items baked into animations | No `leftItem` bone needed |
| 20 | Crossbow fully still while firing | No animation layering during loading/shooting |
| 21 | Crossbow goblins still pick up weapons | Greed — crossbow priority unchanged |
| 22 | Mace = highest combat priority | Closes to melee, overrides everything |
| 23 | Mace reuses `punching` | No separate animation — future polish |
| 24 | `swinging` = sword, axe, all tools | All non-mace melee weapons |
| 25 | All gold tools picked up | Shovel, pickaxe, hoe included alongside weapons |
| 26 | Food always hidden | Silent inventory heal only — never displayed |
| 27 | Eye color baked into skin | No separate eye layer |
| 28 | Hair uses transparency hue overlay | Fewer textures, more variety |
| 29 | `mark_variant` reserved for goblin type | Not used for appearance randomization |
| 30 | Nametag trigger = filename without extension | `poppy.png` → nametag "Poppy" |
| 31 | Nametag overrides entire layered system | Full texture replaces all layers |
| 32 | Nametag traits exclusive | Cannot appear in random generation |
| 33 | Leaning bias increases with stage | Stage 4 = 75% lean, stage 1 = 100% sit |
| 34 | Leaning has longer activation delay | More time to slump than to sit |
| 35 | Piglin-style gold hostility | Non-hostile when player wears any gold armor piece |
| 36 | Gold pickup limited to specific items | Weapons, tools, food, honey, ingots, nuggets only |
