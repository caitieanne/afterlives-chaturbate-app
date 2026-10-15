// EVENT HANDLER: App Settings Change
// The broadcaster changed the settings: restart the tip menu timer with the new interval (or stop it), and refresh the goal in the room subject.

startMenuTimer();
updateSubject($kv.get('goal_progress', 0));
