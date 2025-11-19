#!/usr/bin/env node

const sqlite3 = require("sqlite3");
const fs = require("fs");
const progressBar = require("progress-bar-cli");
let startTime = new Date();
let totalCount = 0; // 全データ数
let offset = 0;
const chunkSize = 3125000; // 1回に取得するデータ数
const db = new sqlite3.Database("./all-search-list.sqlite3");
let exportJSON = {
  exclude: 0,
  total: 0,
};

db.serialize(() => {

  db.get("SELECT count(*) as count FROM search_list;", (err, count) => {

    totalCount = count.count;
    console.log("totalCount: " + totalCount)
    processChunk();

  });
});

function processChunk() {
  db.all(
    "SELECT \"ZIPファイル名\",zip_filename,\"地番\" FROM search_list LEFT JOIN ninni_zahyou on ninni_zahyou.zip_filename = search_list.'ZIPファイル名' LIMIT ? OFFSET ?;",
    [chunkSize, offset],
    (err, rows) => {

      progressBar.progressBar(offset, totalCount, startTime);

      for (let i = 0; i < rows.length; i++) {

        const row = rows[i];
        const prefCode = row["ZIPファイル名"].slice(0, 2) // 都道府県コードを取得
        let localGovCode = row["ZIPファイル名"].slice(0, 5) // 市区町村コードを取得
        const isNinniZahyou = row["zip_filename"] !== null // 任意座標かどうか
        // 地番住所かどうか (参考リンク: https://www1.touki.or.jp/pdf/tiban_group.pdf)
        // ※めがね地番、二重地番、分属管理地番は重複してカウント (参考リンク: https://www.moj.go.jp/content/000116464.pdf#page=15)
        const isAddressChiban = (
          (
            row["地番"].match(/^[-0-9A-Uぁ-んｦ-ﾟヰヱ子丑寅卯辰巳午未申酉戌亥東西南北内外上中下甲乙丙丁戊己庚辛壬癸第号区]+((V|W)\d+|X\(\d+\/\d+\))?$/)
            // 愛媛県の耕地を含む地番を考慮
            || row["地番"].match(/^[0-9]+-耕地[-0-9A-U甲乙丙丁戊己庚辛壬癸]+((V|W)\d+|X\(\d+\/\d+\))?$/)
          )
          // 先頭・末尾のハイフン、連続ハイフン、同一グループ文字の連続は除外
          && !row["地番"].match(/(^-|-$|\-{2}|[A-U]{2}|[ぁ-ん]{2}|[ｦ-ﾟヰヱ]{2}|[子丑寅卯辰巳午未申酉戌亥]{2}|[東西南北]{2}|[内外]{2}|[上中下]{2}|[甲乙丙丁戊己庚辛壬癸]{2}|[第号区]{2})/)
        );
        const isSpecialChiban = !isAddressChiban // 地番住所以外の地番は除外
        const isCSVHeader = row["ZIPファイル名"] === "ZIPファイル名" // CSV のヘッダーかどうか
        
        // NOTE: reference => https://www.soumu.go.jp/main_content/000562726.pdf
        if (localGovCode === "01439") {
          localGovCode = "01472" //幌延町の市区町村コードを更新
        }

        if (localGovCode === "01488") {
          localGovCode = "01520" //幌加内町の市区町村コードを更新
        }
                
        // search_list に CSV のヘッダーが入っているので、それを除外する
        if (isCSVHeader) {
          exportJSON.exclude += 1
          continue;
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
      }

      offset += chunkSize;

      if (offset < totalCount) {
        processChunk();
      } else {
        console.log("finish");
        // 全データ処理が終了したら、以下の処理を実行
        db.close();
        fs.writeFileSync("./output/chiban-count.json", JSON.stringify(exportJSON, null, 2));
      }
    }
  );
}
