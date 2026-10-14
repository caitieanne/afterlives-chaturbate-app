// The app's settings page, as the Developer Portal's "Advanced Settings" JSON (devportal.cb.dev/wiki/api/advanced-settings). Chaturbate draws
// the page itself, in its own style; this decides what is on it: sections, dropdowns, the color picker, titles and plain descriptions.
// The dropdowns come from the same lists the overlay reads (console.js), so the names on the page always match what the code understands.
const C = require('../src/overlay/console.js');

const CHARACTERS = ['Peachy', 'The Cherries', 'Eggy', 'Bananzo'];

const num = (title, def, description, max) => ({ type: 'number', title, description, minimum: 0, maximum: max || 100000, default: def });
const yes = (title, def, description) => ({ type: 'boolean', title, description, default: def });
const section = (title, collapsed, settings) => ({ type: 'fieldset', title, collapsible: true, collapsed, settings });

module.exports = function advancedSettings() {
  return {
    section_character: section('Your character', false, {
      character: { type: 'string', title: 'Character', description: 'Who lives in your overlay.', enum: CHARACTERS, default: CHARACTERS[0] },
      pet_name: { type: 'string', title: 'Name on stream', description: "Leave empty to use the character's own name.", maxLength: 16 },
    }),
    section_look: section('Look', false, {
      room: { type: 'string', title: 'Room', description: 'Where your character lives: the starry dusk sky or one of the rooms.', enum: C.ROOM_LABELS.map(r => r[1]), default: C.ROOM_LABELS[0][1] },
      console_shape: { type: 'string', title: 'Console shape', description: 'The handheld your character lives in, or none.', enum: C.SHAPE_LABELS.map(s => s[1]), default: 'Coffin' },
      console_color: { type: 'color', title: 'Console color', description: 'The see-through plastic.', enum: C.COLORS.map(c => ({ [c.hex]: c.name })), default: '#8a47d6' },
    }),
    section_tips: section('Tip menu', false, {
      tip_wink: num('Wink', 1, 'Tokens for a wink. A tip below everything still gets a wink. 0 turns it off.'),
      tip_kiss: num('Kiss', 5, 'Tokens for a blown kiss. 0 turns it off.'),
      tip_dance: num('Dance', 15, 'Tokens for a dance. 0 turns it off.'),
      tip_smooch: num('Smooch', 25, 'Tokens for a smooch: they walk right up and kiss the screen. 0 turns it off.'),
      tip_twerk: num('Twerk', 35, 'Tokens for a twerk. 0 turns it off.'),
      tip_party: num('Party', 50, 'Tokens for a party with confetti. A new fan club member always gets one. 0 turns it off.'),
      show_menu: yes('Show the tip menu on the overlay', false),
    }),
    section_goal: section('Tip goal', true, {
      tip_goal: num('Goal (tokens)', 0, 'Tips count toward it, and reaching it sets off a big celebration. 0: no goal.'),
      tip_goal_name: { type: 'string', title: 'What the goal is for', description: 'Shown on the goal card.', maxLength: 30, default: 'Tip goal' },
      show_goal: yes('Show the goal card on the overlay', true),
      goal_repeats: yes('Start the goal again once it is reached', true),
      goal_reset_each_show: yes('Start the goal from zero each show', true, 'Off: progress carries over to your next show.'),
    }),
    section_chat: section('Chat', true, {
      chat_commands: yes('Free chat commands', true, 'Anyone can use /wink /kiss /dance /party (one each per person every 10 seconds).'),
      greet: yes('Wave at newcomers', true, 'Followers and people with tokens get a wave when they come in.'),
      thank_in_chat: yes('Thank tippers in chat', false),
      speak_per_hour: num('Things it says on its own, per hour', 6, 'Little lines like "Hydrate, chat!". 0: only when someone plays.', 60),
      chat_notices_per_hour: num('Most chat notices per hour', 10, 'The app never posts more than this many chat notices an hour. 0: none.', 60),
    }),
  };
};
