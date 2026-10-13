// EVENT HANDLER: Broadcast Start
// A new show: the tip goal starts again from zero, unless the broadcaster wants progress to carry over between shows.

if ($settings.goal_reset_each_show !== false) {
  $kv.set('goal_progress', 0);
  $overlay.emit('goal', goalState(0));
}
