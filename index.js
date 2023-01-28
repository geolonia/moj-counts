#!/usr/bin/env node

const sqlite3 = require("sqlite3");
const fs = require("fs");
const db = new sqlite3.Database("./all-search-list.sqlite3");
let exportJSON = {
  total: 0,
  exclude: 0
}

db.serialize(() => {

  db.each(
    "SELECT * FROM search_list LEFT JOIN ninni_zahyou on ninni_zahyou.zip_filename = search_list.'ZIPファイル名' limit 1000000;",
    (err, row) => {

      // search_list に CSV のヘッダーが入っているので、それを除外する
      if ("ZIPファイル名" === row["ZIPファイル名"]) {
        exportJSON.exclude += 1
        return;
      } else {
        exportJSON.total += 1
      }

      // 都道府県コードを取得
      const prefCode = row["ZIPファイル名"].slice(0, 2)
      // 市区町村コードを取得
      const localGovCode = row["ZIPファイル名"].slice(0, 5)
      const isNinniZahyou = row["zip_filename"] !== null

      if (exportJSON[prefCode] === undefined) {
        exportJSON[prefCode] = {
          "total": 0,
          "ninni_zahyou": 0,
          "kokyo_zahyou": 0,
        }
      }

      if (exportJSON[prefCode][localGovCode] === undefined) {
        exportJSON[prefCode][localGovCode] = {
          "total": 0,
          "ninni_zahyou": 0,
          "kokyo_zahyou": 0,
        }
      }


      exportJSON[prefCode]["total"] += 1
      exportJSON[prefCode][localGovCode]["total"] += 1

      if (isNinniZahyou) {
        exportJSON[prefCode]["ninni_zahyou"] += 1
        exportJSON[prefCode][localGovCode]["ninni_zahyou"] += 1
      } else {
        exportJSON[prefCode]["kokyo_zahyou"] += 1
        exportJSON[prefCode][localGovCode]["kokyo_zahyou"] += 1
      }

    },
    (err, all_count) => {
      console.log("all_count");
      console.log(all_count);
      
      db.close();
      fs.writeFileSync("./export.json", JSON.stringify(exportJSON, null, 2));

    }
  )
});