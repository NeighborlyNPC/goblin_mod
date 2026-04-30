import {
    world,
    system,
    EntityInventoryComponent,
    EntityEquippableComponent,
    EquipmentSlot,
    ItemStack
} from "@minecraft/server";

const GOBLIN_ID = "bridge:goblin";

const GOLD_WEAPONS = [
    "minecraft:golden_sword",
    "minecraft:golden_axe"
];

const GOLD_TOOLS = [
    "minecraft:golden_shovel",
    "minecraft:golden_pickaxe",
    "minecraft:golden_hoe"
];

const MACE_ITEMS = [
    "minecraft:mace"
];

const GOLD_FOOD = [
    "minecraft:golden_carrot",
    "minecraft:golden_apple",
    "minecraft:glistering_melon_slice"
];

const GOLD_CURRENCY = [
    "minecraft:gold_ingot",
    "minecraft:gold_nugget"
];

const NAMETAG_SKINS = {
    "Poppy": 0
};

const LOCK_DURATIONS = {
    0: 2.0,
    1: 2.0,
    2: 2.0,
    3: 2.0,
    4: 3.5,
    5: 62.0
};

const popTimers = new Map();
const lockTimers = new Map();
const crossbowTimers = new Map();
const digestTimers = new Map();

function getProperty(entity, prop) {
    try { return entity.getProperty(prop); } catch { return undefined; }
}

function setProperty(entity, prop, value) {
    try { entity.setProperty(prop, value); } catch (e) {
        console.warn(`[Goblin] setProperty ${prop} failed: ${e}`);
    }
}

function triggerEvent(entity, event) {
    try { entity.triggerEvent(event); } catch (e) {
        console.warn(`[Goblin] triggerEvent ${event} failed: ${e}`);
    }
}

function playSound(entity, sound) {
    try {
        const loc = entity.location;
        entity.dimension.playSound(sound, loc, { volume: 1.0, pitch: 0.9 + Math.random() * 0.2 });
    } catch (e) {
        console.warn(`[Goblin] playSound ${sound} failed: ${e}`);
    }
}

function getInventory(entity) {
    try { return entity.getComponent("minecraft:inventory")?.container; } catch { return null; }
}

function hasItemInInventory(entity, itemId) {
    const inv = getInventory(entity);
    if (!inv) return false;
    for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        if (item?.typeId === itemId) return true;
    }
    return false;
}

function removeItemFromInventory(entity, itemId) {
    const inv = getInventory(entity);
    if (!inv) return false;
    for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        if (item?.typeId === itemId) {
            if (item.amount > 1) {
                item.amount -= 1;
                inv.setItem(i, item);
            } else {
                inv.setItem(i, undefined);
            }
            return true;
        }
    }
    return false;
}

function hasGoldFood(entity) {
    return GOLD_FOOD.some(id => hasItemInInventory(entity, id));
}

function hasHoneyBottle(entity) {
    return hasItemInInventory(entity, "minecraft:honey_bottle");
}

function getFoodAnim(entity) {
    for (const id of GOLD_FOOD) {
        if (hasItemInInventory(entity, id)) {
            if (id === "minecraft:golden_apple") return 1;
            if (id === "minecraft:golden_carrot") return 2;
            if (id === "minecraft:glistering_melon_slice") return 3;
        }
    }
    return 1;
}

function getFoodEvent(entity) {
    for (const id of GOLD_FOOD) {
        if (hasItemInInventory(entity, id)) {
            if (id === "minecraft:golden_apple") return "goblin:lock_apple";
            if (id === "minecraft:golden_carrot") return "goblin:lock_carrot";
            if (id === "minecraft:glistering_melon_slice") return "goblin:lock_melon";
        }
    }
    return "goblin:lock_apple";
}

