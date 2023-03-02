#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createArrayCsvWriter } = require('csv-writer')
const { parse } = require('csv-parse/sync');

async function exportCSV() {

  const file = fs.readFileSync(path.join(__dirname, 'output', 'admin-chiban-count.csv'), 'utf8')
  const raw = parse(file);

  const adminCodeListRaw = fs.readFileSync(path.join(__dirname, 'output', 'admin-code-list.csv'), 'utf8')
  const adminCodeList = parse(adminCodeListRaw);

  const outCSV = []

  for (let i = 0; i < adminCodeList.length; i++) {
    const code = adminCodeList[i][0];

    const item = raw.find((item) => {
      return item[0] === code
    })

    outCSV.push(item)
  }

  const csvWriter = createArrayCsvWriter({
    header: ['code','total','ninni_zahyou','kokyo_zahyou','special_chiban'],
    path: "./output/admin-chiban-count-filtered.csv",
  })

  csvWriter.writeRecords(outCSV)
}

exportCSV()
