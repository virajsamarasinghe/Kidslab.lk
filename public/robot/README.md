# Robot layer assets

The landing page uses a procedural Three.js model plus transparent photoreal
component cutouts for the wheel and TT gear motor. The cutouts add realistic
surface detail while the underlying geometry keeps the scene 3D, lit, and
scroll-animatable.

Current component assets:

- `components/robot-wheel-realistic.png`
- `components/tt-gear-motor-realistic.png`
- `components/assembled-robot-realistic.png` (WebGL context-loss fallback)

When the exact physical kit model is supplied, add `line-follower.glb` here and
register it in `src/components/robot/robot-assets.ts`. The model should keep
these named parts independently addressable: Arduino UNO, jumper wires,
battery, L298N motor driver, upper chassis, lower chassis, structural
standoffs, left/right motors, left/right wheels, IR sensor array, and caster.

The reference folder is reserved for matching assembled/exploded visual
references:

- `references/assembled-reference.webp`
- `references/exploded-reference.webp`
