-- ============================================================================
-- Recipe App — SQLite Schema (revised)
--
-- Changes from the original, and why:
--
-- 1. COMPONENT COLLISIONS: a Component belongs to exactly one Recipe (per the
--    TS data model, `components: Component[]` is nested inside Recipe — it's
--    not shared). The original schema keyed `components` globally by `name`
--    with a many-to-many junction, so two recipes both containing a "Dough"
--    component would collide on the same row. Fixed by giving `components` a
--    surrogate `id`, a direct `recipe_id` foreign key (one-to-many, no more
--    `recipe_components` junction table), and scoping name-uniqueness to
--    `(recipe_id, name)` instead of globally.
--
-- 2. RENAME CASCADES: `recipes.name` was the primary key, so renaming a
--    recipe required manually updating every child table (no
--    ON UPDATE CASCADE in SQLite by default). Fixed by giving `recipes` a
--    surrogate `id` as the real primary key; `name` is now just a UNIQUE
--    column, so a rename is a single UPDATE and every child row (which
--    references `recipe_id`, not the name) is unaffected.
--
-- 3. ORPHANED MASTER ROWS: `ingredients`, `equipment`, and `tags` are
--    legitimately shared master data (many recipes reuse "flour," "whisk,"
--    "vegan"), but deleting the last reference to one left a dangling row
--    behind. Fixed with AFTER DELETE triggers that remove the master row
--    once nothing references it anymore. `components` no longer needs this
--    treatment — since it's now owned one-to-one by a recipe with
--    ON DELETE CASCADE, deleting a recipe deletes its components outright.
--
-- Two PRAGMAs are required for this to behave correctly and must be run on
-- EVERY new connection (SQLite does not persist them in the DB file):
--   - foreign_keys = ON      -> without this, ON DELETE CASCADE is a no-op
--   - recursive_triggers = ON -> without this, the GC triggers below won't
--                                 fire when a delete happens via cascade
--                                 (e.g. deleting a recipe cascades into
--                                 component_ingredients, which should then
--                                 fire trg_gc_ingredients)
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA recursive_triggers = ON;

CREATE TABLE IF NOT EXISTS recipes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL UNIQUE,
    num_servings INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
    filepath  TEXT PRIMARY KEY NOT NULL,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

-- A component now belongs to exactly one recipe (one-to-many via recipe_id).
-- The old `recipe_components` junction table is gone — it modeled a
-- many-to-many relationship that never actually existed in the data model.
CREATE TABLE IF NOT EXISTS components (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    directions TEXT NOT NULL,
    prep_time  INTEGER NOT NULL,
    cook_time  INTEGER NOT NULL,
    UNIQUE (recipe_id, name)
);

CREATE TABLE IF NOT EXISTS tags (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_tags (
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag       TEXT NOT NULL REFERENCES tags(name) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag)
);

CREATE TABLE IF NOT EXISTS ingredients (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS component_ingredients (
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    ingredient   TEXT NOT NULL REFERENCES ingredients(name) ON DELETE CASCADE,
    amount       REAL NOT NULL,
    unit         TEXT NOT NULL,
    prep         TEXT NOT NULL,
    PRIMARY KEY (component_id, ingredient)
);

CREATE TABLE IF NOT EXISTS equipment (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS component_equipment (
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    equipment    TEXT NOT NULL REFERENCES equipment(name) ON DELETE CASCADE,
    PRIMARY KEY (component_id, equipment)
);

-- ============================================================================
-- Garbage-collection triggers for shared master data (fix for issue 3).
-- Each fires after a junction row is removed — whether by an explicit app
-- delete or by an FK cascade — and drops the master row if it's now unused.
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_gc_ingredients
AFTER DELETE ON component_ingredients
BEGIN
    DELETE FROM ingredients
    WHERE name = OLD.ingredient
      AND NOT EXISTS (SELECT 1 FROM component_ingredients WHERE ingredient = OLD.ingredient);
END;

CREATE TRIGGER IF NOT EXISTS trg_gc_equipment
AFTER DELETE ON component_equipment
BEGIN
    DELETE FROM equipment
    WHERE name = OLD.equipment
      AND NOT EXISTS (SELECT 1 FROM component_equipment WHERE equipment = OLD.equipment);
END;

CREATE TRIGGER IF NOT EXISTS trg_gc_tags
AFTER DELETE ON recipe_tags
BEGIN
    DELETE FROM tags
    WHERE name = OLD.tag
      AND NOT EXISTS (SELECT 1 FROM recipe_tags WHERE tag = OLD.tag);
END;