function healWithFood(entity) {
    const foodEvent = getFoodEvent(entity);
    const foodId = foodEvent === "goblin:lock_apple" ? "minecraft:golden_apple"
        : foodEvent === "goblin:lock_carrot" ? "minecraft:golden_carrot"
            : "minecraft:glistering_melon_slice";

    removeItemFromInventory(entity, foodId);
    triggerEvent(entity, "goblin:apply_lock");
    triggerEvent(entity, foodEvent);
    setProperty(entity, "goblin:locked", true);
    setProperty(entity, "goblin:lock_anim", getFoodAnim(entity));

    try { entity.addEffect("minecraft:instant_health", 1, { amplifier: 0 }); } catch { }

    const id = entity.id;
    const existing = lockTimers.get(id);
    if (existing) system.clearRun(existing);
    const handle = system.runTimeout(() => {
        try {
            triggerEvent(entity, "goblin:remove_lock");
        } catch { }
        lockTimers.delete(id);
    }, Math.floor(2.0 * 20));
    lockTimers.set(id, handle);
}

function startPopSequence(entity) {
    const id = entity.id;
    const isReal = Math.random() < 0.25;

    if (isReal) {
        triggerEvent(entity, "goblin:pop_real");
        const handle = system.runTimeout(() => {
            try {
                triggerEvent(entity, "goblin:apply_explosion");
            } catch { }
            popTimers.delete(id);
        }, Math.floor(3.5 * 20));
        popTimers.set(id, handle);
    } else {
        triggerEvent(entity, "goblin:pop_fake");
        const handle = system.runTimeout(() => {
            try {
                triggerEvent(entity, "goblin:remove_lock");
            } catch { }
            popTimers.delete(id);
        }, Math.floor(62.0 * 20));
        popTimers.set(id, handle);
    }
}

function advanceStage(entity) {
    const stage = getProperty(entity, "goblin:stage");
    if (stage === undefined) return;

    if (stage >= 4) {
        startPopSequence(entity);
        return;
    }

    const eventMap = { 1: "goblin:set_stage_2", 2: "goblin:set_stage_3", 3: "goblin:set_stage_4" };
    if (eventMap[stage]) triggerEvent(entity, eventMap[stage]);

    try { entity.addEffect("minecraft:instant_health", 1, { amplifier: 1 }); } catch { }
}

function startDrinkLock(entity) {
    const id = entity.id;
    const existing = lockTimers.get(id);
    if (existing) system.clearRun(existing);

    const handle = system.runTimeout(() => {
        try {
            triggerEvent(entity, "goblin:remove_lock");
        } catch { }
        lockTimers.delete(id);
    }, Math.floor(2.0 * 20));
    lockTimers.set(id, handle);
}

function equipWeapon(entity, itemId) {
    try {
        const equip = entity.getComponent("minecraft:equippable");
        if (!equip) return;
        const item = new ItemStack(itemId, 1);
        equip.setEquipment(EquipmentSlot.Mainhand, item);
    } catch (e) {
        console.warn(`[Goblin] equipWeapon failed: ${e}`);
    }
}

function updateWeaponState(entity, itemId) {
    let state = 0;
    if (GOLD_WEAPONS.includes(itemId) || GOLD_TOOLS.includes(itemId)) state = 1;
    else if (itemId === "minecraft:crossbow") state = 2;
    else if (MACE_ITEMS.includes(itemId)) state = 3;
    setProperty(entity, "goblin:weapon_state", state);
}

function handlePickup(entity, itemId) {
    if (itemId === "minecraft:honey_bottle") {
        const stage = getProperty(entity, "goblin:stage");
        const locked = getProperty(entity, "goblin:locked");
        if (locked) return;
        if (stage === 4) return;
        triggerEvent(entity, "goblin:on_fed_honey");
        startDrinkLock(entity);
        advanceStage(entity);
        return;
    }

    if (GOLD_WEAPONS.includes(itemId) || GOLD_TOOLS.includes(itemId)) {
        const currentWeapon = getProperty(entity, "goblin:weapon_state");
        if (currentWeapon !== 2) {
            equipWeapon(entity, itemId);
            updateWeaponState(entity, itemId);
            triggerEvent(entity, "goblin:set_weapon_sword");
        }
        return;
    }

    if (MACE_ITEMS.includes(itemId)) {
        equipWeapon(entity, itemId);
        updateWeaponState(entity, itemId);
        triggerEvent(entity, "goblin:set_weapon_mace");
        return;
    }

    if (GOLD_FOOD.includes(itemId)) {
        return;
    }

    if (GOLD_CURRENCY.includes(itemId)) {
        return;
    }
}

