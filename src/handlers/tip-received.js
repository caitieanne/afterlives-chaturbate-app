// EVENT HANDLER: Tip Received
// A tip sets off the reaction the tip menu gives that amount. The overlay does the rest (the cryptid blows a kiss, dances, throws a party).

var who = $tip.isAnon ? 'Someone' : $user.username;
var kind = pickReaction($tip.tokens, $settings);

$overlay.emit('react', { kind: kind, user: who, amount: $tip.tokens });

// optional: thank them in chat too (off unless the broadcaster turns it on)
if ($settings.thank_in_chat === true) {
  $room.sendNotice('Thank you for the ' + $tip.tokens + ', ' + who + '!');
}
