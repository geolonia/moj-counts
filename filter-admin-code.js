#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { globSync } = require("glob")
const { createArrayCsvWriter } = require('csv-writer');
const { parse } = require('csv-parse/sync');


async function exportCSV() {

  const file = fs.readFileSync(path.join(__dirname, 'output', 'admin-chiban-count.csv'), 'utf8')
  const raw = parse(file);

  const admins = globSync(`./admins/**/*.json`);

  const outCSV = []

  for (const admin of admins) {

    const code = admin.split('/')[2].split('.')[0]

    const item = raw.find((item) => {
      return item[0] === code
    })

    // 北方領土のコードは、法務省登記所備付地図データには存在しないのでスキップ
    if (!item || item === undefined) {
      console.log(`Not found: ${code}`)
      continue
    }
    outCSV.push(item)
  }

  const csvWriter = createArrayCsvWriter({
    header: ['code','total','ninni_zahyou','kokyo_zahyou','special_chiban'],
    path: "./output/admin-chiban-count-filtered.csv",
  })

  csvWriter.writeRecords(outCSV)
}

exportCSV()
