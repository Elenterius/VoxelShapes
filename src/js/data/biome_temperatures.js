const BIOME_DATA = [
  {
    "biome": "minecraft:the_void",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:plains",
    "temperature": 0.8,
    "downfall": 0.4
  },
  {
    "biome": "minecraft:sunflower_plains",
    "temperature": 0.8,
    "downfall": 0.4
  },
  {
    "biome": "minecraft:snowy_plains",
    "temperature": 0,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:ice_spikes",
    "temperature": 0,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:desert",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:swamp",
    "temperature": 0.8,
    "downfall": 0.9
  },
  {
    "biome": "minecraft:mangrove_swamp",
    "temperature": 0.8,
    "downfall": 0.9
  },
  {
    "biome": "minecraft:forest",
    "temperature": 0.7,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:flower_forest",
    "temperature": 0.7,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:birch_forest",
    "temperature": 0.6,
    "downfall": 0.6
  },
  {
    "biome": "minecraft:dark_forest",
    "temperature": 0.7,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:old_growth_birch_forest",
    "temperature": 0.6,
    "downfall": 0.6
  },
  {
    "biome": "minecraft:old_growth_pine_taiga",
    "temperature": 0.3,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:old_growth_spruce_taiga",
    "temperature": 0.25,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:taiga",
    "temperature": 0.25,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:snowy_taiga",
    "temperature": -0.5,
    "downfall": 0.4
  },
  {
    "biome": "minecraft:savanna",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:savanna_plateau",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:windswept_hills",
    "temperature": 0.2,
    "downfall": 0.3
  },
  {
    "biome": "minecraft:windswept_gravelly_hills",
    "temperature": 0.2,
    "downfall": 0.3
  },
  {
    "biome": "minecraft:windswept_forest",
    "temperature": 0.2,
    "downfall": 0.3
  },
  {
    "biome": "minecraft:windswept_savanna",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:jungle",
    "temperature": 0.95,
    "downfall": 0.9
  },
  {
    "biome": "minecraft:sparse_jungle",
    "temperature": 0.95,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:bamboo_jungle",
    "temperature": 0.95,
    "downfall": 0.9
  },
  {
    "biome": "minecraft:badlands",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:eroded_badlands",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:wooded_badlands",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:meadow",
    "temperature": 0.5,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:grove",
    "temperature": -0.2,
    "downfall": 0.8
  },
  {
    "biome": "minecraft:snowy_slopes",
    "temperature": -0.3,
    "downfall": 0.9
  },
  {
    "biome": "minecraft:frozen_peaks",
    "temperature": -0.7,
    "downfall": 0.9
  },
  {
    "biome": "minecraft:jagged_peaks",
    "temperature": -0.7,
    "downfall": 0.9
  },
  {
    "biome": "minecraft:stony_peaks",
    "temperature": 1,
    "downfall": 0.3
  },
  {
    "biome": "minecraft:river",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:frozen_river",
    "temperature": 0,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:beach",
    "temperature": 0.8,
    "downfall": 0.4
  },
  {
    "biome": "minecraft:snowy_beach",
    "temperature": 0.05,
    "downfall": 0.3
  },
  {
    "biome": "minecraft:stony_shore",
    "temperature": 0.2,
    "downfall": 0.3
  },
  {
    "biome": "minecraft:warm_ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:lukewarm_ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:deep_lukewarm_ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:deep_ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:cold_ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:deep_cold_ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:frozen_ocean",
    "temperature": 0,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:deep_frozen_ocean",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:mushroom_fields",
    "temperature": 0.9,
    "downfall": 1
  },
  {
    "biome": "minecraft:dripstone_caves",
    "temperature": 0.8,
    "downfall": 0.4
  },
  {
    "biome": "minecraft:lush_caves",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:deep_dark",
    "temperature": 0.8,
    "downfall": 0.4
  },
  {
    "biome": "minecraft:nether_wastes",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:warped_forest",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:crimson_forest",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:soul_sand_valley",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:basalt_deltas",
    "temperature": 2,
    "downfall": 0
  },
  {
    "biome": "minecraft:the_end",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:end_highlands",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:end_midlands",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:small_end_islands",
    "temperature": 0.5,
    "downfall": 0.5
  },
  {
    "biome": "minecraft:end_barrens",
    "temperature": 0.5,
    "downfall": 0.5
  }
];

export default BIOME_DATA;