import plugin from '../../lib/plugins/plugin.js'
import cfg from '../../lib/config/config.js'
import common from '../../lib/common/common.js'
import moment from "moment";
import fs from 'fs'
const path = process.cwd()

// 支持信息详见文件最下方
// 在这里设置事件概率,请保证概率加起来小于1，少于1的部分会触发反击
let reply_text = 0 // 文字回复概率
let reply_img = 0 // 图片回复概率
let reply_voice = 1 // 语音回复概率
let mutepick = 0 // 禁言概率
let example = 0 // 拍一拍表情概率
// 剩下的概率就是反击
let master = "主人"
let mutetime = 1 // 禁言时间设置，单位分钟，如果设置0则为自动递增，如需关闭禁言请修改触发概率为0

// 定义图片和语音文件存放路径
const chuo_path = path + '/resources/chuochuo/pic/';
const voice_path = path + '/resources/chuochuo/voice/';
const atri_path = path + '/resources/chuochuo/atri.json';

// 图片和语音文件的格式
const imageFormats = ['.jpg', '.gif', '.png', '.jpeg']; // 支持的图片格式
const voiceFormats = ['.mp3', '.wav', '.ogg']; // 支持的语音格式

// 获取目录下的所有文件
const getFiles = (dir, formats) => {
    return fs.readdirSync(dir).filter(file => formats.some(format => file.endsWith(format)));
}

// 获取支持的图片文件
const imageFiles = getFiles(chuo_path, imageFormats);

// 获取支持的语音文件
const voiceFiles = getFiles(voice_path, voiceFormats);

// 回复文字列表
const word_list = [
	  "啊我真是太高性能了",
    'Ciallo～(∠・ω< )⌒☆',
    '>_<！！！',
    'o(´^｀)o',
    '地球也包括我吗？',
    '你再戳,亚托莉要生气了哦',
    '好吃就是高兴嘛！',
    '我可是高性能机器人！',
];

const ciku_ = [
    "亚托莉今天已经被戳了_num_次啦，休息一下好不好",
    "亚托莉今天已经被戳了_num_次啦，有完没完！",
    "亚托莉今天已经被戳了_num_次啦，要戳坏掉了！",
    "亚托莉今天已经被戳了_num_次啦，别戳了!!!",
    "亚托莉今天已经被戳了_num_次啦，不准戳了！！！",
    "亚托莉今天已经被戳了_num_次啦，再戳就坏了！",
];

export class chuo extends plugin {
    constructor() {
        super({
            name: '亚托莉-戳一戳',
            dsc: '戳一戳亚托莉触发效果',
            event: 'notice.group.poke',
            priority: 5000,
            rule: [
                {
                    /** 命令正则匹配 */
                    fnc: 'chuoyichuo'
                }
            ]
        })
    }

