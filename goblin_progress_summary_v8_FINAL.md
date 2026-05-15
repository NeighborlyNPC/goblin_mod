# Goblin Girl Mob - Full Design Reference (v8 — FINAL)

## 📋 PROJECT OVERVIEW

**Platform**: Bedrock Edition (Behavior Pack + Resource Pack + Scripting API)  
**Editor**: VS Code with Blockception extension + Error Lens  
**Model Format**: Blockbench (`.geo.json`, `.animation.json`)  
**Source Mod**: Expandable Goblins (Java, Forge 1.20.1) by irritator-fan-nsfw  
**Port Type**: Mob-only port — mechanics rebuilt from scratch, assets custom-made  
**Pack Name**: Inflatable Loot Goblin  
**BP UUID**: c0bf06b0-0966-4e0b-9d64-c3765da4f7c0  
**RP UUID**: 8de6b703-01d9-4828-9503-e0f0744465f4  

---

## 🧠 HOW IT ALL FITS TOGETHER

The Goblin Girl is a tameable mob with four stages of growth driven by honey consumption. She starts slim and hostile, grows larger and tankier as she drinks, and regresses over time through rest and player interaction. Wild goblins are greedy and dangerous — they pick up gold items, steal loot, and can only be reasoned with through gold. Tamed goblins are loyal companions that fight for their owner, accept normal food, and are protected from player-induced popping. The core gameplay loop is: encounter → wear gold to approach safely → tame or barter → feed and manage her size → keep her comfortable through belly rubs and rest.

---

## ✅ CONFIRMED ASSETS

### Geometry File (`goblins.geo.json`)
Single file containing all six geometry identifiers:

| Identifier | Used By | Notes |
|---|---|---|
| `geometry.goblin_zero` | `bridge:goblin_zero` | Stage 0 — slim, base |
| `geometry.goblin_one` | `bridge:goblin_one` | Stage 1 |
| `geometry.goblin_two` | `bridge:goblin_two` | Stage 2 |
| `geometry.goblin_three` | `bridge:goblin_three` | Stage 3 — maximum |
| `geometry.honey` | `bridge:goblin_bottle` | Honey bottle prop |
| `geometry.food` | `bridge:goblin_food` | Food item prop |

### Texture System
Four rendering layers combined in render controller:

| Layer | Files | Count | Query |
|---|---|---|---|
| Skin + eyes | `goblin/goblin0–9.png` | 10 | `query.variant` |
| Clothes | `cloth/cloth0–9.png` | 10 | `query.skin_id` |
| Hair | `hair/hair0–15.png` | 16 | `goblin:hair_index` (script) |
| Type | Set by weapon spawn roll | 0/1/2 | `query.mark_variant` |

- Eye color baked into each skin texture
- Hair uses transparency hue overlay
- `query.mark_variant` reserved for goblin type — not randomized

### Nametag Easter Eggs
| File | Trigger | Status |
|---|---|---|
| `name/poppy.png` | "Poppy" | ✅ |
| `name/tristana.png` | "Tristana" | ✅ |
| `name/malvah.png` | "Malvah" | ✅ |
| `name/smug.png` | "Smug" | ✅ |
| `name/gobu.png` | "Gobu" | ✅ |
| `name/jackie.png` | "Jackie" | ✅ |

- Script checks `entity.nameTag` → sets `goblin:name` (-1 = none, 0–5 = override)
- Render controller checks `goblin:name` first — overrides all layers if set
- Exclusive traits — cannot appear in random generation

### Animation File (`goblins.animation.json`)
All four stage entities share the same animations with two exceptions:

| Key | Loop | Notes |
|---|---|---|
| `animation.goblin.walking` | loop | Shared all stages |
| `animation.goblin.standing` | loop | Shared all stages |
| `animation.goblin.leaning` | loop | Shared all stages |
| `animation.goblin.punching` | non-loop | Unarmed + mace |
| `animation.goblin.swinging` | non-loop | Sword / axe / tools |
| `animation.goblin.loading` | hold_on_last_frame | Crossbow charge |
| `animation.goblin.shooting` | hold_on_last_frame | Crossbow fire |
| `animation.goblin.sitting_0_1` | loop | Stages 0 and 1 only |
| `animation.goblin.sitting_2_3` | loop | Stages 2 and 3 only |
| `animation.goblin.resting` | loop | Shared all stages |
| `animation.goblin.drinking` | hold_on_last_frame | Stages 0–2 only |
| `animation.goblin.eating` | hold_on_last_frame | Single animation, food entity handles appearance |
| `animation.goblin.pop_real` | hold_on_last_frame | 4s — stage 3 untamed self-induced only |
| `animation.goblin.pop_fake` | hold_on_last_frame | 30s — stage 3 |

