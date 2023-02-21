法務省が公開している登記所備付地図データを、任意座標、公共座標に分けて、都道府県、市区町村ごとに集計した JSON を出力するスクリプトです。


## 使い方

### 1. データのダウンロード

登記所備付地図データを、任意座標、公共座標別で、XMLファイルに分類したデータが保存されている、SQLite を以下のURLからダウンロードし、ディレクトリ内に配置してください。

https://s3.console.aws.amazon.com/s3/object/gl-moj-map-mirror?region=ap-northeast-1&prefix=all-search-list.sqlite3  
（Geolonia のAWSマネジメントコンソールへのログインが必要です）

`./all-search-list.sqlite3`

### 2. 集計

`npm run build` で、`./output/`ディレクトリ内に、JSONファイル(`chiban-count.json`) と CSV ファイル(`pref-chiban-count.csv`(都道府県)、`admin-chiban-count.csv`（市区町村）)を作成します。 CSVファイルは、集計した JSON ファイルを、都道府県、市区町村別に CSV に変換したものです。

- 所要時間: 2時間程度
- メモリ16GB以上を推奨します


```
{
  "10": { // 都道府県コード
    "total": 4577560, // 合計
    "ninni_zahyou": 2395234, // 任意座標集計
    "kokyo_zahyou": 1683358, // 公共座標集計
    "special_chiban": 498968, // 数字以外で始まる特殊な地番（/^[0-9]/）の集計。任意座標と公共座標の集計からは除外。
    "10201": { // 市区町村コード
      "total": 464312,
      "ninni_zahyou": 201796,
      "kokyo_zahyou": 227872,
      "special_chiban": 34644
    },
    "10202": {
      "total": 633941,
      "ninni_zahyou": 365780,
      "kokyo_zahyou": 206071,
      "special_chiban": 62090
    },
```
