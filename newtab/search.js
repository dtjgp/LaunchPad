// Google search box for the new tab: routing, AI Mode, voice input and the
// opt-in suggestion dropdown. Loaded before newtab.js, which persists the
// suggestion switch through its settings writer (see createNewTabSearch deps).
function createNewTabSearch({ logEvent, flashSettingsSaved, saveSearchSuggestions }) {
  const googleSearchForm = document.getElementById('googleSearchForm');
  const searchInput = document.getElementById('searchInput');
  const voiceSearchBtn = document.getElementById('voiceSearchBtn');
  const searchStatus = document.getElementById('searchStatus');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const GOOGLE_SEARCH_PLACEHOLDER = 'Search Google or type a URL';
  let voiceRecognition = null;

  function navigateFromGoogleSearch() {
    const target = LaunchPadCore.resolveGoogleSearchTarget(searchInput.value);
    if (target) {
      window.location.href = target;
    } else {
      const error = LaunchPadCore.getSearchInputError(searchInput.value);
      if (error) searchStatus.textContent = error;
    }
  }

  // === Google search suggestions (opt-in; Chrome NTP dropdown behavior) ===
  const SUGGESTION_DEBOUNCE_MS = 120;
  const SUGGESTIONS_UNAVAILABLE = 'Google suggestions are unavailable right now. Search still works.';
  let searchSuggestionsEnabled = false;
  let suggestionPermission = false;
  let suggestionMatches = [];
  let suggestionIndex = -1;
  let suggestionTypedValue = '';
  let suggestionTimer = null;
  let suggestionRequestVersion = 0;

  function suggestionsActive() {
    return searchSuggestionsEnabled && suggestionPermission;
  }

  function suggestionsOpen() {
    return !searchSuggestions.hidden;
  }

  function closeSuggestions(restoreTyped = false) {
    clearTimeout(suggestionTimer);
    suggestionRequestVersion += 1;
    if (restoreTyped && suggestionMatches.length) searchInput.value = suggestionTypedValue;
    suggestionMatches = [];
    suggestionIndex = -1;
    searchSuggestions.hidden = true;
    searchSuggestions.replaceChildren();
    googleSearchForm.classList.remove('has-suggestions');
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.removeAttribute('aria-activedescendant');
  }

  function createVerbatimMatch(value) {
    const url = LaunchPadCore.resolveGoogleSearchTarget(value);
    const isSearch = url === LaunchPadCore.buildGoogleSearchUrl(value.trim());
    return { kind: isSearch ? 'query' : 'navigation', text: value.trim(), description: '', url };
  }

  function appendSuggestionText(container, text, typed) {
    // Like Chrome, the typed prefix stays regular and the completion is bold.
    const prefix = typed && text.toLowerCase().startsWith(typed.toLowerCase()) ? text.slice(0, typed.length) : '';
    if (prefix) container.append(prefix);
    const rest = text.slice(prefix.length);
    if (rest) {
      const strong = document.createElement(prefix ? 'b' : 'span');
      strong.textContent = rest;
      container.append(strong);
    }
  }

  // Chrome shows navigation matches without the scheme or a bare trailing slash.
  function formatSuggestionUrl(url) {
    return url.replace(/^https?:\/\//, '').replace(/^([^/?#]+)\/$/, '$1');
  }

  function renderSuggestions() {
    const typed = suggestionTypedValue.trim();
    const options = suggestionMatches.map((match, index) => {
      const option = document.createElement('div');
      option.id = `searchSuggestion-${index}`;
      option.className = `search-suggestion search-suggestion-${match.kind}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', index === suggestionIndex ? 'true' : 'false');
      option.dataset.index = String(index);
      const icon = document.createElement('span');
      icon.className = 'search-suggestion-icon';
      icon.setAttribute('aria-hidden', 'true');
      if (match.kind === 'query') {
        icon.append(googleSearchForm.querySelector('.search-icon svg').cloneNode(true));
      } else {
        icon.append(createSiteIcon(match.url, match.text));
      }
      const text = document.createElement('span');
      text.className = 'search-suggestion-text';
      if (index === 0) text.textContent = match.text;
      else if (match.kind === 'navigation') text.textContent = formatSuggestionUrl(match.url);
      else appendSuggestionText(text, match.text, typed);
      if (match.description) {
        const description = document.createElement('span');
        description.className = 'search-suggestion-description';
        description.textContent = ` – ${match.description}`;
        text.append(description);
      }
      option.append(icon, text);
      return option;
    });
    searchSuggestions.replaceChildren(...options);
    const open = options.length > 1;
    searchSuggestions.hidden = !open;
    googleSearchForm.classList.toggle('has-suggestions', open);
    searchInput.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && suggestionIndex >= 0) searchInput.setAttribute('aria-activedescendant', `searchSuggestion-${suggestionIndex}`);
    else searchInput.removeAttribute('aria-activedescendant');
  }

  async function requestSuggestions(value) {
    const url = LaunchPadCore.buildGoogleSuggestUrl(value);
    if (!url) {
      closeSuggestions();
      return;
    }
    const version = ++suggestionRequestVersion;
    let response;
    try {
      response = await chrome.runtime.sendMessage({ type: 'fetchSuggest', url });
    } catch (error) {
      response = { ok: false, error: error.message };
    }
    if (version !== suggestionRequestVersion || searchInput.value !== value) return;
    try {
      if (!response?.ok) throw new Error(response?.error || 'No response');
      const matches = LaunchPadCore.parseGoogleSuggestions(response.text, value);
      if (searchStatus.textContent === SUGGESTIONS_UNAVAILABLE) searchStatus.textContent = '';
      suggestionTypedValue = value;
      suggestionMatches = [createVerbatimMatch(value), ...matches];
      suggestionIndex = 0;
      renderSuggestions();
    } catch (error) {
      closeSuggestions();
      if (!searchStatus.textContent) searchStatus.textContent = SUGGESTIONS_UNAVAILABLE;
      void logEvent('warn', 'search suggestions failed', { message: error.message });
    }
  }

  function scheduleSuggestions() {
    clearTimeout(suggestionTimer);
    const value = searchInput.value;
    if (!suggestionsActive() || !value.trim() || voiceRecognition) {
      closeSuggestions();
      return;
    }
    suggestionTimer = setTimeout(() => { void requestSuggestions(value); }, SUGGESTION_DEBOUNCE_MS);
  }

  function moveSuggestionSelection(step) {
    if (!suggestionsOpen()) return false;
    const count = suggestionMatches.length;
    suggestionIndex = (suggestionIndex + step + count) % count;
    const match = suggestionMatches[suggestionIndex];
    // Chrome previews the selected match in the input; Escape restores the typed text.
    searchInput.value = suggestionIndex === 0 ? suggestionTypedValue : match.kind === 'query' ? match.text : match.url;
    renderSuggestions();
    return true;
  }

  function navigateToSuggestion(index) {
    const match = suggestionMatches[index];
    if (!match) return false;
    if (index === 0) {
      searchInput.value = suggestionTypedValue;
      closeSuggestions();
      navigateFromGoogleSearch();
      return true;
    }
    closeSuggestions();
    window.location.href = match.url;
    return true;
  }

  async function refreshSuggestionPermission() {
    try {
      suggestionPermission = Boolean(await chrome.permissions?.contains({ origins: [LaunchPadCore.GOOGLE_SUGGEST_ORIGIN] }));
    } catch {
      suggestionPermission = false;
    }
    if (!suggestionsActive()) closeSuggestions();
    renderSearchSuggestionSetting();
  }

  function renderSearchSuggestionSetting() {
    const toggle = document.getElementById('searchSuggestionsToggle');
    const state = document.getElementById('searchSuggestionsState');
    if (!toggle || !state) return;
    toggle.checked = suggestionsActive();
    state.textContent = searchSuggestionsEnabled && !suggestionPermission
      ? 'Turned on in synced settings. Switch it on here to allow access on this device.'
      : '';
  }

  async function setSearchSuggestions(enabled) {
    const origins = [LaunchPadCore.GOOGLE_SUGGEST_ORIGIN];
    if (enabled) {
      // Request first, inside the click task, so Chrome keeps the user gesture.
      const granted = await chrome.permissions.request({ origins }).catch(() => false);
      if (!granted) {
        renderSearchSuggestionSetting();
        flashSettingsSaved({ localOk: false, localError: 'Chrome did not allow access to www.google.com. Suggestions stay off.' });
        return;
      }
      suggestionPermission = true;
    } else {
      closeSuggestions();
      const removed = await chrome.permissions.remove({ origins }).catch(() => false);
      if (removed) suggestionPermission = false;
    }
    const previous = searchSuggestionsEnabled;
    searchSuggestionsEnabled = enabled;
    const result = await saveSearchSuggestions();
    if (!result.localOk) searchSuggestionsEnabled = previous;
    renderSearchSuggestionSetting();
  }

  function navigateToGoogleAiMode() {
    const target = LaunchPadCore.resolveGoogleAiModeTarget(searchInput.value);
    if (target) {
      window.location.href = target;
    } else {
      searchStatus.textContent = LaunchPadCore.getSearchInputError(searchInput.value);
    }
  }

  function setVoiceSearchState(isListening, message = '') {
    voiceSearchBtn?.classList.toggle('is-listening', isListening);
    voiceSearchBtn?.setAttribute('aria-pressed', isListening ? 'true' : 'false');
    searchInput.placeholder = isListening ? 'Listening…' : GOOGLE_SEARCH_PLACEHOLDER;
    if (searchStatus) {
      searchStatus.textContent = message;
    }
  }

  function startVoiceSearch() {
    if (voiceRecognition) {
      voiceRecognition.stop();
      return;
    }

    const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSearchState(false, 'Voice search is not available in this browser.');
      searchInput.focus();
      return;
    }

    closeSuggestions();
    const recognition = new SpeechRecognition();
    let voiceMessage = '';
    voiceRecognition = recognition;
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      if (voiceRecognition === recognition) setVoiceSearchState(true, 'Listening for your search.');
    };
    recognition.onresult = event => {
      if (voiceRecognition !== recognition) return;
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      if (!transcript) return;
      searchInput.value = transcript;
      voiceMessage = `Searching Google for ${transcript}.`;
      setVoiceSearchState(false, voiceMessage);
      navigateFromGoogleSearch();
    };
    recognition.onerror = event => {
      if (voiceRecognition !== recognition) return;
      const messages = {
        'not-allowed': 'Allow microphone access in Chrome to use voice search.',
        'service-not-allowed': 'Voice search is unavailable in this browser configuration. Type your query instead.',
        'audio-capture': 'No microphone is available. Type your query instead.',
        'network': 'The speech service could not be reached. Type your query or try again.',
        'no-speech': 'No speech was detected. Try again or type your query.'
      };
      voiceMessage = messages[event.error] || 'Voice search could not finish. Try again or type your query.';
      voiceRecognition = null;
      setVoiceSearchState(false, voiceMessage);
    };
    recognition.onend = () => {
      if (voiceRecognition !== recognition) return;
      voiceRecognition = null;
      setVoiceSearchState(false, voiceMessage || 'No speech was detected. Try again or type your query.');
    };

    try {
      recognition.start();
    } catch {
      voiceRecognition = null;
      setVoiceSearchState(false, 'Voice search could not start. Try again or type your query.');
    }
  }

  googleSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (suggestionsOpen() && suggestionIndex > 0 && navigateToSuggestion(suggestionIndex)) return;
    closeSuggestions();
    navigateFromGoogleSearch();
  });

  searchInput.addEventListener('input', scheduleSuggestions);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (moveSuggestionSelection(e.key === 'ArrowDown' ? 1 : -1)) e.preventDefault();
    } else if (e.key === 'Escape' && suggestionsOpen()) {
      // The first Escape closes the dropdown only; the page-level handler runs on the next one.
      e.preventDefault();
      e.stopPropagation();
      closeSuggestions(true);
    }
  });
  googleSearchForm.addEventListener('focusout', (e) => {
    if (!googleSearchForm.contains(e.relatedTarget)) closeSuggestions();
  });
  // Keep focus in the input while a suggestion is clicked, as Chrome's dropdown does.
  searchSuggestions.addEventListener('mousedown', (e) => e.preventDefault());
  searchSuggestions.addEventListener('click', (e) => {
    const option = e.target.closest('[role="option"]');
    if (option) navigateToSuggestion(Number(option.dataset.index));
  });
  document.getElementById('searchSuggestionsToggle')?.addEventListener('change', (e) => {
    void setSearchSuggestions(e.target.checked);
  });
  chrome.permissions?.onAdded?.addListener(() => { void refreshSuggestionPermission(); });
  chrome.permissions?.onRemoved?.addListener(() => { void refreshSuggestionPermission(); });

  voiceSearchBtn?.addEventListener('click', startVoiceSearch);
  document.getElementById('aiModeBtn')?.addEventListener('click', navigateToGoogleAiMode);

  return {
    focus() {
      searchInput.focus();
      searchInput.select();
    },
    // Returns true when Escape stopped an active voice search.
    cancelVoice() {
      if (!voiceRecognition) return false;
      voiceRecognition.abort();
      voiceRecognition = null;
      setVoiceSearchState(false, 'Voice search cancelled.');
      searchInput.focus();
      return true;
    },
    suggestionsEnabled: () => searchSuggestionsEnabled,
    setSuggestionsEnabled(enabled) {
      searchSuggestionsEnabled = enabled;
      if (!suggestionsActive()) closeSuggestions();
      renderSearchSuggestionSetting();
    },
    refreshSuggestionPermission,
    renderSuggestionSetting: renderSearchSuggestionSetting
  };
}
