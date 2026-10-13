// EVENT HANDLER: Tip Received
// A tip sets off the reaction the tip menu gives that amount. The overlay does the rest (the cryptid blows a kiss, dances, throws a party).
// With a tip goal set, the tip also counts toward it, and reaching it sets off the big celebration.

var who = $tip.isAnon ? 'Someone' : $user.username;
var kind = pickReaction($tip.tokens, $settings);

var goal = goalOf($settings);
var step = goal ? goalStep($kv.get('goal_progress', 0), $tip.tokens, goal, $settings.goal_repeats !== false) : null;
if (step) {
  $kv.set('goal_progress', step.progress);
  $overlay.emit('goal', goalState(step.progress));
}

if (step && step.reached) {
  $overlay.emit('react', { kind: 'goal', user: who, amount: $tip.tokens, goal: goalState(step.progress).name });
  if ($settings.thank_in_chat === true) sendCappedNotice('Goal reached: ' + goalState(step.progress).name + '! Thank you, everyone, and ' + who + '!');
} else {
  $overlay.emit('react', { kind: kind, user: who, amount: $tip.tokens });
  // optional: thank them in chat too (off unless the broadcaster turns it on, and never more often than the hourly cap)
  if ($settings.thank_in_chat === true) sendCappedNotice('Thank you for the ' + $tip.tokens + ', ' + who + '!');
}
