#!/usr/bin/env node

const fs = require('fs');
const { createArrayCsvWriter } = require('csv-writer')
const 筆countJSON = JSON.parse(fs.readFileSync('output/chiban-count.json', 'utf8'));

let pref = {}
let admins = {}
let baseObj = {
  total: 0,
  ninni_zahyou: 0,
  kokyo_zahyou: 0,
  special_chiban: 0
}

for (const [prefCode, prefData] of Object.entries(筆countJSON)) {

  if (!Number(prefCode)) {
    continue
  }

  if (!pref[prefCode]) {
    pref[prefCode] = {
      total: 0,
      ninni_zahyou: 0,
      kokyo_zahyou: 0,
      special_chiban: 0
    }
  }

  for (const [adminCode, value] of Object.entries(prefData)) {

    if (!admins[adminCode]) {
      admins[adminCode] = {
        total: 0,
        ninni_zahyou: 0,
        kokyo_zahyou: 0,
        special_chiban: 0
      }
    }

    admins[adminCode].total = value.total
    admins[adminCode].ninni_zahyou = value.ninni_zahyou
    admins[adminCode].kokyo_zahyou = value.kokyo_zahyou
    admins[adminCode].special_chiban = value.special_chiban
  }

  pref[prefCode].total = prefData.total
  pref[prefCode].ninni_zahyou = prefData.ninni_zahyou
  pref[prefCode].kokyo_zahyou = prefData.kokyo_zahyou
  pref[prefCode].special_chiban = prefData.special_chiban

}

// pref を csv に書き出す
const csvWriterPref = createArrayCsvWriter({
  path: `./output/pref-chiban-count.csv`,
  header: ['code', 'total', 'ninni_zahyou', 'kokyo_zahyou', 'special_chiban']
})

const prefCSV = []
for (const [prefCode, value] of Object.entries(pref)) {
  prefCSV.push([prefCode, value.total, value.ninni_zahyou, value.kokyo_zahyou, value.special_chiban])
}

csvWriterPref.writeRecords(prefCSV.sort())


// admins を csv に書き出す
const csvWriterAdmin = createArrayCsvWriter({
  path: `./output/admin-chiban-count.csv`,
  header: ['code', 'total', 'ninni_zahyou', 'kokyo_zahyou', 'special_chiban']
})

const adminCSV = []
for (const [adminCode, value] of Object.entries(admins)) {
  adminCSV.push([adminCode, value.total, value.ninni_zahyou, value.kokyo_zahyou, value.special_chiban])
}

csvWriterAdmin.writeRecords(adminCSV.sort())