**Future animation (not blocking):**
- `animation.goblin.mace_attack` — dedicated smash, `punching` used for now

---

## 🗡️ GOBLIN TYPES & WEAPON SYSTEM

### Spawn Variants
| Type | `mark_variant` | Spawn Chance | Starting Weapon |
|---|---|---|---|---|
| Normal | 0 | 65% | None |
| Ranged | 1 | 25% | Crossbow |
| Mace | 2 | 10% | Mace |

### Weapon AI Priority
1. **Mace** — closes to melee, uses `punching`
2. **Crossbow** — stays at range, uses `loading` → `shooting`
3. **Picked-up gold weapon / tool** — melee, uses `swinging` or `punching`
4. **Unarmed** — fallback, uses `punching`

### Gold Item Pickup (Wild and Tamed)
| Item | Picked Up? | Effect |
|---|---|---|
| Honey bottle | Hand-fed only | Triggers drinking → stage advance |
| Golden carrot / apple / melon | Floor or hand-fed | Stored in inventory — backup heal |
| Normal food | Hand-fed tamed only | Plays eating animation immediately |
| Gold sword / axe / tools | Floor | Equipped in `rightItem` |
| Mace | Floor | Equipped in `rightItem` |
| Gold ingot | Floor | Kept — barter currency |
| Gold nugget | Floor | Kept — no barter value |

---

## 🤝 TAMING

- **Method**: Hand-fed only
- **Items**: Golden carrot, golden apple, glistering melon slice
- **Chance**: ~15% per attempt (cat-level)
- **Any stage** — taming can happen at any stage since goblins self-drink at low health
- Wild goblins non-hostile when player wears any gold armor piece
- Tamed goblins never hostile to owner

---

## ⚔️ PIGLIN-STYLE GOLD BEHAVIOR

- Wild goblins hostile by default
- Non-hostile when player wears any single gold armor piece
- Tamed goblins never hostile to owner regardless of armor

---

## 💰 BARTERING SYSTEM

- Wild goblins pick up any items from the ground and store them as stolen loot
- Player gives a valid gold item → goblin drops all stolen non-gold loot
- **Valid barter items**: gold ingot, gold sword, gold axe, gold tools, mace, gold food
- **Not valid**: gold nugget (too cheap — kept but no barter effect)
- Gold items given as barter are kept permanently — never returned
- On death: 50% chance per slot to drop stolen loot (encourages bartering over killing)

---

## 🔢 STAGE SYSTEM

### Stage Overview
| Stage | Entity ID | Sitting Anim | Speed | HP |
|---|---|---|---|---|
| 0 | `bridge:goblin_zero` | `sitting_0_1` | 0.30 | 20 |
| 1 | `bridge:goblin_one` | `sitting_0_1` | 0.27 | 24 |
| 2 | `bridge:goblin_two` | `sitting_2_3` | 0.24 | 28 |
| 3 | `bridge:goblin_three` | `sitting_2_3` | 0.21 | 32 |

- Stage transitions handled by `minecraft:transformation`
- Regression also handled by `minecraft:transformation`

### Stage Advancement
| Method | Condition | Effect |
|---|---|---|
| Hand-feed honey | Right-click with honey bottle | Bottle displays until drinking animation ends → transforms to next stage |
| Self-heal last resort | Low HP, no food, see healing system | Drinks honey → heals → transforms |

### Stage 3 Honey Behavior
| Scenario | Outcome |
|---|---|
| Tamed — player hand-feeds honey | Always plays `pop_fake` (30s), no real pop possible |
| Tamed — self-induced at low health | 75% fake-out / 25% real pop |
| Untamed — self-induced at low health | 50% fake-out / 50% real pop |
| Untamed — player hand-feeds honey | 50% fake-out / 50% real pop |

---

## 🍯 HONEY BOTTLE MECHANICS

- **Delivery**: Hand-fed only (right-click) — floor pickup removed
- **Display**: Bottle entity visible until drinking animation completes
- **Movement lock**: Cannot move during `drinking` or pop animations
- **Spawn inventory**: 5 honey bottles

---

## 🍎 FOOD MECHANICS

### Hand-Fed Food
| Recipient | Food Type | Effect |
|---|---|---|
| Tamed goblin | Normal food | Plays eating animation immediately |
| Tamed goblin | Gold food | Stored in inventory — backup heal |
| Wild goblin | Gold food | Displays for 5s → stored in inventory |
| Wild goblin | Normal food | Rejected — not accepted |

