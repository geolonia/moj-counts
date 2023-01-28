#!/usr/bin/env node

const sqlite3 = require("sqlite3");
const fs = require("fs");
const progressBar = require("progress-bar-cli");
let startTime = new Date();
let counter = 0;

const db = new sqlite3.Database("./all-search-list.sqlite3");
let exportJSON = {
  total: 0,
  exclude: 0
}

db.serialize(() => {

  db.get("SELECT count(*) as count FROM search_list;", (err, count) => {

    const totalCount = count.count;

    db.each(
      "SELECT * FROM search_list LEFT JOIN ninni_zahyou on ninni_zahyou.zip_filename = search_list.'ZIPファイル名';",
      (err, row) => {

        counter = progressBar.progressBar(counter, totalCount, startTime);

        const prefCode = row["ZIPファイル名"].slice(0, 2) // 都道府県コードを取得
        const localGovCode = row["ZIPファイル名"].slice(0, 5) // 市区町村コードを取得
        const isNinniZahyou = row["zip_filename"] !== null // 任意座標かどうか
        const isSpecialChiban = !row["地番"].match(/^[0-9]/) // 数字で始まらない地番は除外
        const isCSVHeader = row["ZIPファイル名"] === "ZIPファイル名" // CSV のヘッダーかどうか

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

      },
      (err, all_count) => {

        db.close();
        fs.writeFileSync("./export.json", JSON.stringify(exportJSON, null, 2));

      }
    )
  });
});