export function disableRightClick() {
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}

export function disableSaveShortcuts() {
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    document.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.key === "F12")
      ) {
        e.preventDefault();
        return false;
      }
    });
  }
}

export function detectDevTools() {
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    let devtoolsOpen = false;
    const threshold = 160;

    setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.clear();
          console.log(
            "%c⚠ Warning: Developer tools detected",
            "color: red; font-size: 20px;"
          );
        }
      } else {
        devtoolsOpen = false;
      }
    }, 1000);
  }
}

export function preventClickjacking() {
  if (typeof window !== "undefined" && window.top !== window.self) {
    window.top!.location.href = window.self.location.href;
  }
}

export function initSecurity() {
  if (typeof window !== "undefined") {
    disableRightClick();
    disableSaveShortcuts();
    detectDevTools();
    preventClickjacking();
  }
}