### Floor Pickup
| Item | Who picks up? | Effect |
|---|---|---|
| Gold food | Wild and tamed | Displays for 5s → stored in inventory |
| Normal food | Nobody | Ignored |

### Food Display
- Hand-fed: food entity visible until animation completes
- Floor pickup: food entity visible for 5 seconds then put away

---

## 💊 HEALING SYSTEM

Triggered when HP ≤ 8. Goblin chooses between honey and food based on stage bias:

| Stage | Honey % | Food % | Notes |
|---|---|---|---|
| 0 | 100% | 0% | No pop risk — always drinks honey |
| 1 | 75% | 25% | Low risk |
| 2 | 50% | 50% | Equal chance |
| 3 | 25% | 75% | High pop risk — strongly prefers food |

- If preferred option unavailable, falls back to the other
- If neither available, no self-heal occurs

---

## 📉 REGRESSION SYSTEM

### Digestion Timer (`goblin:digestion_timer`)
Single countdown from 20 seconds:

| Event | Effect | Cap |
|---|---|---|
| Leaning (passive) | −1s per second | Floor: 0 |
| Belly rub (crouch + right-click, sitting, tamed) | −4s per rub | Floor: 0 |
| Taking any hit | +1s | Ceiling: 25s |
| Timer hits 0 | Transforms back one stage via `minecraft:transformation`, resets to 20s | — |

- Timer persists through pose changes — no reset on standing
- At stage 0 timer resets harmlessly — no stage below 0

### Idle Pose Bias
| Stage | Sit % | Lean % |
|---|---|---|
| 0 | 100% | 0% |
| 1 | 75% | 25% |
| 2 | 50% | 50% |
| 3 | 25% | 75% |

- No activation delay difference between sitting and leaning — whichever is rolled plays immediately
- Player can force sit at any time (tamed only) via right-click

---

## 🪑 SITTING / LEANING SYSTEM

### Player Interactions (Tamed Only Unless Noted)
| Input | Goblin State | Effect |
|---|---|---|
| Right-click (empty hand) | Standing / leaning | Force sit |
| Right-click (empty hand) | Sitting | Stand up |
| Crouch + right-click (empty hand) | Sitting | Belly rub → −4s timer |
| Right-click (honey bottle) | Any, stages 0–2 | Triggers drinking |
| Right-click (honey bottle) | Stage 3, tamed | Plays pop_fake (30s) |
| Right-click (honey bottle) | Stage 3, untamed (gold armor) | 50/50 pop |
| Right-click (normal food) | Tamed | Plays eating animation |
| Right-click (gold food) | Any | Displays 5s → inventory |
| Right-click (taming item) | Wild | Tame attempt (~15%) |

---

## 🔒 MOVEMENT LOCK SYSTEM

| Animation | Duration | Unlock |
|---|---|---|
| `drinking` | Until animation ends | Auto |
| `eating` | Until animation ends | Auto |
| `pop_real` | 4s | Entity transforms / dies |
| `pop_fake` | 30s | Timer → unlock |
| `loading` + `shooting` | ~1.4s | Auto |

---

## 💥 POP SYSTEM (Stage 3 Only)

### Explosion (Real Pop)
- `minecraft:explode` with `breaks_blocks: false`, `fire: false`
- Visual + sound + knockback only
- Goblin dies naturally from own explosion — no kill command, no chat message
- Script fires explosion at correct animation frame

### Pop Outcomes
| Outcome | Animation | Duration | Result |
|---|---|---|---|
| Real pop | `pop_real` | 4s | Dies from own explosion |
| Fake-out | `pop_fake` | 30s | Recovers, resumes normal behavior |

---

## 🔊 SOUNDS

Registered in `sound_definitions.json`:

| Key | Used In | Files |
|---|---|---|
| `goblin.drink` | `drinking` animation keyframe | `drink1/2/3.ogg` |
| `goblin.eat` | `eating` animation keyframe | TBD |
| `goblin.pop` | `pop_real` animation keyframe | `pop.ogg` |
| `goblin.burp` | Script — on regression | `burp2/3/4.ogg` |
| `goblin.hurt` | Script — on damage | `goblin_hurt1/2/3.ogg` |
| `goblin.rumble` | Script — on stage advance | `bloat1/2/3/5/6.ogg` |

- All sounds use pitch variance `[0.85, 1.15]` for natural variation
- Multiple files per key where available — Bedrock picks randomly

