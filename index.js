#!/usr/bin/env node

const sqlite3 = require("sqlite3");
const fs = require("fs");
const db = new sqlite3.Database("./all-search-list.sqlite3");
let exportJSON = {}

db.serialize(() => {

  db.each(
    "select ZIPファイル名 from search_list limit 100000",
    (err, row) => {

      // 都道府県コードを取得
      const prefCode = row["ZIPファイル名"].slice(0, 2)

      if (exportJSON[prefCode] === undefined) {
        exportJSON[prefCode] = {
          "pref_total": 0,
        }
      }

      exportJSON[prefCode]["pref_total"] += 1

      // 市区町村コードを取得
      const localGovCode = row["ZIPファイル名"].slice(0, 5)

      if (exportJSON[prefCode][localGovCode] === undefined) {
        exportJSON[prefCode][localGovCode] = {"total": 0}
      }

      exportJSON[prefCode][localGovCode]["total"] += 1

    },
    (err, all_count) => {
      console.log("all_count");
      console.log(all_count);
      
      db.close();
      fs.writeFileSync("./export.json", JSON.stringify(exportJSON, null, 2));

    }
  )
});