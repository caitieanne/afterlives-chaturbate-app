// EVENT HANDLER: Broadcast Start
// A new show: the tip goal starts again from zero, unless the broadcaster wants progress to carry over between shows, the tip menu goes in
// chat, its timer starts again, and the goal goes in the room subject.

if ($settings.goal_reset_each_show !== false) {
  $kv.set('goal_progress', 0);
  $overlay.emit('goal', goalState(0));
}
$kv.set('last_subject', '');
updateSubject($kv.get('goal_progress', 0));

postMenu();
startMenuTimer();