---

## 🎨 FUTURE FEATURES

| Feature | Notes |
|---|---|
| `animation.goblin.mace_attack` | Dedicated smash — `punching` used now |
| Belly rub reaction animation | Short jiggle + ear wiggle |
| Teleport to owner when too far | Standard tamed mob behavior |
| Dye cosmetic system | Visual collar / outfit colors |

---

## ❌ NOT YET BUILT

- ❌ `goblin_zero.json` — behavior file stage 0
- ❌ `goblin_one.json` — behavior file stage 1
- ❌ `goblin_two.json` — behavior file stage 2
- ❌ `goblin_three.json` — behavior file stage 3
- ❌ `goblin_bottle.json` — bottle prop entity
- ❌ `goblin_food.json` — food prop entity
- ❌ `goblin_script.js` — full rewrite
- ❌ `goblin_zero.client.json` through `goblin_three.client.json`
- ❌ `goblin_bottle.client.json`, `goblin_food.client.json`
- ❌ `goblin.animation_controllers.json` — rewrite for new structure
- ❌ `goblin_render_controller.json` — carries over mostly unchanged

---

## 📁 FILE STATUS

| File | Status |
|---|---|
| `goblins.geo.json` | ✅ Complete |
| `goblins.animation.json` | ✅ Complete |
| Skin / cloth / hair textures | ✅ Complete |
| Nametag textures (6) | ✅ Complete |
| `sound_definitions.json` | ✅ Complete |
| All behavior files | ❌ Not started |
| All client entities | ❌ Not started |
| Animation controllers | ❌ Not started |
| Script | ❌ Not started (rewrite) |

---

## 🎯 BUILD ORDER

1. `goblin.animation_controllers.json` — simplified, no stage layer needed
2. `goblin_zero.json` through `goblin_three.json` — behavior files with `minecraft:transformation`
3. `goblin_bottle.json` + `goblin_food.json` — prop entity behaviors
4. Client entities for all six entity identifiers
5. `goblin_script.js` — digestion timer, regression, pop system, texture randomization, nametag, bartering, healing bias, hurt sound

---

## 💡 DESIGN NOTES & DECISIONS

| # | Decision | Notes |
|---|---|---|
| 1 | Four separate entity identifiers | `minecraft:transformation` handles stage changes — no despawn flicker |
| 2 | Single shared animation file | All stages share animations except `sitting_0_1` and `sitting_2_3` |
| 3 | Stage 3 uses pop animations | `drinking` replaced by `pop_real` or `pop_fake` at stage 3 |
| 4 | Tamed stage 3 always pop_fake | Player can never cause a real pop on a tamed goblin |
| 5 | Untamed stage 3 = 50/50 | Incentivizes taming before reaching stage 3 |
| 6 | Tamed self-induced = 75/25 | Tamed goblins safer but not immune to self-pop |
| 7 | pop_fake = 30s | Reduced from 60s for better gameplay feel |
| 8 | Leaning = passive digestion | Ticks automatically while in lean pose |
| 9 | Belly rub = active digestion | Crouch + right-click while sitting, tamed only, −4s |
| 10 | Hits add time | +1s per hit, cap 25s |
| 11 | No leaning delay | Whichever pose is rolled plays immediately |
| 12 | Honey hand-fed only | Floor pickup removed for honey |
| 13 | Gold food floor pickup displays 5s | Then stored in inventory silently |
| 14 | Hand-fed items display until animation ends | Honey bottle and food both |
| 15 | Normal food tamed only | Wild goblins too stubborn to accept it |
| 16 | Healing bias mirrors lean/sit ratio | Stage 3 strongly prefers food over honey |
| 17 | Bartering uses all gold except nugget | Nugget too cheap — kept but no effect |
| 18 | Death drops 50% of stolen loot | Incentivizes bartering over killing |
| 19 | Bottle entity persists | Held casually at certain stages, not just during drinking |
| 20 | Food entity = single entity | `query.variant` selects texture — normal and gold variants |
| 21 | Taming at any stage | Goblins self-drink so can be found at any stage |
| 22 | Piglin-style gold hostility | Non-hostile when player wears any gold armor piece |
| 23 | Nametag system uses `goblin:name` | -1 = none, 0–5 = named skin override |
| 24 | Eye color baked into skin | No separate eye layer |
| 25 | Hair uses transparency hue overlay | Fewer textures, more variety |
| 26 | VS Code + Blockception + Error Lens | Replaced Bridge for editing — catches errors in real time |
