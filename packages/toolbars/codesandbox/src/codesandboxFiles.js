export const codesandboxFiles = {
  '.codesandbox/tasks.json': {
    content: String.raw`{
  // These tasks will run in order when initializing your CodeSandbox project.
  "setupTasks": [
  {
    "name": "pnpm install",
    "command": "pnpm install"
  }
  ],
  
  // These tasks can be run from CodeSandbox. Running one will open a log in the app.
  "tasks": {
  "install-dependencies": {
    "name": "Install Dependencies",
    "command": "pnpm install"
  },
  "start-app": {
    "name": "Run Dev Server",
    "command": "pnpm run dev",
    "runAtStart": true
  }
  }
  }
  `
  }
}
