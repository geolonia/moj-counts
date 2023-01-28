#!/usr/bin/env node

const sqlite3 = require("sqlite3");
const fs = require("fs");
const progressBar = require("progress-bar-cli");
let startTime = new Date();
let totalCount = 0; // 全データ数
let offset = 0;
const chunkSize = 10000; // 分割したデータのサイズ
const db = new sqlite3.Database("./all-search-list.sqlite3");

db.serialize(() => {

  if (fs.existsSync("./export.json")) {
    fs.unlinkSync("./export.json");
  }

  fs.writeFileSync("./export.json", "{}");

  db.get("SELECT count(*) as count FROM search_list;", (err, count) => {

    totalCount = count.count;
    processChunk();

  });
});

function processChunk() {
  db.all(
    "SELECT * FROM search_list LEFT JOIN ninni_zahyou on ninni_zahyou.zip_filename = search_list.'ZIPファイル名' LIMIT ? OFFSET ?;",
    [chunkSize, offset],
    (err, rows) => {

      let readJSON = fs.readFileSync("./export.json", "utf8");
      readJSON = JSON.parse(readJSON);

      progressBar.progressBar(offset, totalCount, startTime);

      let exportJSON = {};
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        exportJSON = calc(row, readJSON);
      }

      offset += chunkSize;

      if (offset < totalCount) {

        fs.writeFileSync("./export.json", JSON.stringify(exportJSON, null, 2));

        processChunk();
      } else {
        // 全データ処理が終了したら、以下の処理を実行
        db.close();
      }
    }
  );
}

function calc(row, exportJSON) {
  const prefCode = row["ZIPファイル名"].slice(0, 2) // 都道府県コードを取得
  const localGovCode = row["ZIPファイル名"].slice(0, 5) // 市区町村コードを取得
  const isNinniZahyou = row["zip_filename"] !== null // 任意座標かどうか
  const isSpecialChiban = !row["地番"].match(/^[0-9]/) // 数字で始まらない地番は除外
  const isCSVHeader = row["ZIPファイル名"] === "ZIPファイル名" // CSV のヘッダーかどうか

  if (exportJSON["exclude"] === undefined) {
    exportJSON.exclude = 0
  }

  if (exportJSON["total"] === undefined) {
    exportJSON.total = 0
  }

  // search_list に CSV のヘッダーが入っているので、それを除外する
  if (isCSVHeader) {
    exportJSON.exclude += 1
    return;
  } else {
    exportJSON.total += 1
  }

  if (exportJSON[prefCode] === undefined) {
    exportJSON[prefCode] = {
      "total": 0,
      "ninni_zahyou": 0,
      "kokyo_zahyou": 0,
      "special_chiban": 0,
    }
  }

  if (exportJSON[prefCode][localGovCode] === undefined) {
    exportJSON[prefCode][localGovCode] = {
      "total": 0,
      "ninni_zahyou": 0,
      "kokyo_zahyou": 0,
      "special_chiban": 0,
    }
  }

  exportJSON[prefCode]["total"] += 1
  exportJSON[prefCode][localGovCode]["total"] += 1

  if (isSpecialChiban) {
    exportJSON[prefCode]["special_chiban"] += 1
    exportJSON[prefCode][localGovCode]["special_chiban"] += 1
  } else if (isNinniZahyou) {
    exportJSON[prefCode]["ninni_zahyou"] += 1
    exportJSON[prefCode][localGovCode]["ninni_zahyou"] += 1
  } else {
    exportJSON[prefCode]["kokyo_zahyou"] += 1
    exportJSON[prefCode][localGovCode]["kokyo_zahyou"] += 1
  }

  return exportJSON;
}





