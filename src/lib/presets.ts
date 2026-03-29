export interface Preset {
  name: string;
  description: string;
  prompt: string;
}

export const presets: Preset[] = [
  {
    name: "Windmill Farm",
    description: "A golden-hour countryside with spinning windmills, swaying trees, and a cozy farmhouse.",
    prompt:
      "A pastoral farm scene at golden hour with 3 windmills whose blades spin continuously using partAnimations on each blade group. Surround the windmills with several swaying trees and a farmhouse built as a compound object with a base, roof, door, and chimney. The ground should be a wide flat terrain in earthy green, lit by warm directional lighting with a slight orange tint. Add one or two soft white clouds floating slowly overhead with a gentle float animation.",
  },
  {
    name: "City Street",
    description: "A nighttime city block with glowing windows, moving cars, and flickering neon signs.",
    prompt:
      "A nighttime city street with 3-4 tall buildings whose windows glow using emissive materials. A car compound object drives down the road on a path animation, and street lights line the sidewalk with a subtle emissivePulse. Include a traffic light compound object with red, yellow, and green lights that pulse in sequence using staggered emissivePulse phases. Add a neon sign on one building that flickers with a fast emissivePulse, and a person compound object walking along the sidewalk with a simple leg-sway partAnimation.",
  },
  {
    name: "Playground",
    description: "A cheerful playground with swings, a merry-go-round, seesaw, and slide under blue skies.",
    prompt:
      "A bright daytime playground scene with a swing set whose seats sway back and forth using sway animation, a merry-go-round spinning smoothly with rotateY, and a seesaw that tilts with a sway animation. Include a slide built as a compound object with a ladder, platform, and chute. Surround the playground with several gently swaying trees on a green terrain ground, under bright blue-sky ambient lighting.",
  },
  {
    name: "Solar System",
    description: "An animated solar system with orbiting planets, Saturn's rings, and a glowing sun.",
    prompt:
      "A miniature solar system against a dark background scattered with tiny white emissive spheres as stars. Place a large glowing sun at the center with a warm orange emissivePulse. Surround it with at least 5 planets orbiting at different radii, speeds, and phases -- include a small grey Mercury close in, a blue-green Earth with a tiny moon orbiting it, a red Mars, a large Jupiter, and a Saturn compound object with a torus ring. Use orbit animations on each planet with varying speeds so the system feels dynamic and alive.",
  },
  {
    name: "Cozy Cafe",
    description: "A warm interior cafe with a rotating ceiling fan, pendant lamps, and rising steam.",
    prompt:
      "An indoor cafe scene with a long counter, two small tables each with paired chair compound objects, and a ceiling fan spinning overhead using rotateY. Hang pendant lamps from the ceiling with warm yellow emissivePulse for ambient glow. Add a door that sways gently as if someone just walked through, and place a few tiny translucent spheres above a cup on the counter that float upward slowly to simulate steam. Use warm soft lighting throughout to create a cozy atmosphere.",
  },
  {
    name: "Robot Dance",
    description: "A dancing robot on a stage with a spinning disco ball and dramatic spotlight.",
    prompt:
      "A robot compound object made of a boxy torso, a rounded head, two arms, and two legs standing on a flat stage platform. The robot performs a dance using keyframe partAnimations -- arms swinging, legs stepping, and head bobbing in a looping sequence. Above the stage hangs a disco ball compound object with high metalness that rotates continuously with rotateY. A bright spotlight shines down from above with a narrow cone, and the stage has a slightly reflective dark surface.",
  },
  {
    name: "Harbor Scene",
    description: "A seaside harbor with a bobbing boat, rotating lighthouse beacon, and circling seagulls.",
    prompt:
      "A coastal harbor scene with a wooden dock extending out over blue water represented by a wide flat plane with a gentle sway animation to simulate waves. A fishing boat compound object with a hull, cabin, and mast bobs on the water using a float animation. On the shore stands a tall lighthouse whose beacon light rotates using a partAnimation and glows with an emissivePulse. Add 3-4 small seagull shapes orbiting above the harbor at different heights and speeds, and use cool blue-white directional lighting for a crisp maritime feel.",
  },
];
