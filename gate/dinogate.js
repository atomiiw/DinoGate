// DinoGate — Gate logic layer
// Hooks into the real Chromium Runner game via window.onDinoGameOver.
// Manages streak tracking, unlock UI, and proceed-to-site flow.

(() => {
  const DOMAIN = 'instagram.com';
  const REQUIRED_SCORE = 50;
  const REQUIRED_STREAK = 3;

  const hintEl = document.getElementById('gate-hint');
  const streakEl = document.getElementById('streak');
  const unlockArea = document.getElementById('unlock-area');
  const proceedLink = document.getElementById('proceed-link');
  const timeInput = document.getElementById('time-input');

  let streak = 0;
  let unlocked = false;

  function updateDisplay() {
    if (unlocked) {
      hintEl.textContent = 'Alright alright, you can go. Or... beat your high score first?';
      streakEl.textContent = '';
    } else if (streak === 2) {
      hintEl.textContent = 'Ooh, so close. Don\'t choke.';
      streakEl.textContent = streak + '/' + REQUIRED_STREAK;
    } else if (streak === 1) {
      hintEl.textContent = 'Okay, 1 down. Feeling lucky?';
      streakEl.textContent = streak + '/' + REQUIRED_STREAK;
    } else {
      hintEl.textContent = 'Score 50+ three times in a row. Easy, right?';
      streakEl.textContent = '';
    }
  }

  // Called by the patched Runner.gameOver() via window.onDinoGameOver.
  window.onDinoGameOver = function(score) {
    if (score >= REQUIRED_SCORE) {
      streak++;
    } else {
      const hadStreak = streak > 0;
      streak = 0;
      if (unlocked) {
        unlocked = false;
        unlockArea.classList.remove('visible');
      }
      if (hadStreak) {
        hintEl.textContent = 'Ouch. Streak gone. The dino believes in you though.';
        streakEl.textContent = '';
        return;
      }
    }

    if (streak >= REQUIRED_STREAK && !unlocked) {
      unlocked = true;
      proceedLink.textContent = 'go to ' + DOMAIN;
      unlockArea.classList.add('visible');
    }

    updateDisplay();
  };

  // Proceed to the blocked site with a timed session.
  proceedLink.addEventListener('click', () => {
    const seconds = Math.max(1, Math.min(7200, Math.floor(parseInt(timeInput.value, 10) || 600)));
    chrome.runtime.sendMessage(
      { type: 'unlock', domain: DOMAIN, seconds },
      () => {
        window.location.href = 'https://www.' + DOMAIN;
      }
    );
  });
})();
