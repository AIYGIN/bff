#!/usr/bin/env node

const fs = require("fs");
const { execFile } = require("child_process");

// Codex から渡されるデータを取得
function getCodexEvent() {
  try {
    const input = fs.readFileSync(0, "utf-8");
    return input ? JSON.parse(input) : null;
  } catch {
    return null;
  }
}

// macOS 通知
function notifyMac({ title, subtitle, message }) {
  const script = `
    display notification ${JSON.stringify(message)}
    with title ${JSON.stringify(title)}
    subtitle ${JSON.stringify(subtitle)}
  `;

  execFile("osascript", ["-e", script], (error) => {
    if (error) {
      console.error("通知の表示に失敗しました:", error.message);
    }
  });
}

const eventData = getCodexEvent();

let dynamicMessage = "プロジェクトのすべての作業が完了しました！";

if (eventData && eventData.summary) {
  dynamicMessage = `完了: ${eventData.summary}`;
}

notifyMac({
  title: "🤖 Codex Agent",
  subtitle: "Task Completed",
  message: dynamicMessage,
});
