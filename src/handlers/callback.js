// EVENT HANDLER: Callback
// The tip menu timer: post the menu in chat (never more often than the hourly chat notice cap allows).

if ($callback.label === 'tip_menu') postMenu();
