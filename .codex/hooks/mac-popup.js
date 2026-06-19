#!/usr/bin/env node
const notifier = require('node-notifier');
const fs = require('fs');

// Codex から渡されるデータを取得
function getCodexEvent() {
  try {
    // 標準入力からJSONを同期的に読み込む
    const input = fs.readFileSync(0, 'utf-8');
    return input ? JSON.parse(input) : null;
  } catch (e) {
    return null;
  }
}

const eventData = getCodexEvent();
let dynamicMessage = 'プロジェクトのすべての作業が完了しました！';

// Codexが直前に実行した履歴（イベントデータ）がある場合、中身を解析
if (eventData && eventData.summary) {
  // 例: 「〇〇ファイルの修正を完了しました」のようなサマリーを活用
  dynamicMessage = `完了: ${eventData.summary}`;
}

// ポップアップを表示
notifier.notify({
  title: '🤖 Codex Agent',
  subtitle: 'Task Completed',
  message: dynamicMessage, // 👈 ここを動的に変更
  sound: false,
  wait: false
});
