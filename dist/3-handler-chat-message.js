// EVENT HANDLER: Chat Message
// Anyone can play with the cryptid for free with /wink, /kiss, /dance or /party (the broadcaster can switch this off in settings).
// One per person every 10 seconds, kept in $kv so one person cannot flood the stream.

if ($settings.chat_commands !== false && !$message.isSpam) {
  var kind = commandReaction($message.body);
  if (kind) {
    var key = 'last_' + $user.username;
    var now = Date.now();
    var last = $kv.get(key, 0);
    if (now - last > 10000) {
      $kv.set(key, now);
      $overlay.emit('react', { kind: kind, user: $user.username, amount: 0 });
    }
  }
}