function checkLowHealth(entity) {
    try {
        const health = entity.getComponent("minecraft:health");
        if (!health) return;
        const current = health.currentValue;
        const max = health.effectiveMax;
        if (current > (max * 0.4)) return;

        const locked = getProperty(entity, "goblin:locked");
        if (locked) return;

        const stage = getProperty(entity, "goblin:stage");
        const hasFood = hasGoldFood(entity);
        const hasHoney = hasHoneyBottle(entity);

        if (hasFood && hasHoney) {
            if (stage === 4) {
                healWithFood(entity);
            } else {
                if (Math.random() < 0.5) {
                    triggerEvent(entity, "goblin:on_fed_honey");
                    startDrinkLock(entity);
                    advanceStage(entity);
                } else {
                    healWithFood(entity);
                }
            }
        } else if (hasFood) {
            healWithFood(entity);
        } else if (hasHoney) {
            if (stage === 4) {
                triggerEvent(entity, "goblin:on_fed_honey");
                startDrinkLock(entity);
                startPopSequence(entity);
            } else {
                triggerEvent(entity, "goblin:on_fed_honey");
                startDrinkLock(entity);
                advanceStage(entity);
            }
        }
    } catch (e) {
        console.warn(`[Goblin] checkLowHealth failed: ${e}`);
    }
}

function tickDigestion(entity) {
    try {
        const pose = getProperty(entity, "goblin:idle_pose");
        const locked = getProperty(entity, "goblin:locked");
        if (locked) return;
        if (pose !== 2) return;

        const id = entity.id;
        let timer = digestTimers.get(id) ?? 20.0;

        timer -= (1 / 20);
        if (timer <= 0) {
            timer = 20.0;
            triggerEvent(entity, "goblin:on_regress");
            playSound(entity, "goblin.burp");
        }

        digestTimers.set(id, timer);
    } catch { }
}

function onBellyRub(entity) {
    const id = entity.id;
    let timer = digestTimers.get(id) ?? 20.0;
    timer = Math.max(0, timer - 4.0);

    if (timer <= 0) {
        timer = 20.0;
        triggerEvent(entity, "goblin:on_regress");
        playSound(entity, "goblin.burp");
    }

    digestTimers.set(id, timer);
}

function onHurt(entity) {
    const id = entity.id;
    let timer = digestTimers.get(id) ?? 20.0;
    timer = Math.min(25.0, timer + 1.0);
    digestTimers.set(id, timer);
}

function initGoblin(entity) {
    try {
        const skinIndex = Math.floor(Math.random() * 10);
        const clothesIndex = Math.floor(Math.random() * 8);
        const hairIndex = Math.floor(Math.random() * 16);

        setProperty(entity, "goblin:hair_index", hairIndex);

        try {
            entity.setDynamicProperty("goblin:skin_index", skinIndex);
            entity.setDynamicProperty("goblin:clothes_index", clothesIndex);
        } catch { }

        try {
            const equip = entity.getComponent("minecraft:equippable");
            const mainhand = equip?.getEquipment(EquipmentSlot.Mainhand);
            if (mainhand) {
                updateWeaponState(entity, mainhand.typeId);
            }
        } catch { }

        const inv = getInventory(entity);
        if (inv) {
            const spawnItems = [
                { id: "minecraft:honey_bottle", count: 5 },
                { id: "minecraft:golden_carrot", count: 3 },
                { id: "minecraft:golden_apple", count: 3 },
                { id: "minecraft:glistering_melon_slice", count: 3 }
            ];
            for (const entry of spawnItems) {
                try {
                    const item = new ItemStack(entry.id, entry.count);
                    inv.addItem(item);
                } catch { }
            }
        }

        digestTimers.set(entity.id, 20.0);
    } catch (e) {
        console.warn(`[Goblin] initGoblin failed: ${e}`);
    }
}

