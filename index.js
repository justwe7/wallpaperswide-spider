const superagent = require('superagent')
const cheerio = require('cheerio')
const Axios = require('axios')
const Qs = require('qs')
const fs = require('fs')
const path = require('path')

/* superagent
  .get('https://wall.alphacoders.com/by_sub_category.php')
  .query({ id: '200352', name: '银魂', lang: 'Chinese', page: 1 }) // query string
  .end((err, res) => {
    if (err) {
      console.log('页面请求出错');
      return false
    }
    console.log('开始抓取')
    parsePage(res).then(res => {
      console.log(`共下载【${res}】张壁纸`)
    })
  }) */
superagent
  .get(
    'https://wall.alphacoders.com/by_sub_category.php?id=200352&name=%E9%93%B6%E9%AD%82+%E5%A3%81%E7%BA%B8&lang=Chinese&page=1'
  )
  .end((err, res) => {
    if (err) {
    } else {
      console.log('开始抓取')
      parsePage(res).then(res => {
        console.log(`共下载【${res}】张壁纸`)
      })
    }
  })

/* 
downloadFile(
  'https://initiate.alphacoders.com/download/wallpaper/740094/images/jpg/1577657351069340/86009',
  'picture'
)
 */
async function parsePage(con) {
  /* 使用cheerio模块的cherrio.load()方法，将HTMLdocument作为参数传入函数
     以后就可以使用类似jQuery的$(selectior)的方式来获取页面元素
   */
  let $ = cheerio.load(con.text)
  let axiosTask = []
  // 找到目标数据所在的页面元素，获取数据
  $('span.download-button').each(async (idx, el) => {
    if (idx > 10) {
      return false
    }
    const $node = $(el)
    const data = {
      wallpaper_id: $node.attr('data-id'),
      type: $node.attr('data-type'),
      server: $node.attr('data-server'),
      user_id: $node.attr('data-user-id')
    }
    // pTask.push(new Promise((r)))
    axiosTask.push(httpGetImgUri(data))
    // console.log($(el).attr('data-user-id'))
  })
  // downloadFile
  return Promise.all(axiosTask).then(res => {
    return new Promise(async (resolve) => {
      await Promise.all(res.map(v => downloadFile(v)))
      resolve(axiosTask.length)
    })
  })
}


async function httpGetImgUri(data) {
  // https://wall.alphacoders.com/get_download_link.php
  // wallpaper_id: 740094 data-id
  // type: jpg  data-type
  // server: images  data-server
  // user_id: 86009  data-user-id
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Cookie:
        'wa_session=l4r613tu3dvj0e2aa95o7pmgmksd661ieo44vlo3k7mnslgr3b5jt80j6e8ld45n4kap9nq515uf2sb02q2ktdf3m0ct2osllmdl6l2; __cfduid=d15f4e91b27c432dda414c556e024afa51568553933; _ga=GA1.2.2058324984.1568553941; _gid=GA1.2.1047389303.1568553941; __gads=ID=d6980751d5067ae2:T=1568553940:S=ALNI_MbgT12l8k5MqfalRE1z-D7VCIx7aw'
    },
    data: Qs.stringify(data),
    url: 'https://wall.alphacoders.com/get_download_link.php'
  }
  return Axios(options)
    .then(function(response) {
      if (response.status === 200) {
        return response.data
      }
      return Promise.reject()
    })
    .catch(function(error) {
      return Promise.reject()
    })
}

async function downloadFile(url, filepath = 'picture') {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath)
  }
  const mypath = path.resolve(filepath, `${url.match('[^/]+(?!.*/)')[0]}.jpg`)
  const writer = fs.createWriteStream(mypath)
  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}
