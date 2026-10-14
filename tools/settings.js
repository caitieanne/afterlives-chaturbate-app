// The app's settings page, as the Developer Portal's "Advanced Settings" JSON (devportal.cb.dev/wiki/api/advanced-settings). Chaturbate draws
// the page itself, in its own style; this decides what is on it: sections, dropdowns, the color picker, titles and plain descriptions.
// The dropdowns come from the same lists the overlay reads (console.js), so the names on the page always match what the code understands.
const C = require('../src/overlay/console.js');

const CHARACTERS = ['Peachy', 'The Cherries', 'Eggy', 'Bananzo'];

const num = (title, def, description, max) => ({ type: 'number', title, description, minimum: 0, maximum: max || 100000, default: def });
const yes = (title, def, description) => ({ type: 'boolean', title, description, default: def });
const section = (title, collapsed, settings) => ({ type: 'fieldset', title, collapsible: true, collapsed, settings });

// The portal refuses a title or description over 64 characters.
const LIMIT = 64;
function checkLengths(settings) {
  for (const [key, s] of Object.entries(settings)) {
    for (const f of ['title', 'description']) {
      if (typeof s[f] === 'string' && s[f].length > LIMIT) throw new Error(key + ' ' + f + ' is ' + s[f].length + ' characters (the portal allows ' + LIMIT + ')');
    }
    if (s.settings) checkLengths(s.settings);
  }
  return settings;
}

module.exports = function advancedSettings() {
  return checkLengths({
    section_character: section('Your character', false, {
      character: { type: 'string', title: 'Character', description: 'Who lives in your overlay.', enum: CHARACTERS, default: CHARACTERS[0] },
      pet_name: { type: 'string', title: 'Name on stream', description: "Leave empty to use the character's own name.", maxLength: 16 },
    }),
    section_look: section('Look', false, {
      room: { type: 'string', title: 'Room', description: 'Where your character lives: the dusk sky or a room.', enum: C.ROOM_LABELS.map(r => r[1]), default: C.ROOM_LABELS[0][1] },
      console_position: { type: 'string', title: 'Corner', description: 'The corner of your stream it sits in, clear of you.', enum: C.CORNERS.map(c => c[1]), default: 'Bottom right' },
      console_shape: { type: 'string', title: 'Console shape', description: 'The handheld your character lives in, or none.', enum: C.SHAPE_LABELS.map(s => s[1]), default: 'Coffin' },
      console_color: { type: 'color', title: 'Console color', description: 'The see-through plastic.', enum: C.COLORS.map(c => ({ [c.hex]: c.name })), default: '#8a47d6' },
    }),
    section_tips: section('Tip menu', false, {
      tip_wink: num('Wink', 1, 'Tokens for a wink (smaller tips get one too). 0: off.'),
      tip_kiss: num('Kiss', 5, 'Tokens for a blown kiss. 0 turns it off.'),
      tip_dance: num('Dance', 15, 'Tokens for a dance. 0 turns it off.'),
      tip_smooch: num('Smooch', 25, 'Tokens for a smooch on the screen. 0: off.'),
      tip_twerk: num('Twerk', 35, 'Tokens for a twerk. 0 turns it off.'),
      tip_party: num('Party', 50, 'Tokens for a confetti party (new fans get one). 0: off.'),
      tip_menu_in_chat: yes('Post the tip menu in chat', true),
      tip_menu_every: num('Post it every (minutes)', 10, 'How often the tip menu goes in chat (2 to 120).', 120),
    }),
    section_goal: section('Tip goal', true, {
      tip_goal: num('Goal (tokens)', 0, 'Tips count toward it; reaching it starts a party. 0: no goal.'),
      tip_goal_name: { type: 'string', title: 'What the goal is for', description: 'Shown on the goal card.', maxLength: 30, default: 'Tip goal' },
      show_goal: yes('Show the goal on the console', true),
      goal_repeats: yes('Start the goal again once it is reached', true),
      goal_reset_each_show: yes('Start the goal from zero each show', true, 'Off: progress carries over to your next show.'),
    }),
    section_chat: section('Chat', true, {
      chat_commands: yes('Free chat commands', true, 'Anyone can use /wink /kiss /dance /party (every 10 s).'),
      greet: yes('Wave at newcomers', true, 'Followers and people with tokens get a wave when they come in.'),
      thank_in_chat: yes('Thank tippers in chat', false),
      speak_per_hour: num('Things it says on its own, per hour', 6, 'Little lines like "Hydrate, chat!". 0: only when someone plays.', 60),
      chat_notices_per_hour: num('Most chat notices per hour', 10, 'The app never posts more than this an hour. 0: none.', 60),
    }),
  });
};