function checkNametag(entity) {
    try {
        const name = entity.nameTag;
        if (!name) {
            const current = getProperty(entity, "goblin:full_skin");
            if (current !== -1) setProperty(entity, "goblin:full_skin", -1);
            return;
        }
        const skinIndex = NAMETAG_SKINS[name];
        if (skinIndex !== undefined) {
            const current = getProperty(entity, "goblin:full_skin");
            if (current !== skinIndex) setProperty(entity, "goblin:full_skin", skinIndex);
        } else {
            const current = getProperty(entity, "goblin:full_skin");
            if (current !== -1) setProperty(entity, "goblin:full_skin", -1);
        }
    } catch { }
}

let tickCounter = 0;

system.runInterval(() => {
    tickCounter++;
    const isSlowTick = tickCounter % 20 === 0;
    const isVerySlowTick = tickCounter % 100 === 0;

    for (const entity of world.getDimension("overworld").getEntities({ type: GOBLIN_ID })) {
        tickDigestion(entity);
        if (isSlowTick) {
            checkLowHealth(entity);
            checkNametag(entity);
        }
    }

    if (isVerySlowTick) {
        for (const dim of ["nether", "the_end"]) {
            try {
                for (const entity of world.getDimension(dim).getEntities({ type: GOBLIN_ID })) {
                    tickDigestion(entity);
                    checkLowHealth(entity);
                    checkNametag(entity);
                }
            } catch { }
        }
    }
}, 1);

world.afterEvents.entitySpawn.subscribe(ev => {
    const entity = ev.entity;
    if (entity.typeId !== GOBLIN_ID) return;
    system.runTimeout(() => initGoblin(entity), 2);
});

world.afterEvents.entityHurt.subscribe(ev => {
    const entity = ev.hurtEntity;
    if (entity.typeId !== GOBLIN_ID) return;
    onHurt(entity);
});

world.afterEvents.dataDrivenEntityTrigger.subscribe(ev => {
    const entity = ev.entity;
    if (entity.typeId !== GOBLIN_ID) return;
    const id = ev.eventId;

    if (id === "goblin:on_belly_rub") {
        onBellyRub(entity);
    }

    if (id === "goblin:on_fed_honey") {
        startDrinkLock(entity);
        advanceStage(entity);
    }

    if (id === "goblin:on_fed_food") {
        const foodAnim = getFoodAnim(entity);
        setProperty(entity, "goblin:lock_anim", foodAnim);
    }

    if (id === "goblin:on_melee_attack") {
        system.runTimeout(() => {
            try {
                setProperty(entity, "goblin:attacking", false);
            } catch { }
        }, 20);
    }

    if (id === "goblin:on_ranged_attack") {
        const eid = entity.id;
        setProperty(entity, "goblin:crossbow_phase", 1);

        const existing = crossbowTimers.get(eid);
        if (existing) system.clearRun(existing);

        const h1 = system.runTimeout(() => {
            try { setProperty(entity, "goblin:crossbow_phase", 2); } catch { }

            const h2 = system.runTimeout(() => {
                try {
                    setProperty(entity, "goblin:crossbow_phase", 0);
                    setProperty(entity, "goblin:attacking", false);
                    triggerEvent(entity, "goblin:remove_crossbow_lock");
                } catch { }
                crossbowTimers.delete(eid);
            }, 14);
            crossbowTimers.set(eid, h2);
        }, 14);
        crossbowTimers.set(eid, h1);
    }
});

world.afterEvents.playerInteractWithEntity.subscribe(ev => {
    const entity = ev.target;
    if (entity.typeId !== GOBLIN_ID) return;

    const player = ev.player;
    const item = ev.itemStack;
    if (!item) return;

    const id = item.typeId;

    if (GOLD_WEAPONS.includes(id) || GOLD_TOOLS.includes(id) || MACE_ITEMS.includes(id)) {
        handlePickup(entity, id);
    }
});

world.afterEvents.entityDie.subscribe(ev => {
    const entity = ev.deadEntity;
    if (entity.typeId !== GOBLIN_ID) return;
    const eid = entity.id;

    const p = popTimers.get(eid);
    if (p) { system.clearRun(p); popTimers.delete(eid); }
    const l = lockTimers.get(eid);
    if (l) { system.clearRun(l); lockTimers.delete(eid); }
    const c = crossbowTimers.get(eid);
    if (c) { system.clearRun(c); crossbowTimers.delete(eid); }
    digestTimers.delete(eid);
});
