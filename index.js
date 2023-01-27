#!/usr/bin/env node

const sqlite3 = require("sqlite3");
const fs = require("fs");
const db = new sqlite3.Database("./all-search-list.sqlite3");
let exportJSON = {}

const get = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
}

const all = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
}

(async () => {

  // 日本全国の筆数を取得
  const total = await get("select count(*) from search_list")
  exportJSON["total"] = total["count(*)"]

  // search_list から 全てのデータを取得し、for 文で 市区町村事にカウントしたい
  const search_list = await all("select ZIPファイル名 from search_list")  

  db.close();

  fs.writeFileSync("./export.json", JSON.stringify(exportJSON, null, 2));
})();