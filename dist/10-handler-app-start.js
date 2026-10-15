// EVENT HANDLER: App Start
// The app has started (installed, or restarted): post the tip menu in chat, start the timer that posts it again, and put the goal in the
// room subject.

postMenu();
startMenuTimer();
$kv.set('last_subject', '');
updateSubject($kv.get('goal_progress', 0));
