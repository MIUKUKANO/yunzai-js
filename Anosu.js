import fetch from 'node-fetch';
import { segment } from 'oicq';
import plugin from '../../lib/plugins/plugin.js';
import common from '../../lib/common/common.js';

//默认值为true，即使用转发消息 | false，即关闭转发消息 | ！！！！！建议当开启18+时务必开启 |修改好像也不用重启|
const useForwardMsg = true;

// 可配置的参数 | 修改这些参数好像无需重启 |
const params = {
  num: 1,           // 图片数量，范围在1-30之间，超出范围会返回一个空列表
  r18: 0,           // 年龄分级 '0' 全龄 | '1' 18+ | '2' 随机二选一
  size: 'original', // 图片尺寸 "original": "原图" | "regular": "作品详情页的略缩图" | "small": "p站首页的略缩图"
  keyword: '',      // 图片tags关键字，关键词均来自p站，可用'|'作为分隔符，如 'genshin|loli'
  proxy: 'i.pixiv.re', // 使用一个固定的反代地址
  db: 0             // 使用的图库（数据库） 0对应新的图库 | 1对应旧的图库
};

export class SeTu extends plugin {
  constructor() {
    super({
      name: 'Anosu',
      dsc: '发送今日涩图',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#?今日涩图|涩涩$',
          fnc: 'sendSeTu'
        }
      ]
    });
    console.log('SeTu 插件已初始化。');
  }

  async sendSeTu(e) {
    // 发送准备开始涩涩的消息
    await e.reply('准备开始涩涩！');

    const queryString = new URLSearchParams(params).toString();
    const url = `https://image.anosu.top/pixiv/json?${queryString}`;

    try {
      console.log(`获取 URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP 错误！状态码: ${response.status}`);
      }

      const data = await response.json();
      console.log(`响应数据: ${JSON.stringify(data)}`);

      if (!Array.isArray(data) || data.length === 0) {
        e.reply('今日没有涩图，请稍后再试。');
        return;
      }

      // 为每张图片创建单独的消息
      const imageMessages = data.map(imageData => {
        const { title, user, pid, r18, tags, url: imageUrl } = imageData;
        return [
          segment.text(`【涩图】\n`),
          segment.text(`标题：${title}\n`),
          segment.text(`画师：${user}\n`),
          segment.text(`Pid：${pid}\n`),
          segment.text(`R18：${r18 === 1 ? '是' : '否'}\n`),
          segment.text(`Tags：${tags.join('，')}\n`),
          segment.image(imageUrl)
        ];
      });

      if (useForwardMsg) {
        // 创建并发送包含所有图片的转发消息
        const forwardMsg = await this.makeForwardMsg(e, imageMessages);
        if (!forwardMsg) {
          e.reply('消息发送失败，可能被风控');
          return;
        }
        await e.reply(forwardMsg);
      } else {
        // 直接发送每条图片消息
        for (const imageMsg of imageMessages) {
          await e.reply(imageMsg);
        }
      }

    } catch (err) {
      console.error(`获取图片出错: ${err.message}`);
      e.reply('获取涩图失败，请稍后再试。');
    }
  }

  /**
   * 制作转发消息
   * @param {Object} e - 消息事件
   * @param {Array} messages - 要转发的消息数组
   * @returns {Promise<string>} - 转发消息的内容
   */
  async makeForwardMsg(e, messages) {
    try {
      const forwardMsg = await common.makeForwardMsg(e, messages, ['-----今日涩图-----']);
      return forwardMsg;
    } catch (err) {
      console.error(`创建转发消息出错: ${err.message}`);
      return null;
    }
  }
}