    async chuoyichuo(e) {
        if (cfg.masterQQ.includes(e.target_id)) {
            logger.info('[戳主人生效]')
            if (cfg.masterQQ.includes(e.operator_id) || e.self_id == e.operator_id) {
                return;
            }
            e.reply([
                segment.at(e.operator_id),
                `\n你想干嘛, 竟敢戳我亲爱滴${master}, 胆子好大啊你`,
                segment.image(path + `/resources/chuochuo/生气.jpg`),
            ], true)
            await common.sleep(1000);
            e.group.pokeMember(e.operator_id);
            return true
        }
        
        if (e.target_id == e.self_id) {
            logger.info('[戳一戳生效]')
            let count = await redis.get(`Yz:pokecount:`);
            let group = Bot.pickGroup(e.group_id);
            let usercount = mutetime - 1
            if (mutetime == 0) {
                usercount = await redis.get('Yz:pokecount' + e.operator_id + ':')
            }

            // 当前时间
            let time = moment(Date.now())
                .add(1, "days")
                .format("YYYY-MM-DD 00:00:00");
            // 到明日零点的剩余秒数
            let exTime = Math.round(
                (new Date(time).getTime() - new Date().getTime()) / 1000
            );
            if (!count) {
                await redis.set(`Yz:pokecount:`, 1 * 1, { EX: exTime });//${e.group_id}
            } else {
                await redis.set(`Yz:pokecount:`, ++count, {
                    EX: exTime,
                });
            }
            if (mutetime == 0) {
                if (!usercount) {
                    await redis.set('Yz:pokecount' + e.operator_id + ':', 1 * 1, { EX: exTime });
                } else {
                    await redis.set('Yz:pokecount' + e.operator_id + ':', ++usercount, { EX: exTime, });
                }
            }
            if (Math.ceil(Math.random() * 100) <= 20 && count >= 10) {
                let conf = cfg.getGroup(e.group_id);
                e.reply([
                    `${ciku_[Math.round(Math.random() * (ciku_.length - 1))]}`
                        .replace("_name_", conf.botAlias[0])
                        .replace("_num_", count),
                ]);
                return true;
            }
            //生成0-100的随机数
            let random_type = Math.random()

            // 回复随机文字
            if (random_type < reply_text) {
                logger.info('[回复随机文字生效]')
                let text_number = Math.floor(Math.random() * word_list.length);
                e.reply(word_list[text_number]);
            }

            // 回复随机图片
            else if (random_type < (reply_text + reply_img)) {
                logger.info('[回复随机图片生效]')
                let photo_number = Math.floor(Math.random() * imageFiles.length);
                let photo_file = imageFiles[photo_number];
                e.reply(segment.image(chuo_path + photo_file));
            }

            // 回复随机语音
            else if (random_type < (reply_text + reply_img + reply_voice)) {
                logger.info('[回复随机语音生效]')
                let voice_number = Math.floor(Math.random() * voiceFiles.length);
                let voice_file = voiceFiles[voice_number];
                logger.info(`[语音回复] 发送语音文件: ${voice_file}`);
                e.reply(segment.record(voice_path + voice_file));

                // 读取 atri.json 文件并匹配文本
                let atri_json;
                try {
                    atri_json = JSON.parse(fs.readFileSync(atri_path, 'utf8'));
                } catch (err) {
                    logger.error('读取或解析 atri.json 文件失败:', err);
                    return;
                }

                // 查找与当前语音文件名匹配的文本
                let matched_entry = Object.entries(atri_json).find(([key, value]) => {
                    return value.o === voice_file;
                });

                if (matched_entry) {
                    let response_text = matched_entry[1].s;
                    e.reply(response_text);
                } else {
                    logger.info('未找到与语音文件匹配的文本');
                }
            }

            // 禁言用户
            else if (random_type < (reply_text + reply_img + reply_voice + mutepick)) {
                logger.info('[禁言生效]')
                logger.info(e.operator_id + `将要被禁言${usercount + 1}分钟`)
                if (usercount >= 36) {
                    e.reply('我生气了！小黑屋冷静冷静')
                    await common.sleep(1000)
                    await e.group.muteMember(e.operator_id, 21600)
                    return
                }
                // 随机选择禁言方式
                let mutetype = Math.ceil(Math.random() * 4)
                if (mutetype == 1) {
                    e.reply('我生气了！砸挖撸多!木大！木大木大！')
                    await common.sleep(1000)
                    await e.group.muteMember(e.operator_id, 60 * (usercount + 1))
                } else if (mutetype == 2) {
                    e.reply('不！！')
                    await common.sleep(1000);
                    e.reply('准！！')
                    await common.sleep(1000);
                    e.reply('戳！！')
                    await common.sleep(1000);
                    await e.group.muteMember(e.operator_id, 60 * (usercount + 1))
                    await common.sleep(1000);
                    e.reply('！！')
                    return
                } else if (mutetype == 3) {
                    e.reply('看我超级亚托莉旋风！')
                    await common.sleep(1000)
                    await e.group.pokeMember(e.operator_id)
                    await e.group.muteMember(e.operator_id, 60 * (usercount + 1))
                    await common.sleep(1000);
                    return
                } else if (mutetype == 4) {
                    e.reply('哼，我可是会还手的哦!')
                    await common.sleep(1000)
                    await e.group.pokeMember(e.operator_id)
                    await e.group.muteMember(e.operator_id, 60 * (usercount + 1))
                    return
                }
            }

            // 拍一拍表情包
            else if (random_type < (reply_text + reply_img + reply_voice + mutepick + example)) {
                await e.reply(await segment.image(`http://ovooa.com/API/face_pat/?QQ=${e.operator_id}`))
            }

            // 默认反击回复
            else {
                logger.info('[反击生效]')
                e.reply('你戳得过我吗');
                await e.group.pokeMember(e.operator_id)
                }

            return true;
        }
    }
	}
