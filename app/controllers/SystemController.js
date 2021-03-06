const express = require('express');
const router = express.Router();
const nodeXlsx = require('node-xlsx');
const TelegramUserModel = require('../models/TelegramUser');
const MessageModel = require('../models/Message');
const NewsModel = require('../models/News');

const axios = require('axios')

router.post('/sendNews', (req, res) => {
  // console.log(req);
  TelegramUserModel.find({ is_receive_news: true }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result.length > 0) {
        for (const key of result) {
          axios
            .post(
              'https://api.telegram.org/bot1239970044:AAFG7aUPL5i9lPMMCk-m2_pkiOdjemZMs3I/sendMessage',
              {
                chat_id: key.uid,
                text: req.query.message
              }
            )
            .then(response => {
              // We get here if the message was successfully posted
              console.log('Message posted')
              res.end('OK')
            })
            .catch(err => {
              // ...and here if it was not
              console.log('Error :', err)
              res.end('Error :' + err)
            })

          let mess = new MessageModel({
            telegram_user: key._id,
            text: req.query.message,
            is_bot: true
          });

          mess.save(function (err) {
            if (err) console.log(err)
          }
            // .catch(error => {
            //   console.log(error);
            // })
          );

        }
        let news = new NewsModel({
          text: req.query.message
        });

        news.save(function (err) {
          if (err) console.log(err)
        }
          // .catch(error => {
          //   console.log(error);
          // })
        );
      }
    }
  });

  res.status(200).json({
    message: "Send news successfully",
    // message: req.query.message,
    // user: req.user,
    // token: req.query.secret_token
  });

});

router.get('/exportDownload', function (req, res) {
  TelegramUserModel.find({})
    .then(data => {
      var messsage_datas = [];
      let count = 0;
      for (const dt of data) {
        count++;
        MessageModel.find({ telegram_user: dt._id }, { '_id': 0, 'text': 1, 'createdAt': 1, 'is_bot': 1 }, {}).populate('telegram_user', { '_id': 0, 'first_name': 1 })
          .then(datas => {
            messsage_datas.push(datas)
            if (messsage_datas.length == count) {
              var result = [];
              for (const messsage_data of messsage_datas) {
                let data;
                data = formatData(messsage_data);
                result.push(data);
                // console.log(datas)
              }

              if (result.length > 0) {
                let excel_data = [];
                for (const iterator of result) {
                  let dataExcel = [];
                  let arrHeaderTitle = [];

                  Object.keys(iterator.messages[0]).forEach(key => {
                    arrHeaderTitle.push(key);
                  });

                  // Lay du lieu header cho file excel <=> lay cac key name trong collection

                  dataExcel.push(arrHeaderTitle);  // push header vao mang dataExcel

                  // Lay du lieu cac row tuong ung voi header <=> lay cac value tuong ung voi key name o tren
                  for (let item of iterator.messages) {
                    let rowItemValue = [];
                    Object.keys(item).forEach(key => {
                      rowItemValue.push(item[key]);
                    });
                    dataExcel.push(rowItemValue); // push tung dong value vao mang dataExcel
                  }
                  excel_data.push({ name: iterator.telegram_user_name, data: dataExcel });
                }
                // console.log({ result })
                let buffer = nodeXlsx.build(excel_data); // Returns a buffer
                res.attachment('message-database.xlsx');
                res.send(buffer);
              }
            }
          })
      }
    })
    .catch(err => res.status(400).json(err));

  // MessageModel.find({}, { '_id': 0, 'text': 1, 'createdAt': 1, 'is_bot': 1 }, {}).populate('telegram_user', { '_id': 0, 'first_name': 1 })
  //   .then(datas => {
  //     // console.log(datas)
  //     datas, telegram_user_names = formatData(datas);
  //     // console.log(datas)
  //     console.log(telegram_user_names)

  //     // Lay du lieu header cho file excel <=> lay cac key name trong collection
  //     let arrHeaderTitle = [];

  //     Object.keys(datas[0]).forEach(key => {
  //       arrHeaderTitle.push(key);
  //     });

  //     dataExcel.push(arrHeaderTitle);  // push header vao mang dataExcel

  //     // Lay du lieu cac row tuong ung voi header <=> lay cac value tuong ung voi key name o tren
  //     for (let item of datas) {
  //       let rowItemValue = [];
  //       Object.keys(item).forEach(key => {
  //         rowItemValue.push(item[key]);
  //       });
  //       dataExcel.push(rowItemValue); // push tung dong value vao mang dataExcel
  //     }


  //     let buffer = nodeXlsx.build([{ name: "List User", data: dataExcel }, { name: "mySecondSheet", data: dataExcel }]); // Returns a buffer

  //     res.attachment('message-database.xlsx');
  //     res.send(buffer);
  //   })
  //   .catch(err => res.status(400).json(err));
});

