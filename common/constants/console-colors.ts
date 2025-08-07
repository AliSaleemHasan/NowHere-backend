const ConsoleColors = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m', // Yellow (closest to orange)
  fatal: '\x1b[35m', // Magenta (for something dramatic)
  debug: '\x1b[94m', // Light Blue (Bright Blue)
  verbose: '\x1b[36m', // Cyan (good contrast, often used for verbosity)
  log: '\x1b[0m', // Reset to default
};

export const consoleSeperator = (type: keyof typeof ConsoleColors) =>
  `\n${ConsoleColors[type]}******************************${type.toUpperCase()}******************************\n`;
