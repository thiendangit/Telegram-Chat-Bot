const express = require('express');
const router = express.Router();
const nodeXlsx = require('node-xlsx');
const TelegramUserModel = require('../models/TelegramUser');
const MessageModel = require('../models/Message');

// Khi client truy cập router này thì server sẽ export ngay file excel xuống client
router.get('/export-download', function (req, res) {
  let dataExcel = [];
  MessageModel.find({}, { '_id': 0, 'text': 1, 'createdAt': 1, 'is_bot': 1 }, {}).populate('telegram_user', { '_id': 0, 'first_name': 1 })
    .then(datas => {
      // console.log(datas)
      datas = formatData(datas);
      // console.log(datas)

      // Lay du lieu header cho file excel <=> lay cac key name trong collection
      let arrHeaderTitle = [];

      Object.keys(datas[0]).forEach(key => {
        arrHeaderTitle.push(key);
      });

      dataExcel.push(arrHeaderTitle);  // push header vao mang dataExcel

      // Lay du lieu cac row tuong ung voi header <=> lay cac value tuong ung voi key name o tren
      for (let item of datas) {
        let rowItemValue = [];
        Object.keys(item).forEach(key => {
          rowItemValue.push(item[key]);
        });
        dataExcel.push(rowItemValue); // push tung dong value vao mang dataExcel
      }

      let buffer = nodeXlsx.build([{ name: "List User", data: dataExcel }]); // Returns a buffer
      res.attachment('message-database.xlsx');
      res.send(buffer);
    })
    .catch(err => res.status(400).json(err));
});

function formatData(inputs) {
  let result = [];
  if (inputs.length > 0) {
    for (const iterator of inputs) {
      let action = iterator.is_bot == true ? "response" : "request";
      result.push({ telegram_user: iterator.telegram_user.first_name, text: iterator.text, datetime: iterator.createdAt, action: action })
    }
  }
  return result;
}

module.exports = router;