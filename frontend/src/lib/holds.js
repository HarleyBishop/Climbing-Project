// Physical hold colours used for climb tiles and colour strips. Stored on
// climbs by name ("Green", "Blue"...), so this maps the name to a hex value.
export const HOLD = {
  Green: '#34c759',
  Orange: '#ff9500',
  Blue: '#007aff',
  Pink: '#ff2d55',
  Yellow: '#ffcc00',
  Black: '#3a3a3c',
  White: '#d1d1d6',
};

export const holdColour = (name) => HOLD[name] || HOLD.Orange;
