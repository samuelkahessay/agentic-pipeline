window.consoleApp = {
  formatTime(iso) {
    try {
      return new Date(iso).toLocaleString();
    } catch (_error) {
      return iso;
    }
  },
};
