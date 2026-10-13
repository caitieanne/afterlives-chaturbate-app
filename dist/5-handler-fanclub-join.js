// EVENT HANDLER: Fanclub Join
// A new fan club member gets the biggest reaction, a party.

$overlay.emit('react', { kind: 'party', user: $user.username, amount: 0, fan: true });
