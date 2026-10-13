// EVENT HANDLER: User Enter
// The cryptid waves hello to someone who comes into the room (only people who have tokens or follow, so a flood of lurkers does not make it
// wave all day). Off if the broadcaster turns "greet newcomers" off.

if ($settings.greet !== false && ($user.isFollower || $user.hasTokens)) {
  $overlay.emit('react', { kind: 'hello', user: $user.username, amount: 0 });
}