router.get('/exportDownloadById', function (req, res) {
  let dataExcel = [];
  if (req.query.id != undefined) {
    MessageModel.find({ telegram_user: req.query.id }, { '_id': 0, 'text': 1, 'createdAt': 1, 'is_bot': 1 }, {}).populate('telegram_user', { '_id': 0, 'first_name': 1 })
      .then(datas => {
        // console.log(datas)
        datas = formatData(datas);
        // console.log(datas)

        // Lay du lieu header cho file excel <=> lay cac key name trong collection
        let arrHeaderTitle = [];

        Object.keys(datas.messages[0]).forEach(key => {
          arrHeaderTitle.push(key);
        });

        dataExcel.push(arrHeaderTitle);  // push header vao mang dataExcel

        // Lay du lieu cac row tuong ung voi header <=> lay cac value tuong ung voi key name o tren
        for (let item of datas.messages) {
          let rowItemValue = [];
          Object.keys(item).forEach(key => {
            rowItemValue.push(item[key]);
          });
          dataExcel.push(rowItemValue); // push tung dong value vao mang dataExcel
        }

        let buffer = nodeXlsx.build([{ name: datas.telegram_user_name != "" ? datas.telegram_user_name + "' messages" : "messages", data: dataExcel }]); // Returns a buffer
        res.attachment('message-database.xlsx');
        res.send(buffer);
      })
      .catch(err => res.status(400).json(err));

  } else {
    res.status(400).json({
      message: "id not find",
      // user: req.user,
      // token: req.query.secret_token
    });
  }

});

router.get('/getHistoryNews', (req, res) => {
  // console.log(req);
  NewsModel.find({}, function (err, result) { })
    .then(datas => {
      if (datas.length > 0) {
        let response = {
          message: "Get history news successfully!",
          data: datas,
          count: datas.length
          // token: req.query.secret_token
        }
        res.send(response);
      }

    })
    .catch(err => res.status(200).json({
      message: "Get history news successfully!",
      data: [],
      count: 0
      // token: req.query.secret_token

    }));
});

router.get('/dashBoard', (req, res) => {
  MessageModel.find({}, { '_id': 0, 'text': 1, 'createdAt': 1, 'is_bot': 1 }, {}).populate('telegram_user', { '_id': 1, 'first_name': 1 })
    .then(datas => {
      // console.log(datas)
      if (datas.length > 0) {
        let list_telegram_user = listTelegramUser(datas);
        console.log({ list_telegram_user })
        let response = {
          message: "Get data successfully!",
          data: {
            'user_count': list_telegram_user.length,
            'message_count': datas.length
          }
          // token: req.query.secret_token
        }
        res.send(response);
      }

    })
    .catch(err => res.status(200).json({
      message: "Get data successfully!",
      data: {
        'user_count': 0,
        'message_count': 0
      }
    }));

});

function formatData(inputs) {
  let messages = [];
  let telegram_user_name = "";
  let result;
  if (inputs.length > 0) {
    for (const iterator of inputs) {
      let name = iterator.is_bot == true ? "Bot" : iterator.telegram_user.first_name;
      var dt = new Date(iterator.createdAt);
      var dt_format = dt.toString('en-US', { timeZone: 'Asia/Bangkok' })
      // console.log(dt_format);
      messages.push({ user: name, context: iterator.text, datetime: dt_format })
      telegram_user_name = iterator.telegram_user.first_name;
    }
  }
  result = { "telegram_user_name": telegram_user_name, "messages": messages };
  // console.log({ result });

  return result;
}

function listTelegramUser(inputs) {
  let result = [];
  if (inputs.length > 0) {
    for (const iterator of inputs) {
      if (result.includes(iterator.telegram_user._id) == false) {
        result.push(iterator.telegram_user._id);
      }
    }
  }
  return result;
}

module.exports = router;